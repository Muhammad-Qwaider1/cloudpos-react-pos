import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OpenShiftDto, CloseShiftDto, CashMovementDto } from './dto/shift.dto';

@Injectable()
export class ShiftsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll() {
    return this.prisma.shift.findMany({
      orderBy: { opened_at: 'desc' },
      take: 50,
      include: { user: { select: { full_name: true, email: true } } },
    });
  }

  async getOpenShift(userId: string) {
    return this.prisma.shift.findFirst({
      where: { user_id: userId, status: 'OPEN' },
    });
  }

  async open(dto: OpenShiftDto, user: any) {
    // Check if user already has an open shift
    const existing = await this.getOpenShift(user.id);
    if (existing) throw new BadRequestException('You already have an open shift');

    const shift = await this.prisma.shift.create({
      data: {
        user_id: user.id,
        opening_cash: dto.opening_cash,
        expected_cash: dto.opening_cash,
        status: 'OPEN',
        opened_at: new Date(),
      },
    });

    await this.auditService.log({
      userId: user.id, userName: user.full_name, userRole: user.role,
      action: 'open_shift', entityType: 'Shift', entityId: shift.id,
      newValue: { opening_cash: dto.opening_cash },
    });

    return shift;
  }

  async close(id: string, dto: CloseShiftDto, user: any) {
    const shift = await this.prisma.shift.findUnique({ where: { id } });
    if (!shift) throw new NotFoundException('Shift not found');
    if (shift.status === 'CLOSED') throw new BadRequestException('Shift already closed');

    const discrepancy = dto.counted_cash - shift.expected_cash;

    const updated = await this.prisma.shift.update({
      where: { id },
      data: {
        counted_cash: dto.counted_cash,
        discrepancy,
        status: 'CLOSED',
        closed_at: new Date(),
        notes: dto.notes,
      },
    });

    await this.auditService.log({
      userId: user.id, userName: user.full_name, userRole: user.role,
      action: 'close_shift', entityType: 'Shift', entityId: id,
      newValue: { counted_cash: dto.counted_cash, discrepancy },
      details: `Discrepancy: ${discrepancy.toFixed(2)}`,
    });

    return updated;
  }

  async cashMovement(id: string, dto: CashMovementDto, user: any) {
    const shift = await this.prisma.shift.findUnique({ where: { id } });
    if (!shift) throw new NotFoundException('Shift not found');
    if (shift.status === 'CLOSED') throw new BadRequestException('Shift is closed');

    const amount = dto.amount;
    const isOut = dto.type === 'out';

    const updated = await this.prisma.shift.update({
      where: { id },
      data: {
        cash_in: { increment: isOut ? 0 : amount },
        cash_out: { increment: isOut ? amount : 0 },
        expected_cash: { increment: isOut ? -amount : amount },
      },
    });

    await this.auditService.log({
      userId: user.id, userName: user.full_name, userRole: user.role,
      action: `cash_${dto.type}`, entityType: 'Shift', entityId: id,
      newValue: { amount, reason: dto.reason },
    });

    return updated;
  }
}