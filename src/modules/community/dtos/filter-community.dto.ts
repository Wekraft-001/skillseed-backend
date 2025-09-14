import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { AgeGroup, CommunityCategory } from '../../schemas/community.schema';

export class FilterCommunityDto {
  @ApiProperty({ enum: CommunityCategory, description: 'Filter by community category (legacy)', required: false })
  @IsEnum(CommunityCategory)
  @IsOptional()
  category?: CommunityCategory;

  @ApiProperty({ description: 'Filter by category ID', example: '60d21b4667d0d8992e610c85', required: false })
  @IsMongoId()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ enum: AgeGroup, description: 'Filter by age group', required: false })
  @IsEnum(AgeGroup)
  @IsOptional()
  ageGroup?: AgeGroup;

  @ApiProperty({ description: 'Search term', required: false })
  @IsString()
  @IsOptional()
  search?: string;
}
