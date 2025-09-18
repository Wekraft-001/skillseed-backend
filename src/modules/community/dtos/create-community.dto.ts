import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Types } from 'mongoose';

export class CreateCommunityDto {
  @ApiProperty({
    description: 'Name of the community',
    example: 'Tech & Coding Club',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Description of the community',
    example: 'Join us to learn coding and explore technology in a fun way!',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Legacy category of the community (deprecated)',
    example: 'Name of category',
    required: false,
  })
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'ID of the category for this community',
    example: '60d21b4667d0d8992e610c85',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({
    description: 'Age group for this community',
    example: '9-12',
  })
  @IsNotEmpty()
  ageGroup: string;
}
