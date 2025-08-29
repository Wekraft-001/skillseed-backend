import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateChallengeCategoryDto {
  @ApiProperty({ description: 'Name of the challenge category', example: 'Learning' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Description of the challenge category', example: 'Learning activities for students', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateChallengeCategoryDto {
  @ApiProperty({ description: 'Name of the challenge category', example: 'Learning', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Description of the challenge category', example: 'Learning activities for students', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
