import { Controller, Post, Get, Body, Request, UseGuards, Ip } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { StrictThrottle } from './throttle.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ← Strict throttle: max 5 requests per 60 seconds on login
  @StrictThrottle()
  @Post('login')
  login(@Body() body: { email: string; password: string }, @Ip() ip: string) {
    return this.authService.login(body.email, body.password, ip);
  }

  // ← Strict throttle on refresh too
  @StrictThrottle()
  @Post('refresh')
  refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshTokens(body.refreshToken);
  }

  @Post('logout')
  logout(@Body() body: { refreshToken: string }) {
    return this.authService.logout(body.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req) {
    return req.user;
  }
}