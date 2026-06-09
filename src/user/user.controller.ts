import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { RegisterDto } from './dto/register.dto';
import { AdminRegisterDto } from './dto/admin-register.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from './user.entity';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new account with the `user` role. Email must be unique.',
  })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  @ApiBody({ type: RegisterDto })
  register(@Body() dto: RegisterDto) {
    return this.userService.register(dto);
  }

  @Post('admin/register')
  @ApiOperation({
    summary: 'Register a new admin',
    description: 'Creates a new account with the `admin` role. Requires a valid admin secret key.',
  })
  @ApiResponse({ status: 201, description: 'Admin registered successfully' })
  @ApiResponse({ status: 403, description: 'Invalid admin secret key' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  @ApiBody({ type: AdminRegisterDto })
  registerAdmin(@Body() dto: AdminRegisterDto) {
    return this.userService.registerAdmin(dto);
  }

  @Get('profile/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Returns the profile of a user by ID. Accessible by both `user` and `admin` roles.',
  })
  @ApiParam({ name: 'id', example: 1, description: 'The ID of the user' })
  @ApiResponse({ status: 200, description: 'User profile returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getProfile(@Param('id') id: string) {
    return this.userService.getProfile(Number(id));
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get all users',
    description: 'Returns a list of all registered users. Accessible by `admin` role only.',
  })
  @ApiResponse({ status: 200, description: 'List of all users returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin access required' })
  getAllUsers() {
    return this.userService.getAllUsers();
  }
}