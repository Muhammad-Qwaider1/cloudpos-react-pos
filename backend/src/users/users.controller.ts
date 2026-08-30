import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { AuditService } from '../audit/audit.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@SkipThrottle()
export class UsersController {
  constructor(
    private usersService: UsersService,
    private auditService: AuditService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: any) {
    const created = await this.usersService.create(dto);
    this.auditService.log({
      userId: user.id,
      userName: user.full_name,
      userRole: user.role,
      action: 'create_user',
      entityType: 'User',
      entityId: created.id,
      newValue: { email: dto.email, role: dto.role },
    });
    return created;
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    const updated = await this.usersService.update(id, dto);
    this.auditService.log({
      userId: user.id,
      userName: user.full_name,
      userRole: user.role,
      action: 'update_user',
      entityType: 'User',
      entityId: id,
      newValue: { ...dto, password: dto.password ? '[CHANGED]' : undefined },
    });
    return updated;
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    const result = await this.usersService.remove(id);
    this.auditService.log({
      userId: user.id,
      userName: user.full_name,
      userRole: user.role,
      action: 'delete_user',
      entityType: 'User',
      entityId: id,
    });
    return result;
  }
}
