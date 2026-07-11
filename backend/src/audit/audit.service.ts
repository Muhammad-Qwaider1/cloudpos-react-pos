import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    userId?: string;
    userName?: string;
    userRole?: string;
    action: string;
    entityType?: string;
    entityId?: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    details?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        user_id: params.userId,
        user_name: params.userName,
        user_role: params.userRole,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId,
        old_value: params.oldValue ?? undefined,
        new_value: params.newValue ?? undefined,
        ip_address: params.ipAddress,
        details: params.details,
      },
    });
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    action?: string;
    userId?: string;
  } = {}) {
    const { page = 1, limit = 50, action, userId } = params;
    const where: any = {};
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (userId) where.user_id = userId;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}