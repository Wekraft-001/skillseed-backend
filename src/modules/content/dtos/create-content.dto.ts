import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';

export enum ContentType {
  VIDEO = 'video',
  BOOK = 'book',
}

export enum ContentCategory {
  SCIENCE = 'science',
  TECHNOLOGY = 'technology',
  ENGINEERING = 'engineering',
  ARTS = 'arts',
  MATHEMATICS = 'mathematics',
  HISTORY = 'history',
  LITERATURE = 'literature',
  CAREER = 'career',
  GENERAL = 'general',
}

export enum TargetAudience {
  PARENT = 'parent',
  SCHOOL = 'school',
  MENTOR = 'mentor',
  ALL = 'all'
}

export class CreateContentDto {
  @ApiProperty({ description: 'Title of the content', example: 'Introduction to Robotics' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Description of the content', example: 'Learn the basics of robotics for beginners' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: ContentType, description: 'Type of content', example: ContentType.VIDEO })
  @IsEnum(ContentType)
  @IsNotEmpty()
  type: ContentType;

  @ApiProperty({ enum: ContentCategory, description: 'Category of content', example: ContentCategory.TECHNOLOGY })
  @IsEnum(ContentCategory)
  @IsNotEmpty()
  category: ContentCategory;

  @ApiProperty({ enum: TargetAudience, description: 'Target audience for the content', example: TargetAudience.ALL })
  @IsEnum(TargetAudience)
  @IsNotEmpty()
  targetAudience: TargetAudience;

  @ApiProperty({ description: 'URL for video content', example: 'https://www.youtube.com/watch?v=example', required: false })
  @ValidateIf(o => o.type === ContentType.VIDEO)
  @IsUrl()
  @IsNotEmpty()
  videoUrl?: string;

  @ApiProperty({ description: 'Author of the book', example: 'John Doe', required: false })
  @ValidateIf(o => o.type === ContentType.BOOK)
  @IsString()
  @IsNotEmpty()
  author?: string;

  @ApiProperty({ description: 'Book URL or resource link', example: 'https://example.com/book.pdf', required: false })
  @ValidateIf(o => o.type === ContentType.BOOK)
  @IsUrl()
  @IsNotEmpty()
  bookUrl?: string;

  @ApiProperty({ description: 'Thumbnail image URL', example: 'https://example.com/thumbnail.jpg', required: false })
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;
}
