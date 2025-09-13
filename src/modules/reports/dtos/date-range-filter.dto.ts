import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class DateRangeFilterDto {
  @ApiProperty({ 
    description: 'Start date for filtering (ISO format)', 
    example: '2025-01-01T00:00:00.000Z',
    required: false
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ 
    description: 'End date for filtering (ISO format)', 
    example: '2025-09-11T23:59:59.999Z',
    required: false
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
