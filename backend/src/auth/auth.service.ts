import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { LoginAttemptService } from './login-attempt.service';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const BCRYPT_ROUNDS = 12;
// Access token: 15 minutes; Refresh token: 7 days
const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private loginAttempt: LoginAttemptService,
  ) {}

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /** Strip password from user object before returning to caller */
  private selectSafe(user: any) {
    const { password: _pw, ...safe } = user;
    return safe;
  }

  private async issueTokens(userId: string, email: string, role: string, full_name: string) {
    const payload = { sub: userId, email, role, full_name };

    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET is not set in environment');

    const access_token = this.jwtService.sign(payload, {
      secret,
      expiresIn: ACCESS_EXPIRES,
    });

    // Generate opaque refresh token stored in DB
    const rawToken = uuidv4();
    const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_MS);

    await this.prisma.refreshToken.create({
      data: {
        token: rawToken,
        user_id: userId,
        expires_at: expiresAt,
      },
    });

    return { access_token, refresh_token: rawToken };
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  async login(dto: LoginDto, ip: string) {
    const normalizedEmail = dto.email.trim().toLowerCase();

    // ① Block if this email+IP exceeded 5 failures in the last 15 minutes
    this.loginAttempt.checkBlocked(normalizedEmail, ip);

    const user = await this.prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    });

    if (!user || !user.active) {
      // Count as failure even when user doesn't exist (prevents user enumeration)
      this.loginAttempt.recordFailure(normalizedEmail, ip);
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      // ② Record the failure
      this.loginAttempt.recordFailure(normalizedEmail, ip);
      throw new UnauthorizedException('Invalid credentials');
    }

    // ③ Successful login → clear failure counter
    this.loginAttempt.recordSuccess(normalizedEmail, ip);

    const tokens = await this.issueTokens(user.id, user.email, user.role, user.full_name);

    return {
      ...tokens,
      user: this.selectSafe(user),
    };
  }

  // ─── Refresh ──────────────────────────────────────────────────────────────

  async refresh(rawToken: string) {
    const record = await this.prisma.refreshToken.findUnique({
      where: { token: rawToken },
      include: { user: true },
    });

    if (!record || record.revoked || record.expires_at < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!record.user.active) {
      throw new ForbiddenException('Account is deactivated');
    }

    // Rotate: revoke old token, issue new pair
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revoked: true },
    });

    const tokens = await this.issueTokens(
      record.user.id,
      record.user.email,
      record.user.role,
      record.user.full_name,
    );

    return {
      ...tokens,
      user: this.selectSafe(record.user),
    };
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  async logout(rawToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token: rawToken },
      data: { revoked: true },
    });
    return { message: 'Logged out successfully' };
  }

  /** Revoke ALL refresh tokens for a user (used when account is locked) */
  async revokeAllForUser(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { user_id: userId, revoked: false },
      data: { revoked: true },
    });
  }

  // ─── Validate (used by JWT strategy) ──────────────────────────────────────

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.active) return null;
    return this.selectSafe(user);
  }

  // ─── Change Password (authenticated user) ─────────────────────────────────

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) throw new UnauthorizedException('Current password is incorrect');

    const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });

    // Revoke all existing refresh tokens so other sessions are invalidated
    await this.revokeAllForUser(userId);

    return { message: 'Password changed successfully' };
  }

  // ─── Admin: Generate one-time reset token ────────────────────────────────

  async generateResetToken(adminId: string, targetEmail: string) {
    // Verify requester is admin
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    const target = await this.prisma.user.findFirst({
      where: { email: { equals: targetEmail.trim().toLowerCase(), mode: 'insensitive' } },
    });
    if (!target) throw new NotFoundException('User not found');

    // Invalidate any existing unused tokens for this user
    await this.prisma.passwordResetToken.updateMany({
      where: { user_id: target.id, used: false },
      data: { used: true },
    });

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.passwordResetToken.create({
      data: { token, user_id: target.id, expires_at: expiresAt },
    });

    // In a local/offline deployment the token is returned directly to the admin
    return {
      message: `Reset token generated for ${target.email}`,
      reset_token: token,
      expires_at: expiresAt,
    };
  }

  // ─── Self-service: User requests their own reset code ────────────────────
  // Local mode: returns the 6-digit code directly in the response so the user
  // sees it on screen. In production, replace the return with an email call.

  async requestPasswordReset(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    });

    // Always return the same shape — never reveal whether the email exists
    if (!user || !user.active) {
      return {
        message: 'If this email is registered, a reset code will be shown below.',
        reset_code: null,
      };
    }

    // Invalidate previous unused codes
    await this.prisma.passwordResetToken.updateMany({
      where: { user_id: user.id, used: false },
      data: { used: true },
    });

    // 6-digit numeric code — easy to type
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.prisma.passwordResetToken.create({
      data: { token: code, user_id: user.id, expires_at: expiresAt },
    });

    return {
      message: 'Reset code generated. Copy it and enter it below.',
      reset_code: code,
      expires_in_minutes: 15,
      email_hint: normalizedEmail.replace(/(.{2}).+(@.+)/, '$1***$2'),
    };
  }

  async resetPasswordWithToken(token: string, newPassword: string) {
    if (newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    const record = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record || record.used || record.expires_at < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.user_id }, data: { password: hashed } }),
      this.prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } }),
    ]);

    // Revoke all refresh tokens for the user
    await this.revokeAllForUser(record.user_id);

    return { message: 'Password reset successfully' };
  }

  // ─── Hash helper (used by UsersService) ───────────────────────────────────

  static async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
  }
}
