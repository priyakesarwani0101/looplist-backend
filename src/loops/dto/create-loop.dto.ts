import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsDate,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { LoopFrequency, LoopVisibility } from '../entities/loop.entity';
import { Type } from 'class-transformer';

export class CreateLoopDto {
  @ApiProperty({
    example: 'Read 10 pages',
    description: 'The title of the loop',
  })
  @IsString()
  title: string;

  @ApiProperty({
    enum: LoopFrequency,
    example: LoopFrequency.DAILY,
    description: 'The frequency of the loop',
  })
  @IsEnum(LoopFrequency)
  frequency: LoopFrequency;

  @ApiProperty({
    example: '2024-04-22',
    description: 'The start date of the loop',
    type: String,
    format: 'date',
  })
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty({
    enum: LoopVisibility,
    example: LoopVisibility.PUBLIC,
    description: 'The visibility of the loop',
  })
  @IsEnum(LoopVisibility)
  visibility: LoopVisibility;

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
