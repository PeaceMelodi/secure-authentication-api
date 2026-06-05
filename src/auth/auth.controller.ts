import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Post('refresh')
  refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshTokens(body.refreshToken);
  }

  @Post('logout')
  logout(@Body() body: { refreshToken: string }) {
    return this.authService.logout(body.refreshToken);
  }

  // Protected route example — requires valid access token
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req) {
    return req.user;
  }
}