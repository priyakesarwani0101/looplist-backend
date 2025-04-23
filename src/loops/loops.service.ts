import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Loop, LoopVisibility } from './entities/loop.entity';
import { Streak, StreakStatus } from './entities/streak.entity';
import { User } from '../users/entities/user.entity';
import { CreateLoopDto } from './dto/create-loop.dto';
import { UpdateLoopDto } from './dto/update-loop.dto';
import { LoopState } from './entities/loop.entity';
import { LoopFrequency } from './entities/loop.entity';

@Injectable()
export class LoopsService {
  constructor(
    @InjectRepository(Loop)
    private loopsRepository: Repository<Loop>,
    @InjectRepository(Streak)
    private streaksRepository: Repository<Streak>,
  ) {}

  async create(createLoopDto: CreateLoopDto, userId: string): Promise<Loop> {
    const loop = this.loopsRepository.create({
      ...createLoopDto,
      userId: userId,
      state: LoopState.ACTIVE,
      currentStreak: 0,
      longestStreak: 0,
      completionRate: 0,
      totalCompletions: 0,
      totalDays: 0,
      cloneCount: 0,
    });
    return this.loopsRepository.save(loop);
  }

  async findAll(userId: string, visibility?: LoopVisibility): Promise<Loop[]> {
    const query = this.loopsRepository
      .createQueryBuilder('loop')
      .leftJoinAndSelect('loop.user', 'user')
      .leftJoinAndSelect('loop.reactions', 'reactions')
      .leftJoinAndSelect('loop.streaks', 'streaks');

    if (visibility) {
      if (visibility === LoopVisibility.PRIVATE) {
        // For private loops, only show user's own loops
        query.where('loop.userId = :userId AND loop.visibility = :visibility', {
          userId,
          visibility,
        });
      } else {
        // For public/friends_only, show all loops with that visibility
        query.where('loop.visibility = :visibility', { visibility });
      }
    } else {
      // If no visibility specified, return all user's loops
      query.where('loop.userId = :userId', { userId });
    }

    return query.getMany();
  }

