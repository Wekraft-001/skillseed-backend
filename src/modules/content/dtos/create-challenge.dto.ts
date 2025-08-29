import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export enum ChallengeType {
  PROJECT = 'project',
  EXPERIMENT = 'experiment',
  ACTIVITY = 'activity'
}

export class CreateChallengeDto {
  @ApiProperty({ description: 'Title of the challenge', example: 'Build a Simple Robot' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Description of the challenge', example: 'In this DIY project, you will build a simple robot using household materials.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: ChallengeType, description: 'Type of challenge', example: ChallengeType.PROJECT })
  @IsEnum(ChallengeType)
  @IsNotEmpty()
  type: ChallengeType;

  @ApiProperty({ description: 'ID of the challenge category', example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ description: 'Difficulty level', example: 'Beginner', required: true })
  @IsString()
  @IsNotEmpty()
  difficultyLevel: string;

  @ApiProperty({ description: 'Estimated time to complete (in minutes)', example: '30', required: true })
  @IsString()
  @IsNotEmpty()
  estimatedTime: string;

  @ApiProperty({ description: 'Materials needed', example: ['Cardboard', 'Scissors', 'Glue'], required: false })
  @IsOptional()
  materialsNeeded?: string[];

  @ApiProperty({ description: 'Instructions for the challenge', example: ['Step 1: Cut the cardboard', 'Step 2: Glue the pieces together'] })
  @IsNotEmpty()
  instructions: string[];

  @ApiProperty({ description: 'Image URL', example: 'https://example.com/challenge-image.jpg', required: false })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({ description: 'Video tutorial URL', example: 'https://www.youtube.com/watch?v=example', required: false })
  @IsOptional()
  @IsUrl()
  videoTutorialUrl?: string;
}
