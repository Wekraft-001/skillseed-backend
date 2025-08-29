import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { AgeGroup, CommunityCategory } from '../../schemas/community.schema';
import { Types } from 'mongoose';

export class CreateCommunityDto {
  @ApiProperty({ description: 'Name of the community', example: 'Tech & Coding Club' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Description of the community', example: 'Join us to learn coding and explore technology in a fun way!' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: CommunityCategory, description: 'Legacy category of the community (deprecated)', example: CommunityCategory.TECH_CODING, required: false })
  @IsEnum(CommunityCategory)
  @IsOptional()
  category?: CommunityCategory;

  @ApiProperty({ description: 'Challenge category ID that this community belongs to', example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsNotEmpty()
  challengeCategory: string | Types.ObjectId;

  @ApiProperty({ enum: AgeGroup, description: 'Age group for this community', example: AgeGroup.AGE_9_TO_12 })
  @IsEnum(AgeGroup)
  @IsNotEmpty()
  ageGroup: AgeGroup;

  @ApiProperty({ description: 'Community profile image URL', example: 'https://example.com/tech-club.jpg', required: false })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({ description: 'Community banner image URL', example: 'https://example.com/tech-banner.jpg', required: false })
  @IsOptional()
  @IsUrl()
  bannerUrl?: string;
}
