import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Secure Authentication API')
    .setDescription(
      `A production-ready authentication API built with NestJS.
      
## Features
-  User Registration & Login
-  JWT Access & Refresh Tokens
-  Token Blacklisting on Logout
-  Role Based Access Control (Admin & User)
-  Rate Limiting & Brute Force Protection

## Authentication
This API uses **Bearer Token** authentication. After logging in, copy the \`accessToken\` from the response and click the **Authorize** button at the top right to authenticate your requests.`,
    )
    .setVersion('1.0')
    .addServer('https://secure-authentication-api.onrender.com', 'Production Server')
    .addServer('http://localhost:3000', 'Local Development')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT access token',
        in: 'header',
      },
      'access-token',
    )
    .addTag('User', 'User registration and profile management')
    .addTag('Auth', 'Authentication — login, logout, and token management')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      defaultModelsExpandDepth: -1, 
    },
    customSiteTitle: 'Secure Auth API Docs',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();