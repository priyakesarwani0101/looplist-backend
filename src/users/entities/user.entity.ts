import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Loop } from '../../loops/entities/loop.entity';
import { Reaction } from '../../reactions/entities/reaction.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  avatar: string;

  @OneToMany(() => Loop, (loop) => loop.user, {
    cascade: ['remove'],
    orphanedRowAction: 'delete',
  })
  loops: Loop[];

  @OneToMany(() => Reaction, (reaction) => reaction.user, {
    cascade: ['remove'],
    orphanedRowAction: 'delete',
  })
  reactions: Reaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
