import {
  Controller,
  Post,
  Body,
  UseGuards,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GenerateResetTokenDto, ResetPasswordDto } from './dto/reset-password.dto';

// Refresh token cookie settings
const REFRESH_COOKIE = 'cloudpos_rt';
const COOKIE_OPTS = {
  httpOnly: true,          // ← JS cannot read this cookie
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/',
};

@Controller('auth')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── Login ────────────────────────────────────────────────────────────────
  // Rate-limited to 5 attempts per 15 minutes per IP (ThrottlerGuard)
  // PLUS email+IP tracking inside AuthService (5 failures → block)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Extract real IP (works behind proxies if trust proxy is set)
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';

    const result = await this.authService.login(dto, ip);

    // Set refresh token as httpOnly cookie — not visible to JS
    res.cookie(REFRESH_COOKIE, result.refresh_token, COOKIE_OPTS);

    // Return only access_token + user — refresh_token stays in cookie
    return {
      access_token: result.access_token,
      user: result.user,
    };
  }

  // ─── Refresh ──────────────────────────────────────────────────────────────
  // Reads refresh token from httpOnly cookie automatically
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    const result = await this.authService.refresh(token);

    // Rotate: set new refresh token cookie
    res.cookie(REFRESH_COOKIE, result.refresh_token, COOKIE_OPTS);

    return {
      access_token: result.access_token,
      user: result.user,
    };
  }

  // ─── Logout ───────────────────────────────────────────────────────────────
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (token) {
      await this.authService.logout(token);
    }
    // Clear the cookie regardless
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    return { message: 'Logged out successfully' };
  }

  // ─── Change Password ──────────────────────────────────────────────────────
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  async changePassword(
    @CurrentUser() user: any,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.changePassword(
      user.id,
      dto.current_password,
      dto.new_password,
    );
    // Clear refresh cookie — all sessions invalidated
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    return result;
  }

  // ─── Admin: Generate one-time reset token ─────────────────────────────────
  @Post('admin/generate-reset-token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @SkipThrottle()
  async generateResetToken(
    @CurrentUser() admin: any,
    @Body() dto: GenerateResetTokenDto,
  ) {
    return this.authService.generateResetToken(admin.id, dto.email);
  }

  // ─── Forgot Password (self-service, no auth required) ────────────────────
  // Returns the reset code directly on screen (local/offline mode)
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  // ─── Reset password with one-time token ──────────────────────────────────
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPasswordWithToken(dto.token, dto.new_password);
  }
}
