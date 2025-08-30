import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateChallengeCategoryDto {
  @ApiProperty({ description: 'Name of the challenge category', example: 'Digital Marketing' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Description of the challenge category', example: 'Learn about digital marketing strategies and techniques', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Icon for the challenge category', example: 'fa-chart-line', required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ description: 'Color theme for the challenge category', example: '#4285F4', required: false })
  @IsString()
  @IsOptional()
  colorTheme?: string;
}

export class UpdateChallengeCategoryDto {
  @ApiProperty({ description: 'Name of the challenge category', example: 'Digital Marketing', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Description of the challenge category', example: 'Learn about digital marketing strategies and techniques', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Icon for the challenge category', example: 'fa-chart-line', required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ description: 'Color theme for the challenge category', example: '#4285F4', required: false })
  @IsString()
  @IsOptional()
  colorTheme?: string;
}
