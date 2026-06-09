import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Token } from './token.entity';
import { User } from '../user/user.entity';
import { LoginAttemptService } from './login-attempt.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Token)
    private tokenRepository: Repository<Token>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private loginAttemptService: LoginAttemptService,
  ) {}

  async login(email: string, password: string, ip: string) {
    // Check if IP is blocked
    if (this.loginAttemptService.isBlocked(ip)) {
      throw new UnauthorizedException(
        'Too many failed attempts. Please try again in 1 minute.',
      );
    }

    // Check if user exists
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      this.loginAttemptService.recordFailedAttempt(ip);
      throw new UnauthorizedException(
        `Invalid credentials. ${this.loginAttemptService.getRemainingAttempts(ip)} attempts remaining.`,
      );
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      this.loginAttemptService.recordFailedAttempt(ip);
      throw new UnauthorizedException(
        `Invalid credentials. ${this.loginAttemptService.getRemainingAttempts(ip)} attempts remaining.`,
      );
    }

    // Successful login — clear attempts
    this.loginAttemptService.clearAttempts(ip);

    // Generate access token (15 minutes) — role included in payload
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role, // ← ADDED role
    });

    // Generate refresh token (7 days)
    const refreshToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role }, // ← ADDED role
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );

    // Save refresh token to database
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.tokenRepository.save({
      userId: user.id,
      refreshToken: hashedRefreshToken,
    });

    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const tokens = await this.tokenRepository.find({
        where: { userId: payload.sub, isBlacklisted: false },
      });

      let validToken: Token | null = null;
      for (const token of tokens) {
        const match = await bcrypt.compare(refreshToken, token.refreshToken);
        if (match) {
          validToken = token;
          break;
        }
      }

      if (!validToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newAccessToken = this.jwtService.sign({
        sub: payload.sub,
        email: payload.email,
        role: payload.role, // ← ADDED role
      });

      return { accessToken: newAccessToken };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const tokens = await this.tokenRepository.find({
        where: { userId: payload.sub, isBlacklisted: false },
      });

      for (const token of tokens) {
        const match = await bcrypt.compare(refreshToken, token.refreshToken);
        if (match) {
          token.isBlacklisted = true;
          await this.tokenRepository.save(token);
          break;
        }
      }

      return { message: 'Logged out successfully' };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}