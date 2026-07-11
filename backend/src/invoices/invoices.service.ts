import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateInvoiceDto, VoidInvoiceDto, ReturnInvoiceDto } from './dto/invoice.dto';
import { AuditService } from '../audit/audit.service';
import { DiscountType, InvoiceStatus } from '@prisma/client';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private auditService: AuditService,
  ) {}

  async findAll(params: {
    page?: number; limit?: number; status?: string; search?: string;
  } = {}) {
    const { page = 1, limit = 50, status, search } = params;
    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { invoice_number: { contains: search, mode: 'insensitive' } },
        { customer_name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { items: true },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async create(dto: CreateInvoiceDto, user: any) {
    const taxRate = parseFloat(this.configService.get('DEFAULT_TAX_RATE', '0.15'));

    // Calculate totals
    let subtotal = 0;
    let totalTax = 0;

    const itemsData = dto.items.map(item => {
      const gross = item.unit_price * item.quantity;
      const itemDisc = item.discount_type === 'PERCENTAGE'
        ? gross * (item.discount_value || 0) / 100
        : (item.discount_value || 0);
      const net = Math.max(0, gross - itemDisc);
      subtotal += net;

      const itemTaxRate = item.tax_exempt ? 0 : taxRate;
      totalTax += net * itemTaxRate;

      return {
        product_id: item.product_id,
        product_name: item.product_name,
        barcode: item.barcode,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_value: item.discount_value || 0,
        discount_type: (item.discount_type || 'PERCENTAGE') as DiscountType,
        line_total: net,
        tax_exempt: item.tax_exempt || false,
      };
    });

    const invDisc = dto.discount_type === 'PERCENTAGE'
      ? subtotal * (dto.discount_value || 0) / 100
      : (dto.discount_value || 0);
    const total = Math.max(0, subtotal - invDisc + totalTax);
    const itemCount = itemsData.reduce((s, i) => s + i.quantity, 0);

    const invoice_number = 'INV-' + Date.now();

    // Use transaction to ensure atomicity
    const invoice = await this.prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          invoice_number,
          user_id: user.id,
          customer_id: dto.customer_id || null,
          customer_name: dto.customer_name || 'Walk-in Customer',
          shift_id: dto.shift_id || null,
          subtotal,
          discount_value: dto.discount_value || 0,
          discount_type: (dto.discount_type || 'PERCENTAGE') as DiscountType,
          tax_rate: taxRate,
          tax_amount: totalTax,
          total,
          payment_cash: dto.payment_cash || 0,
          payment_card: dto.payment_card || 0,
          payment_other: dto.payment_other || 0,
          change_given: dto.change_given || 0,
          status: InvoiceStatus.COMPLETED,
          item_count: itemCount,
          notes: dto.notes,
          items: { create: itemsData },
        },
        include: { items: true },
      });

      // Deduct stock + create stock movements
      for (const item of itemsData) {
        if (!item.product_id) continue;
        const product = await tx.product.findUnique({ where: { id: item.product_id } });
        if (!product) continue;

        const newStock = Math.max(0, product.stock_quantity - item.quantity);
        await tx.product.update({
          where: { id: item.product_id },
          data: { stock_quantity: newStock },
        });
        await tx.stockMovement.create({
          data: {
            product_id: item.product_id,
            user_id: user.id,
            change_quantity: -item.quantity,
            previous_stock: product.stock_quantity,
            new_stock: newStock,
            reason: 'SALE',
            reference_id: inv.id,
            reference_type: 'invoice',
          },
        });
      }

      // Update shift if provided
      if (dto.shift_id) {
        const shift = await tx.shift.findUnique({ where: { id: dto.shift_id } });
        if (shift && shift.status === 'OPEN') {
          await tx.shift.update({
            where: { id: dto.shift_id },
            data: {
              total_sales: { increment: total },
              total_cash_sales: { increment: dto.payment_cash || 0 },
              expected_cash: { increment: dto.payment_cash || 0 },
              invoice_count: { increment: 1 },
            },
          });
        }
      }

      return inv;
    });

    await this.auditService.log({
      userId: user.id, userName: user.full_name, userRole: user.role,
      action: 'create_invoice', entityType: 'Invoice', entityId: invoice.id,
      newValue: { invoice_number, total },
    });

    return invoice;
  }

  async void(id: string, dto: VoidInvoiceDto, user: any) {
    const invoice = await this.findOne(id);
    if (invoice.status === 'VOIDED') throw new BadRequestException('Invoice already voided');

    if (!['ADMIN', 'SUPERVISOR'].includes(user.role)) {
      throw new ForbiddenException('Only admin or supervisor can void invoices');
    }

    return this.prisma.$transaction(async (tx) => {
      for (const item of invoice.items) {
        if (!item.product_id) continue;
        const product = await tx.product.findUnique({ where: { id: item.product_id } });
        if (!product) continue;
        const newStock = product.stock_quantity + item.quantity;
        await tx.product.update({
          where: { id: item.product_id },
          data: { stock_quantity: newStock },
        });
        await tx.stockMovement.create({
          data: {
            product_id: item.product_id,
            user_id: user.id,
            change_quantity: item.quantity,
            previous_stock: product.stock_quantity,
            new_stock: newStock,
            reason: 'VOID',
            reference_id: invoice.id,
            reference_type: 'invoice',
            notes: dto.reason,
          },
        });
      }

      const updated = await tx.invoice.update({
        where: { id },
        data: { status: 'VOIDED', void_reason: dto.reason },
      });

      if (invoice.shift_id) {
        const shift = await tx.shift.findUnique({ where: { id: invoice.shift_id } });
        if (shift && shift.status === 'OPEN') {
          await tx.shift.update({
            where: { id: invoice.shift_id },
            data: {
              total_sales: { decrement: invoice.total },
              total_cash_sales: { decrement: invoice.payment_cash },
              expected_cash: { decrement: invoice.payment_cash },
              invoice_count: { decrement: 1 },
            },
          });
        }
      }

      return updated;
    });
  }

  async returnInvoice(id: string, dto: ReturnInvoiceDto, user: any) {
    const invoice = await this.findOne(id);
    if (invoice.status !== 'COMPLETED') throw new BadRequestException('Only completed invoices can be returned');

    if (!['ADMIN', 'SUPERVISOR'].includes(user.role)) {
      throw new ForbiddenException('Only admin or supervisor can process returns');
    }

    return this.prisma.$transaction(async (tx) => {
      for (const item of invoice.items) {
        if (!item.product_id) continue;
        const product = await tx.product.findUnique({ where: { id: item.product_id } });
        if (!product) continue;
        const newStock = product.stock_quantity + item.quantity;
        await tx.product.update({
          where: { id: item.product_id },
          data: { stock_quantity: newStock },
        });
        await tx.stockMovement.create({
          data: {
            product_id: item.product_id,
            user_id: user.id,
            change_quantity: item.quantity,
            previous_stock: product.stock_quantity,
            new_stock: newStock,
            reason: 'RETURN',
            reference_id: invoice.id,
            reference_type: 'invoice',
            notes: dto.reason,
          },
        });
      }

      const updated = await tx.invoice.update({
        where: { id },
        data: { status: 'RETURNED', return_reason: dto.reason },
      });

      await this.auditService.log({
        userId: user.id, userName: user.full_name, userRole: user.role,
        action: 'return_invoice', entityType: 'Invoice', entityId: id,
        details: dto.reason,
      });

      return updated;
    });
  }
}