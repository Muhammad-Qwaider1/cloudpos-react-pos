import { IsEmail, IsString, MinLength } from 'class-validator';

export class GenerateResetTokenDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  new_password: string;
}
