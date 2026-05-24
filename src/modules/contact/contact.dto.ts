import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ContactFormDto {
  @ApiProperty({ example: 'Juliet' })
  @IsNotEmpty({ message: 'First name is required' })
  @IsString()
  @MaxLength(50)
  firstName: string;

  @ApiPropertyOptional({ example: 'Kelechi' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiProperty({ example: 'juliet@example.com' })
  @IsNotEmpty({ message: 'Email address is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiPropertyOptional({ example: '+250788000000' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @ApiProperty({ example: 'How do I register my child on Skillseed?' })
  @IsNotEmpty({ message: 'Question is required' })
  @IsString()
  @MaxLength(2000)
  question: string;
}
