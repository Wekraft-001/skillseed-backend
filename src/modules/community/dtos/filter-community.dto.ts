import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AgeGroup, CommunityCategory } from '../../schemas/community.schema';

export class FilterCommunityDto {
  @ApiProperty({ enum: CommunityCategory, description: 'Filter by community category (legacy)', required: false })
  @IsEnum(CommunityCategory)
  @IsOptional()
  category?: CommunityCategory;

  @ApiProperty({ enum: AgeGroup, description: 'Filter by age group', required: false })
  @IsEnum(AgeGroup)
  @IsOptional()
  ageGroup?: AgeGroup;

  @ApiProperty({ description: 'Search term', required: false })
  @IsString()
  @IsOptional()
  search?: string;
}
