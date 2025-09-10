import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
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

  @ApiProperty({ enum: AgeGroup, description: 'Age group for this community', example: AgeGroup.AGE_9_TO_12 })
  @IsEnum(AgeGroup)
  @IsNotEmpty()
  ageGroup: AgeGroup;
}
