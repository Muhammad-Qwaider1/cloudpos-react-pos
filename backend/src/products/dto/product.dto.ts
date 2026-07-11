import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateProductDto {
  @IsString() name: string;
  @IsOptional() @IsString() barcode?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() unit_price: number;
  @IsOptional() @IsNumber() cost_price?: number;
  @IsOptional() @IsNumber() stock_quantity?: number;
  @IsOptional() @IsNumber() min_stock_alert?: number;
  @IsOptional() @IsBoolean() tax_exempt?: boolean;
  @IsOptional() @IsNumber() tax_rate?: number;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsString() image_url?: string;
}

export class UpdateProductDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() barcode?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() unit_price?: number;
  @IsOptional() @IsNumber() cost_price?: number;
  @IsOptional() @IsNumber() stock_quantity?: number;
  @IsOptional() @IsNumber() min_stock_alert?: number;
  @IsOptional() @IsBoolean() tax_exempt?: boolean;
  @IsOptional() @IsNumber() tax_rate?: number;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsString() image_url?: string;
}