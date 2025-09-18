import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';

export class FilterCommunityDto {
  @ApiProperty({
    description: 'Filter by community category (legacy)',
    required: false,
  })
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'Filter by category ID',
    example: '60d21b4667d0d8992e610c85',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({
    description: 'Filter by age group',
    required: false,
  })
  @IsOptional()
  ageGroup?: string;

  @ApiProperty({ description: 'Search term', required: false })
  @IsString()
  @IsOptional()
  search?: string;
}
