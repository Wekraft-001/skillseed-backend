import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export enum ChallengeType {
  PROJECT = 'project',
  EXPERIMENT = 'experiment',
  ACTIVITY = 'activity',
}

export enum AgeRange {
  AGE_6_TO_8 = '6-8',
  AGE_9_TO_12 = '9-12',
  AGE_13_TO_15 = '13-15',
  AGE_16_TO_18 = '16-18',
}

export class CreateChallengeDto {
  @ApiProperty({
    description: 'Title of the challenge',
    example: 'Build a Simple Robot',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Description of the challenge',
    example:
      'In this DIY project, you will build a simple robot using household materials.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    enum: ChallengeType,
    description: 'Type of challenge',
    example: ChallengeType.PROJECT,
  })
  @IsEnum(ChallengeType)
  @IsNotEmpty()
  type: ChallengeType;

  @ApiProperty({
    description: 'ID of the category',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    description: 'Difficulty level',
    example: 'Beginner',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  difficultyLevel: string;

  @ApiProperty({
    description: 'Theme',
    example: 'Space Explorer',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  theme: string;

  @ApiProperty({
    description: 'Estimated time to complete (in minutes)',
    example: '30',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  estimatedTime: string;

  @ApiProperty({
    enum: AgeRange,
    description: 'Age range for this challenge',
    example: AgeRange.AGE_9_TO_12,
  })
  @IsEnum(AgeRange)
  @IsNotEmpty()
  ageRange: AgeRange;

  @ApiProperty({
    description: 'Image URL',
    example: 'https://example.com/challenge-image.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({
    description: 'Video tutorial URL',
    example: 'https://www.youtube.com/watch?v=example',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  videoTutorialUrl?: string;
}
