import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'johndoe@gmail.com',
    description: 'Registered email address',
  })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Account password',
  })
  password: string;
}