import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import * as bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { created_at: 'desc' },
      select: this.selectSafe(),
    });
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
    // Always hash the password — never store plain text
    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    return this.prisma.user.create({
      data: {
        email: dto.email.trim().toLowerCase(),
        password: hashedPassword,
        full_name: dto.full_name,
        phone: dto.phone,
        role: dto.role as UserRole,
        active: dto.active ?? true,
      },
      select: this.selectSafe(),
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id); // throws NotFoundException if missing

    const data: any = {};
    if (dto.email)              data.email     = dto.email.trim().toLowerCase();
    if (dto.full_name)          data.full_name = dto.full_name;
    if (dto.phone !== undefined) data.phone    = dto.phone;
    if (dto.role)               data.role      = dto.role as UserRole;
    if (dto.active !== undefined) data.active  = dto.active;

    // Hash new password if provided
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    }

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

  /** Fields returned to callers — password is never included */
  private selectSafe() {
    return {
      id:         true,
      email:      true,
      full_name:  true,
      phone:      true,
      role:       true,
      active:     true,
      created_at: true,
      updated_at: true,
    };
  }
}
