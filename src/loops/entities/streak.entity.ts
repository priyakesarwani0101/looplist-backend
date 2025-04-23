import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Loop } from './loop.entity';

export enum StreakStatus {
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
}

@Entity('streaks')
export class Streak {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({
    type: 'enum',
    enum: StreakStatus,
    default: StreakStatus.COMPLETED,
  })
  status: StreakStatus;

  @ManyToOne(() => Loop, (loop) => loop.streaks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loopId' })
  loop: Loop;

  @Column({ type: 'uuid' })
  loopId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
