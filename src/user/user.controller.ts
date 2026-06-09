import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterDto } from './dto/register.dto';
import { AdminRegisterDto } from './dto/admin-register.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from './user.entity';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Register a regular user
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.userService.register(dto);
  }

  // Register an admin (requires secret key)
  @Post('admin/register')
  registerAdmin(@Body() dto: AdminRegisterDto) {
    return this.userService.registerAdmin(dto);
  }

  // Get own profile — both user and admin
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN)
  @Get('profile/:id')
  getProfile(@Param('id') id: string) {
    return this.userService.getProfile(Number(id));
  }

  // Get all users — admin only
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('all')
  getAllUsers() {
    return this.userService.getAllUsers();
  }
}