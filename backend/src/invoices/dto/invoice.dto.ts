import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceItemDto {
  @IsOptional() @IsString() product_id?: string;
  @IsString() product_name: string;
  @IsOptional() @IsString() barcode?: string;
  @IsNumber() quantity: number;
  @IsNumber() unit_price: number;
  @IsOptional() @IsNumber() discount_value?: number;
  @IsOptional() @IsEnum(['PERCENTAGE', 'FIXED']) discount_type?: string;
  @IsOptional() @IsBoolean() tax_exempt?: boolean;
}

export class CreateInvoiceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @IsOptional() @IsString() customer_id?: string;
  @IsOptional() @IsString() customer_name?: string;
  @IsOptional() @IsString() shift_id?: string;
  @IsOptional() @IsNumber() discount_value?: number;
  @IsOptional() @IsEnum(['PERCENTAGE', 'FIXED']) discount_type?: string;
  @IsOptional() @IsNumber() payment_cash?: number;
  @IsOptional() @IsNumber() payment_card?: number;
  @IsOptional() @IsNumber() payment_other?: number;
  @IsOptional() @IsNumber() change_given?: number;
  @IsOptional() @IsString() notes?: string;
}

export class VoidInvoiceDto {
  @IsString() reason: string;
}

export class ReturnInvoiceDto {
  @IsString() reason: string;
}