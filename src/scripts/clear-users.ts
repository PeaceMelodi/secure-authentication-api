import { DataSource } from 'typeorm';
import { User } from '../user/user.entity';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User],
  ssl: true,
});

async function clearUsers() {
  await AppDataSource.initialize();
  await AppDataSource.getRepository(User).clear();
  await AppDataSource.query('ALTER SEQUENCE user_id_seq RESTART WITH 1');
  await AppDataSource.destroy();
  console.log('All users cleared and ID reset to 1');
}

clearUsers();