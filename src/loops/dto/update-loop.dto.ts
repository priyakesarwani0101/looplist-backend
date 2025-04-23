import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsDate, IsOptional } from 'class-validator';
import { LoopFrequency, LoopVisibility } from '../entities/loop.entity';

export class UpdateLoopDto {
  @ApiProperty({
    example: 'Read 10 pages',
    description: 'The title of the loop',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    enum: LoopFrequency,
    example: LoopFrequency.DAILY,
    description: 'The frequency of the loop',
    required: false,
  })
  @IsEnum(LoopFrequency)
  @IsOptional()
  frequency?: LoopFrequency;

  @ApiProperty({
    example: '2024-04-22',
    description: 'The start date of the loop',
    required: false,
  })
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @ApiProperty({
    enum: LoopVisibility,
    example: LoopVisibility.PUBLIC,
    description: 'The visibility of the loop',
    required: false,
  })
  @IsEnum(LoopVisibility)
  @IsOptional()
  visibility?: LoopVisibility;

  @ApiProperty({
    example: '📚',
    description: 'The emoji for the loop',
    required: false,
  })
  @IsString()
  @IsOptional()
  emoji?: string;

  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: 'The cover image URL for the loop',
    required: false,
  })
  @IsString()
  @IsOptional()
  coverImage?: string;
}
