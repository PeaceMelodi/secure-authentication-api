import { Injectable } from '@nestjs/common';

@Injectable()
export class LoginAttemptService {
  // Stores failed attempts in memory: { ip: { count, blockedUntil } }
  private attempts = new Map<string, { count: number; blockedUntil: Date | null }>();

  private readonly MAX_ATTEMPTS = 5;
  private readonly BLOCK_DURATION_MS = 1 * 60 * 1000; // 1 minute for testing

  // Check if IP is currently blocked
  isBlocked(ip: string): boolean {
    const record = this.attempts.get(ip);
    if (!record || !record.blockedUntil) return false;

    if (new Date() > record.blockedUntil) {
      // Block has expired, reset
      this.attempts.delete(ip);
      return false;
    }

    return true;
  }

  // Record a failed login attempt
  recordFailedAttempt(ip: string): void {
    const record = this.attempts.get(ip) || { count: 0, blockedUntil: null };
    record.count += 1;

    if (record.count >= this.MAX_ATTEMPTS) {
      record.blockedUntil = new Date(Date.now() + this.BLOCK_DURATION_MS);
      console.log(`🚫 IP ${ip} blocked until ${record.blockedUntil}`);
    }

    this.attempts.set(ip, record);
  }

  // Clear attempts on successful login
  clearAttempts(ip: string): void {
    this.attempts.delete(ip);
  }

  // Get remaining attempts for an IP
  getRemainingAttempts(ip: string): number {
    const record = this.attempts.get(ip);
    if (!record) return this.MAX_ATTEMPTS;
    return Math.max(0, this.MAX_ATTEMPTS - record.count);
  }
}