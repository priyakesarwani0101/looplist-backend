import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoopsService } from './loops.service';
import { LoopsController } from './loops.controller';
import { Loop } from './entities/loop.entity';
import { Streak } from './entities/streak.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Loop, Streak])],
  controllers: [LoopsController],
  providers: [LoopsService],
  exports: [LoopsService],
})
export class LoopsModule {}
