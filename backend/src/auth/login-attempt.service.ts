import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
}

@Injectable()
export class LoginAttemptService {
  // Key: "email::ip" → attempt record
  private readonly store = new Map<string, AttemptRecord>();

  // ─── Build lookup key ──────────────────────────────────────────────────────
  private key(email: string, ip: string): string {
    return `${email.toLowerCase().trim()}::${ip}`;
  }

  // ─── Check & record a failed attempt ──────────────────────────────────────
  /**
   * Call this BEFORE the password check.
   * Throws TooManyRequestsException if the key is currently blocked.
   */
  checkBlocked(email: string, ip: string): void {
    const k = this.key(email, ip);
    const record = this.store.get(k);
    if (!record) return;

    const now = Date.now();

    // Window expired → clean up and allow
    if (now - record.firstAttempt > WINDOW_MS) {
      this.store.delete(k);
      return;
    }

    if (record.count >= MAX_ATTEMPTS) {
      const waitSec = Math.ceil((record.firstAttempt + WINDOW_MS - now) / 1000);
      throw new HttpException(
        `Too many failed login attempts. Try again in ${waitSec} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  // ─── Record one failed attempt ─────────────────────────────────────────────
  recordFailure(email: string, ip: string): void {
    const k = this.key(email, ip);
    const now = Date.now();
    const existing = this.store.get(k);

    if (!existing || now - existing.firstAttempt > WINDOW_MS) {
      // Fresh window
      this.store.set(k, { count: 1, firstAttempt: now });
    } else {
      existing.count += 1;
      this.store.set(k, existing);
    }
  }

  // ─── Clear on successful login ─────────────────────────────────────────────
  recordSuccess(email: string, ip: string): void {
    this.store.delete(this.key(email, ip));
  }

  // ─── Periodic cleanup (prevent memory leak) ───────────────────────────────
  // Called from auth.module.ts onModuleInit
  startCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [k, v] of this.store.entries()) {
        if (now - v.firstAttempt > WINDOW_MS) {
          this.store.delete(k);
        }
      }
    }, WINDOW_MS);
  }
}
