import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { User } from './users/entities/user.entity';
import { Loop } from './loops/entities/loop.entity';
import { Streak } from './loops/entities/streak.entity';
import { Reaction } from './reactions/entities/reaction.entity';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LoopsModule } from './loops/loops.module';
import { ReactionsModule } from './reactions/reactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([User, Loop, Streak, Reaction]),
    UsersModule,
    AuthModule,
    LoopsModule,
    ReactionsModule,
  ],
})
export class AppModule {}
