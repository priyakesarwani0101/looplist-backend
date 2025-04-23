import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reaction } from './entities/reaction.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ReactionsService {
  constructor(
    @InjectRepository(Reaction)
    private reactionsRepository: Repository<Reaction>,
  ) {}

  async create(loopId: string, emoji: string, user: User): Promise<Reaction> {
    const existingReaction = await this.reactionsRepository.findOne({
      where: { loopId, userId: user.id },
    });

    if (existingReaction) {
      existingReaction.emoji = emoji;
      return this.reactionsRepository.save(existingReaction);
    }

    const reaction = this.reactionsRepository.create({
      loopId,
      userId: user.id,
      emoji,
      user,
    });

    return this.reactionsRepository.save(reaction);
  }

  async remove(loopId: string, userId: string): Promise<void> {
    const reaction = await this.reactionsRepository.findOne({
      where: { loopId, userId },
    });

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    if (reaction.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to remove this reaction',
      );
    }

    await this.reactionsRepository.remove(reaction);
  }

  async getLoopReactions(loopId: string): Promise<Reaction[]> {
    return this.reactionsRepository.find({
      where: { loopId },
      relations: ['user'],
    });
  }
}
