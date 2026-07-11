import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateCustomerDto {
  @IsString() name: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsNumber() balance?: number;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() tax_id?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateCustomerDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsNumber() balance?: number;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() tax_id?: string;
  @IsOptional() @IsString() notes?: string;
}