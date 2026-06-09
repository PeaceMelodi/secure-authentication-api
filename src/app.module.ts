import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'; // ← ADDED
import { APP_GUARD } from '@nestjs/core'; // ← ADDED
import { UserModule } from './user/user.module';
import { User } from './user/user.entity';
import { AuthModule } from './auth/auth.module';
import { Token } from './auth/token.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [User, Token],
        synchronize: true,
        ssl: true,
      }),
      inject: [ConfigService],
    }),

// ← ADDED — Global rate limiting: 100 requests per 60 seconds per IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds window
        limit: 100, // max 100 requests per window globally
      },
    ]),


    UserModule,
    AuthModule,
  ],

providers: [
    // ← ADDED — Apply throttler globally to all routes
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],

})
export class AppModule {}