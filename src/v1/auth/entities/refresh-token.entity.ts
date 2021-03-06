import { User } from '@v1/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'refresh_token' })
export class RefreshToken {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public userId: number;

  @Column({ default: false })
  public isRevoked: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP()' })
  public expires: Date;

  @ManyToOne(() => User, (user) => user.refreshTokens)
  public user: User;

  @CreateDateColumn({ type: 'timestamp' })
  public createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  public updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  public deletedAt: Date;
}
