import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Reaction } from '../../reactions/entities/reaction.entity';
import { Streak } from './streak.entity';

export enum LoopFrequency {
  DAILY = 'daily',
  THREE_TIMES_WEEK = 'three_times_week',
  WEEKDAYS = 'weekdays',
  CUSTOM = 'custom',
}

export enum LoopVisibility {
  PRIVATE = 'private',
  PUBLIC = 'public',
  FRIENDS_ONLY = 'friends_only',
}

export enum LoopState {
  ACTIVE = 'active',
  BROKEN = 'broken',
  COMPLETED = 'completed',
}

@Index('IDX_LOOPS_USER', ['userId'])
@Entity('loops')
export class Loop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({
    type: 'enum',
    enum: LoopFrequency,
    default: LoopFrequency.DAILY,
  })
  frequency: LoopFrequency;

  @Column({
    type: 'enum',
    enum: LoopVisibility,
    default: LoopVisibility.PRIVATE,
  })
  visibility: LoopVisibility;

  @Column({
    type: 'enum',
    enum: LoopState,
    default: LoopState.ACTIVE,
  })
  state: LoopState;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ nullable: true })
  emoji: string;

  @Column({ nullable: true })
  coverImage: string;

  @Column({ default: 0 })
  currentStreak: number;

  @Column({ default: 0 })
  longestStreak: number;

  @Column({ type: 'float', default: 0 })
  completionRate: number;

  @Column({ default: 0 })
  totalCompletions: number;

  @Column({ default: 0 })
  totalDays: number;

  @Column({ default: 0 })
  cloneCount: number;

  @ManyToOne(() => User, (user) => user.loops, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @OneToMany(() => Reaction, (reaction) => reaction.loop)
  reactions: Reaction[];

  @OneToMany(() => Streak, (streak) => streak.loop, {
    cascade: ['remove'],
    orphanedRowAction: 'delete',
  })
  streaks: Streak[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
