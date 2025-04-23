import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateReactionDto {
  @ApiProperty({
    example: '👍',
    description: 'The emoji reaction',
  })
  @IsString()
  @IsNotEmpty()
  emoji: string;
}
