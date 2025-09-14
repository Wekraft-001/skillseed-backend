import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Name of the category', example: 'Digital Marketing' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Description of the category', example: 'Learn about digital marketing strategies and techniques', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Icon for the category (URL or base64 image data)', example: 'https://example.com/icon.png', required: false })
  @IsString()
  @IsOptional()
  icon?: string;
}

export class UpdateCategoryDto {
  @ApiProperty({ description: 'Name of the category', example: 'Digital Marketing', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Description of the category', example: 'Learn about digital marketing strategies and techniques', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Icon for the category (URL or base64 image data)', example: 'https://example.com/icon.png', required: false })
  @IsString()
  @IsOptional()
  icon?: string;
}
