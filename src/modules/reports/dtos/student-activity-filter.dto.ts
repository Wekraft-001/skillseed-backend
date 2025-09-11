import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DateRangeFilterDto } from './date-range-filter.dto';

export enum ActivityType {
  CHALLENGE = 'challenge',
  QUIZ = 'quiz',
  LESSON = 'lesson',
  MENTOR_SESSION = 'mentor_session',
  ALL = 'all'
}

export enum ActivityStatus {
  COMPLETED = 'completed',
  IN_PROGRESS = 'in_progress',
  NOT_STARTED = 'not_started',
  ALL = 'all'
}

export class StudentActivityFilterDto extends DateRangeFilterDto {
  @ApiProperty({ 
    enum: ActivityType, 
    description: 'Type of activity to filter by', 
    example: ActivityType.CHALLENGE,
    required: false
  })
  @IsEnum(ActivityType)
  @IsOptional()
  activityType?: ActivityType;

  @ApiProperty({ 
    enum: ActivityStatus, 
    description: 'Status of activities to filter by', 
    example: ActivityStatus.COMPLETED,
    required: false
  })
  @IsEnum(ActivityStatus)
  @IsOptional()
  status?: ActivityStatus;

  @ApiProperty({ 
    description: 'Sort order for results (asc or desc)', 
    example: 'desc',
    required: false
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
