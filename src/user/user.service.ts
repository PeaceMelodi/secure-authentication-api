import { Injectable, ConflictException, UnauthorizedException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';
import { RegisterDto } from './dto/register.dto';
import { AdminRegisterDto } from './dto/admin-register.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService, 
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role: UserRole.USER, 
    });

    await this.userRepository.save(user);
    return { message: 'User registered successfully' };
  }

  async registerAdmin(dto: AdminRegisterDto) {
    // Check admin secret key
    const adminSecretKey = this.configService.get<string>('ADMIN_SECRET_KEY');
    if (dto.adminSecretKey !== adminSecretKey) {
      throw new ForbiddenException('Invalid admin secret key');
    }

    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role: UserRole.ADMIN, 
    });

    await this.userRepository.save(user);
    return { message: 'Admin registered successfully' };
  }

  async getProfile(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...profile } = user;
    return profile;
  }

  async getAllUsers() {
    const users = await this.userRepository.find();
    return users.map(({ password, ...user }) => user);
  }
}