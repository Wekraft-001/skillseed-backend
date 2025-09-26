import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ContentType } from './create-content.dto';

export class FilterContentDto {
  @ApiProperty({
    enum: ContentType,
    description: 'Filter by content type',
    required: false,
  })
  @IsEnum(ContentType)
  @IsOptional()
  type?: ContentType;

  @ApiProperty({ description: 'Search term', required: false })
  @IsString()
  @IsOptional()
  search?: string;
}
