import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CommunityCategory } from '../../schemas/community.schema';

export class FilterCommunityDto {
  @ApiProperty({ enum: CommunityCategory, description: 'Filter by community category', required: false })
  @IsEnum(CommunityCategory)
  @IsOptional()
  category?: CommunityCategory;

  @ApiProperty({ description: 'Search term', required: false })
  @IsString()
  @IsOptional()
  search?: string;
}
