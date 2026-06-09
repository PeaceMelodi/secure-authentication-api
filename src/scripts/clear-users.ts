import { DataSource } from 'typeorm';
import { User } from '../user/user.entity';
import { Token } from '../auth/token.entity'; // ← ADDED
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Token], // ← ADDED Token
  ssl: true,
});

async function clearUsers() {
  await AppDataSource.initialize();
  await AppDataSource.getRepository(Token).clear(); // ← ADDED clear tokens first
  await AppDataSource.getRepository(User).clear();
  await AppDataSource.query('ALTER SEQUENCE user_id_seq RESTART WITH 1');
  await AppDataSource.query('ALTER SEQUENCE token_id_seq RESTART WITH 1'); // ← ADDED reset token ID
  await AppDataSource.destroy();
  console.log('✅ All users and tokens cleared, IDs reset to 1');
}

clearUsers();