import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterParentDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @MinLength(6)
  password: string;
}


