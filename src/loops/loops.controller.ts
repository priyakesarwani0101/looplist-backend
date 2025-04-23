import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { LoopsService } from './loops.service';
import { Loop, LoopVisibility } from './entities/loop.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateLoopDto } from './dto/create-loop.dto';
import { UpdateLoopDto } from './dto/update-loop.dto';
import { StreakStatus } from './entities/streak.entity';
import { User } from '../auth/decorators/user.decorator';

@ApiTags('Loops')
@Controller('loops')
export class LoopsController {
  constructor(private readonly loopsService: LoopsService) {}

  @Get('public')
  @ApiOperation({ summary: 'Get all public loops' })
  @ApiResponse({
    status: 200,
    description: 'List of public loops',
    type: [Loop],
  })
  getPublicLoops() {
    return this.loopsService.findAll(null, LoopVisibility.PUBLIC);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending public loops' })
  @ApiResponse({
    status: 200,
    description: 'List of trending loops',
    type: [Loop],
  })
  getTrendingLoops() {
    return this.loopsService.getTrendingLoops();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('my')
  @ApiOperation({ summary: 'Get all loops for the current user' })
  @ApiQuery({
    name: 'visibility',
    enum: LoopVisibility,
    required: false,
    description: "Filter user's loops by visibility",
  })
  @ApiResponse({
    status: 200,
    description: "List of user's loops",
    type: [Loop],
  })
  getMyLoops(
    @Query('visibility') visibility?: LoopVisibility,
    @Req() req?: Request,
  ) {
    return this.loopsService.findAll((req.user as any).id, visibility);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new loop' })
  @ApiResponse({
    status: 201,
    description: 'Loop created successfully',
    type: Loop,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createLoopDto: CreateLoopDto, @Req() req: Request) {
    return this.loopsService.create(createLoopDto, (req.user as any).id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get a loop by id' })
  @ApiResponse({ status: 200, description: 'Loop found', type: Loop })
  @ApiResponse({ status: 404, description: 'Loop not found' })
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.loopsService.findOne(id, (req.user as any).id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a loop' })
  @ApiResponse({ status: 200, description: 'Loop updated', type: Loop })
  @ApiResponse({ status: 404, description: 'Loop not found' })
  update(
    @Param('id') id: string,
    @Body() updateLoopDto: UpdateLoopDto,
    @Req() req: Request,
  ) {
    return this.loopsService.update(id, updateLoopDto, (req.user as any).id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a loop' })
  @ApiResponse({ status: 200, description: 'Loop deleted' })
  @ApiResponse({ status: 404, description: 'Loop not found' })
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.loopsService.remove(id, (req.user as any).id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/streak')
  @ApiOperation({ summary: 'Mark or skip a streak for a loop' })
  @ApiResponse({
    status: 200,
    description: 'Streak marked/skipped',
    type: Loop,
  })
  @ApiResponse({ status: 404, description: 'Loop not found' })
  markStreak(
    @Param('id') id: string,
    @Body() body: { date?: Date; status: StreakStatus },
    @Req() req: Request,
  ) {
    return this.loopsService.markStreak(
      id,
      (req.user as any).id,
      body.date,
      body.status,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/stats')
  @ApiOperation({ summary: 'Get streak statistics for a loop' })
  @ApiResponse({
    status: 200,
    description: 'Returns streak statistics for the loop',
    schema: {
      type: 'object',
      properties: {
        currentStreak: { type: 'number', description: 'Current streak count' },
        longestStreak: {
          type: 'number',
          description: 'Longest streak achieved',
        },
        completionRate: {
          type: 'number',
          description: 'Completion rate percentage',
        },
        totalCompletions: {
          type: 'number',
          description: 'Total number of completions',
        },
        totalDays: { type: 'number', description: 'Total number of days' },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'BROKEN', 'COMPLETED'],
          description:
            'Current status of the streak: ACTIVE = ongoing streak, BROKEN = missed a day, COMPLETED = loop has ended',
        },
        lastStreakDate: {
          type: 'string',
          format: 'date-time',
          description: 'Date of the last streak entry',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Loop not found' })
  getStreakStats(@Param('id') id: string, @User() user: { id: string }) {
    return this.loopsService.getStreakStats(id, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/clone')
  @ApiOperation({ summary: 'Clone a public loop' })
  @ApiResponse({
    status: 201,
    description: 'Loop cloned successfully',
    type: Loop,
  })
  @ApiResponse({ status: 404, description: 'Loop not found or not public' })
  cloneLoop(@Param('id') id: string, @Req() req: Request) {
    return this.loopsService.cloneLoop(id, (req.user as any).id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/heatmap')
  @ApiOperation({ summary: 'Get streak heatmap data for a loop' })
  @ApiQuery({
    name: 'year',
    type: 'number',
    required: false,
    description: 'Year to get heatmap data for (defaults to current year)',
  })
  @ApiResponse({
    status: 200,
    description: 'Heatmap data for the year',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          day: { type: 'string', format: 'date' },
          value: { type: 'number' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Loop not found' })
  getStreakHeatmap(
    @Param('id') id: string,
    @Query('year') year?: number,
    @Req() req?: Request,
  ) {
    return this.loopsService.getStreakHeatmapData(
      id,
      (req.user as any).id,
      year,
    );
  }
}
