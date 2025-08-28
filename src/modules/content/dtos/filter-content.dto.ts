import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ContentCategory, ContentType } from './create-content.dto';

export class FilterContentDto {
  @ApiProperty({ enum: ContentType, description: 'Filter by content type', required: false })
  @IsEnum(ContentType)
  @IsOptional()
  type?: ContentType;

  @ApiProperty({ enum: ContentCategory, description: 'Filter by content category', required: false })
  @IsEnum(ContentCategory)
  @IsOptional()
  category?: ContentCategory;

  @ApiProperty({ description: 'Search term', required: false })
  @IsString()
  @IsOptional()
  search?: string;
}
