import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Token {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  refreshToken: string;

  @Column({ default: false })
  isBlacklisted: boolean;

  @CreateDateColumn()
  createdAt: Date;
}