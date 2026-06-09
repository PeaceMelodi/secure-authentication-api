import { Controller, Post, Get, Body, Request, UseGuards, Ip } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { StrictThrottle } from './throttle.decorator';
import { LoginDto } from '../user/dto/login.dto';
import { RefreshTokenDto } from '../user/dto/refresh-token.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @StrictThrottle()
  @Post('login')
  @ApiOperation({
    summary: 'Login',
    description: `Authenticates a user and returns a JWT **access token** (expires in 15 minutes) and a **refresh token** (expires in 7 days). 
    
After logging in, copy the \`accessToken\` and click the **Authorize** button at the top of this page to authenticate protected endpoints.

**Rate limited** — max 5 requests per 60 seconds. Blocked after 5 failed attempts for 1 minute.`,
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful — returns access and refresh tokens',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests — rate limit exceeded' })
  @ApiBody({ type: LoginDto })
  login(@Body() body: LoginDto, @Ip() ip: string) {
    return this.authService.login(body.email, body.password, ip);
  }

  @StrictThrottle()
  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generates a new access token using a valid refresh token. Use this when your access token has expired.',
  })
  @ApiResponse({
    status: 200,
    description: 'New access token generated successfully',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refreshTokens(body.refreshToken);
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Logout',
    description: 'Blacklists the refresh token, effectively logging the user out. The refresh token can no longer be used to generate new access tokens.',
  })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  logout(@Body() body: RefreshTokenDto) {
    return this.authService.logout(body.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get current user',
    description: 'Returns the currently authenticated user\'s details extracted from the JWT token. Requires a valid access token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user details returned successfully',
    schema: {
      example: {
        userId: 1,
        email: 'johndoe@gmail.com',
        role: 'user',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid token' })
  getMe(@Request() req) {
    return req.user;
  }
}