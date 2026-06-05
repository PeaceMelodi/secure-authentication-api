import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Token } from './token.entity';
import { User } from '../user/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Token)
    private tokenRepository: Repository<Token>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // Generate both access and refresh tokens
  async login(email: string, password: string) {
    // Check if user exists
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate access token (15 minutes)
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
    );

    // Generate refresh token (7 days)
    const refreshToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
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

  // Generate new access token using refresh token
  async refreshTokens(refreshToken: string) {
    try {
      // Verify the refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Find token in database
      const tokens = await this.tokenRepository.find({
        where: { userId: payload.sub, isBlacklisted: false },
      });

      // Check if any stored token matches
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

      // Generate new access token
      const newAccessToken = this.jwtService.sign({
        sub: payload.sub,
        email: payload.email,
      });

      return { accessToken: newAccessToken };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // Blacklist token on logout
  async logout(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Find and blacklist the token
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