  async findOne(id: string, userId: string): Promise<Loop> {
    const loop = await this.loopsRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['streaks', 'reactions'],
    });
    if (!loop) {
      throw new NotFoundException(`Loop with ID ${id} not found`);
    }
    return loop;
  }

  async update(
    id: string,
    updateLoopDto: UpdateLoopDto,
    userId: string,
  ): Promise<Loop> {
    const loop = await this.findOne(id, userId);
    Object.assign(loop, updateLoopDto);
    return this.loopsRepository.save(loop);
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.loopsRepository.delete({
      id,
      user: { id: userId },
    });
    if (result.affected === 0) {
      throw new NotFoundException(`Loop with ID ${id} not found`);
    }
  }

  async markStreak(
    id: string,
    userId: string,
    date?: Date | string,
    status: StreakStatus = StreakStatus.COMPLETED,
  ): Promise<Loop> {
    const loop = await this.findOne(id, userId);

    // Convert date to Date object if it's a string
    const today = date ? new Date(date) : new Date();
    today.setHours(0, 0, 0, 0);

    // Ensure startDate is a Date object
    const startDate = new Date(loop.startDate);

    // Check if streak is already marked for today
    const existingStreak = await this.streaksRepository.findOne({
      where: {
        loopId: id,
        date: today,
      },
    });

    if (existingStreak) {
      // Update existing streak status
      existingStreak.status = status;
      existingStreak.loopId = id;
      await this.streaksRepository.save(existingStreak);
      return loop;
    }

    // Create new streak
    const streak = this.streaksRepository.create({
      date: today,
      status,
      loopId: id,
    });
    await this.streaksRepository.save(streak);

    // Update streak counts based on status
    if (status === StreakStatus.COMPLETED) {
      loop.currentStreak += 1;
      if (loop.currentStreak > loop.longestStreak) {
        loop.longestStreak = loop.currentStreak;
      }
      loop.totalCompletions += 1;
    } else {
      // Reset current streak on skip
      loop.currentStreak = 0;
    }

    // Update completion rate
    loop.totalDays = Math.ceil(
      (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    loop.completionRate = (loop.totalCompletions / loop.totalDays) * 100;

    // Update loop state
    if (loop.endDate && today > loop.endDate) {
      loop.state = LoopState.COMPLETED;
    } else {
      loop.state = LoopState.ACTIVE;
    }

    const { streaks, ...loopToSave } = loop;
    return this.loopsRepository.save(loopToSave);
  }

  async getStreakStats(
    id: string,
    userId: string,
  ): Promise<{
    currentStreak: number;
    longestStreak: number;
    completionRate: number;
    totalCompletions: number;
    totalDays: number;
    status: 'ACTIVE' | 'BROKEN' | 'COMPLETED';
    lastStreakDate: Date | null;
  }> {
    const loop = await this.findOne(id, userId);
    if (!loop) {
      throw new NotFoundException(`Loop with ID ${id} not found`);
    }

    // Get the most recent streak
    const lastStreak = await this.streaksRepository.findOne({
      where: { loop: { id } },
      order: { date: 'DESC' },
    });

    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get yesterday's date at midnight
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Determine streak status
    let status: 'ACTIVE' | 'BROKEN' | 'COMPLETED' = 'ACTIVE';

    if (loop.endDate && new Date(loop.endDate) < today) {
      status = 'COMPLETED';
    } else if (lastStreak) {
      const lastStreakDate = new Date(lastStreak.date);
      lastStreakDate.setHours(0, 0, 0, 0);

      // Check if streak is broken based on frequency
      const isBroken = (() => {
        const daysSinceLastStreak = Math.floor(
          (today.getTime() - lastStreakDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        switch (loop.frequency) {
          case LoopFrequency.DAILY:
            return lastStreakDate.getTime() < yesterday.getTime();
          case LoopFrequency.THREE_TIMES_WEEK:
            // Check if more than 2 days have passed
            return daysSinceLastStreak > 2;
          case LoopFrequency.WEEKDAYS:
            // Check if it's a weekday and more than 1 day has passed
            const isWeekday = today.getDay() >= 1 && today.getDay() <= 5;
            return isWeekday && daysSinceLastStreak > 1;
          case LoopFrequency.CUSTOM:
            // For custom frequency, we'll consider it broken if more than 7 days have passed
            return daysSinceLastStreak > 7;
          default:
            return false;
        }
      })();

      if (isBroken) {
        status = 'BROKEN';
      }
    }

    return {
      currentStreak: loop.currentStreak,
      longestStreak: loop.longestStreak,
      completionRate: loop.completionRate,
      totalCompletions: loop.totalCompletions,
      totalDays: loop.totalDays,
      status,
      lastStreakDate: lastStreak?.date || null,
    };
  }

  async cloneLoop(id: string, userId: string): Promise<Loop> {
    const originalLoop = await this.loopsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!originalLoop) {
      throw new NotFoundException(`Loop with ID ${id} not found`);
    }

    if (originalLoop.visibility === 'private') {
      throw new NotFoundException('Cannot clone private loops');
    }

    // Create new loop with same properties
    const clonedLoop = this.loopsRepository.create({
      title: originalLoop.title,
      frequency: originalLoop.frequency,
      visibility: originalLoop.visibility,
      startDate: new Date(),
      emoji: originalLoop.emoji,
      coverImage: originalLoop.coverImage,
      user: { id: userId },
      state: LoopState.ACTIVE,
      currentStreak: 0,
      longestStreak: 0,
      completionRate: 0,
      totalCompletions: 0,
      totalDays: 0,
      cloneCount: 0,
    });

    // Increment clone count on original loop
    originalLoop.cloneCount += 1;
    await this.loopsRepository.save(originalLoop);

    return this.loopsRepository.save(clonedLoop);
  }

  async getTrendingLoops(): Promise<Loop[]> {
    return this.loopsRepository.find({
      where: { visibility: LoopVisibility.PUBLIC },
      relations: ['user', 'reactions'],
      order: {
        cloneCount: 'DESC',
        reactions: {
          createdAt: 'DESC',
        },
      },
      take: 10,
    });
  }

  async getStreakHeatmapData(
    id: string,
    userId: string,
    year: number = new Date().getFullYear(),
  ): Promise<Array<{ day: string; value: number }>> {
    const loop = await this.findOne(id, userId);

    // Get all streaks for the year
    const streaks = await this.streaksRepository.find({
      where: {
        loopId: id,
        date: Between(new Date(year, 0, 1), new Date(year, 11, 31)),
      },
    });

    // Create a map of all days in the year
    const heatmapData = new Map<string, number>();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split('T')[0];
      heatmapData.set(dateStr, 0);
    }

    // Mark days with streaks
    streaks.forEach((streak) => {
      // Ensure date is a Date object
      const streakDate = new Date(streak.date);
      const dateStr = streakDate.toISOString().split('T')[0];
      // Use different values for completed (2) and skipped (1) streaks
      heatmapData.set(
        dateStr,
        streak.status === StreakStatus.COMPLETED ? 1 : 0,
      );
    });

    // Convert to array format expected by nivo calendar
    return Array.from(heatmapData.entries()).map(([day, value]) => ({
      day,
      value,
    }));
  }
}
