import { IsNumber, IsString, IsOptional, IsEnum } from 'class-validator';

export class OpenShiftDto {
  @IsNumber() opening_cash: number;
}

export class CloseShiftDto {
  @IsNumber() counted_cash: number;
  @IsOptional() @IsString() notes?: string;
}

export class CashMovementDto {
  @IsEnum(['in', 'out']) type: 'in' | 'out';
  @IsNumber() amount: number;
  @IsOptional() @IsString() reason?: string;
}