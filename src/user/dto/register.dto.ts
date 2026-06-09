import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user',
  })
  name: string;

  @ApiProperty({
    example: 'johndoe@gmail.com',
    description: 'Unique email address of the user',
  })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Password — minimum 6 characters recommended',
  })
  password: string;
}