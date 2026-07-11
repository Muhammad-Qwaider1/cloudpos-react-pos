import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { search?: string; category?: string; activeOnly?: boolean } = {}) {
    const where: any = {};
    if (params.activeOnly) where.active = true;
    if (params.category) where.category = { contains: params.category, mode: 'insensitive' };
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { barcode: { contains: params.search } },
      ];
    }
    return this.prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findByBarcode(barcode: string) {
    return this.prisma.product.findUnique({ where: { barcode } });
  }

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async updateStock(id: string, newQuantity: number, userId: string, userName: string, reason: string, referenceId?: string) {
    const product = await this.findOne(id);
    const oldQty = product.stock_quantity;
    const updated = await this.prisma.product.update({
      where: { id },
      data: { stock_quantity: newQuantity },
    });

    // Log stock movement
    await this.prisma.stockMovement.create({
      data: {
        product_id: id,
        user_id: userId,
        change_quantity: newQuantity - oldQty,
        previous_stock: oldQty,
        new_stock: newQuantity,
        reason: reason as any,
        reference_id: referenceId,
        reference_type: reason === 'sale' || reason === 'void' ? 'invoice' : 'manual',
      },
    });

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
  }

  async getLowStock() {
    return this.prisma.product.findMany({
      where: {
        active: true,
        stock_quantity: { lte: this.prisma.product.fields.min_stock_alert },
      },
      orderBy: { stock_quantity: 'asc' },
    });
  }
}