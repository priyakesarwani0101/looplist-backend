import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  Get,
} from '@nestjs/common';
import { ReactionsService } from './reactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateReactionDto } from './dto/create-reaction.dto';

@ApiTags('Reactions')
@ApiBearerAuth()
@Controller('reactions')
@UseGuards(JwtAuthGuard)
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post(':loopId')
  @ApiOperation({ summary: 'Add or update a reaction to a loop' })
  @ApiResponse({
    status: 200,
    description: 'Reaction successfully added/updated',
  })
  @ApiResponse({ status: 404, description: 'Loop not found' })
  create(
    @Param('loopId') loopId: string,
    @Body() createReactionDto: CreateReactionDto,
    @Req() req: Request,
  ) {
    return this.reactionsService.create(
      loopId,
      createReactionDto.emoji,
      req.user as any,
    );
  }

  @Delete(':loopId')
  @ApiOperation({ summary: 'Remove a reaction from a loop' })
  @ApiResponse({ status: 200, description: 'Reaction successfully removed' })
  @ApiResponse({ status: 404, description: 'Reaction not found' })
  remove(@Param('loopId') loopId: string, @Req() req: Request) {
    return this.reactionsService.remove(loopId, (req.user as any).id);
  }

  @Get(':loopId')
  @ApiOperation({ summary: 'Get all reactions for a loop' })
  @ApiResponse({ status: 200, description: 'Return all reactions' })
  getLoopReactions(@Param('loopId') loopId: string) {
    return this.reactionsService.getLoopReactions(loopId);
  }
}
