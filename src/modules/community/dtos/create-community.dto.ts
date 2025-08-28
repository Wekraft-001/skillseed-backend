import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { CommunityCategory } from '../../schemas/community.schema';

export class CreateCommunityDto {
  @ApiProperty({ description: 'Name of the community', example: 'Tech & Coding Club' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Description of the community', example: 'Join us to learn coding and explore technology in a fun way!' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: CommunityCategory, description: 'Category of the community', example: CommunityCategory.TECH_CODING })
  @IsEnum(CommunityCategory)
  @IsNotEmpty()
  category: CommunityCategory;

  @ApiProperty({ description: 'Community profile image URL', example: 'https://example.com/tech-club.jpg', required: false })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({ description: 'Community banner image URL', example: 'https://example.com/tech-banner.jpg', required: false })
  @IsOptional()
  @IsUrl()
  bannerUrl?: string;
}
