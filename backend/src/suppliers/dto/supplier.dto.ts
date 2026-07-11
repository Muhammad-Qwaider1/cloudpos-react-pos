import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateSupplierDto {
  @IsString() name: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsNumber() balance?: number;
  @IsOptional() @IsString() contact_person?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateSupplierDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsNumber() balance?: number;
  @IsOptional() @IsString() contact_person?: string;
  @IsOptional() @IsString() notes?: string;
}