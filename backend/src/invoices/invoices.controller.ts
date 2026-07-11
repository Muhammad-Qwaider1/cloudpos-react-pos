import {
  Controller, Get, Post, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { CreateInvoiceDto, VoidInvoiceDto, ReturnInvoiceDto } from './dto/invoice.dto';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CASHIER)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.invoicesService.findAll({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      status, search,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CASHIER)
  create(@Body() dto: CreateInvoiceDto, @CurrentUser() user: any) {
    return this.invoicesService.create(dto, user);
  }

  @Post(':id/void')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  void(@Param('id') id: string, @Body() dto: VoidInvoiceDto, @CurrentUser() user: any) {
    return this.invoicesService.void(id, dto, user);
  }

  @Post(':id/return')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  returnInvoice(@Param('id') id: string, @Body() dto: ReturnInvoiceDto, @CurrentUser() user: any) {
    return this.invoicesService.returnInvoice(id, dto, user);
  }
}