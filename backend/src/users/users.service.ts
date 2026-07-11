import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { created_at: 'desc' },
      select: this.selectSafe(),
    });
    return users;
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.selectSafe(),
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: dto.password, // Plain text per requirements
        full_name: dto.full_name,
        phone: dto.phone,
        role: dto.role as UserRole,
        active: dto.active ?? true,
      },
      select: this.selectSafe(),
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    const data: any = {};
    if (dto.email) data.email = dto.email;
    if (dto.password) data.password = dto.password;
    if (dto.full_name) data.full_name = dto.full_name;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.role) data.role = dto.role as UserRole;
    if (dto.active !== undefined) data.active = dto.active;

    return this.prisma.user.update({
      where: { id },
      data,
      select: this.selectSafe(),
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.delete({ where: { id } });
  }

  private selectSafe() {
    return {
      id: true,
      email: true,
      full_name: true,
      phone: true,
      role: true,
      active: true,
      created_at: true,
    };
  }
}