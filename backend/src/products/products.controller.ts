import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { AuditService } from '../audit/audit.service';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(
    private productsService: ProductsService,
    private auditService: AuditService,
  ) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.productsService.findAll({
      search, category,
      activeOnly: activeOnly === 'true',
    });
  }

  @Get('low-stock')
  @Roles(UserRole.ADMIN, UserRole.STOCK_MANAGER, UserRole.SUPERVISOR)
  getLowStock() {
    return this.productsService.getLowStock();
  }

  @Get('barcode/:barcode')
  findByBarcode(@Param('barcode') barcode: string) {
    return this.productsService.findByBarcode(barcode);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STOCK_MANAGER)
  create(@Body() dto: CreateProductDto, @CurrentUser() user: any) {
    this.auditService.log({
      userId: user.id, userName: user.full_name, userRole: user.role,
      action: 'create_product', entityType: 'Product', newValue: dto,
    });
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STOCK_MANAGER)
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto, @CurrentUser() user: any) {
    const old = await this.productsService.findOne(id);
    this.auditService.log({
      userId: user.id, userName: user.full_name, userRole: user.role,
      action: 'update_product', entityType: 'Product', entityId: id,
      oldValue: old, newValue: dto,
    });
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.STOCK_MANAGER)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    this.auditService.log({
      userId: user.id, userName: user.full_name, userRole: user.role,
      action: 'delete_product', entityType: 'Product', entityId: id,
    });
    return this.productsService.remove(id);
  }
}