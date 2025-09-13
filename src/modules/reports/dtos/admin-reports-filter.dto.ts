import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { DateRangeFilterDto } from './date-range-filter.dto';

export enum AdminReportTimeframe {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

export class AdminReportsFilterDto extends DateRangeFilterDto {
  @ApiProperty({ 
    enum: AdminReportTimeframe, 
    description: 'Timeframe to group results by', 
    example: AdminReportTimeframe.MONTHLY,
    required: false
  })
  @IsEnum(AdminReportTimeframe)
  @IsOptional()
  timeframe?: AdminReportTimeframe = AdminReportTimeframe.MONTHLY;

  @ApiProperty({ 
    description: 'School ID to filter results by', 
    example: '507f1f77bcf86cd799439011',
    required: false
  })
  @IsString()
  @IsOptional()
  schoolId?: string;

  @ApiProperty({ 
    description: 'Number of top items to return', 
    example: 10,
    required: false
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}
