import { ApiProperty } from '@nestjs/swagger';

export class AdminRegisterDto {
  @ApiProperty({
    example: 'Admin User',
    description: 'Full name of the admin',
  })
  name: string;

  @ApiProperty({
    example: 'admin@gmail.com',
    description: 'Unique email address of the admin',
  })
  email: string;

  @ApiProperty({
    example: 'admin123',
    description: 'Password — minimum 6 characters recommended',
  })
  password: string;

  @ApiProperty({
    example: 'myadminsecretkey123',
    description: 'Secret key required to register as an admin — stored in server environment variables',
  })
  adminSecretKey: string;
}