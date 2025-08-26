import { ApiProperty } from '@nestjs/swagger';
import { Mentor } from 'src/modules/schemas';

export class AuthTokenResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  access_token: string;

  @ApiProperty({ type: () => Mentor })
  user: any;
}


