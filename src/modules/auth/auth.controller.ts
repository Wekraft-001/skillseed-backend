import {
  UseGuards,
  Get,
  Req,
  Res,
  Controller,
  Body,
  Post,
  UsePipes,
  HttpStatus,
} from '@nestjs/common';
import { CreateAdminOrParentDto, LoginDto } from './dtos';
import { AuthService } from './auth.service';
import { SanitizePipe } from '../sanitizer/sanitize.pipe';
import { ApiResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '../schemas';
import { CurrentUser } from 'src/common/decorators';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { LoggerService } from 'src/common/logger/logger.service';
import { ParentDashboardService } from '../dashboard/parents/services/dashboard.service';
import { AuthTokenResponseDto } from 'src/common/interfaces';

@Controller('auth')
@ApiTags('AUTH')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private jwtService: JwtService,
    private logger: LoggerService,
    private readonly parentDashboardService: ParentDashboardService,
  ) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Req() req: Request) {
    return { message: 'Redirecting to Google login......' };
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: User,
  ) {
    try {
      const payload = {
        sub: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phoneNumber: user.phoneNumber,
        email: user.email,
      };

      const token = await this.jwtService.sign(payload, { expiresIn: '1d' });

      // Redirect to frontend with token in query params
      const frontendUrl =
        process.env.GOOGLE_FRONTEND_URL || 'https://parents.wekraft.co/';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
      this.logger.error('Error in Google OAuth callback: ', error);
      res.redirect(
        `${process.env.GOOGLE_FRONTEND_URL || 'https://parents.wekraft.co/'}/login?error=OAuthFailed`,
      );
    }
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user (SuperAdmin & Parent)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async registerAdmin0rParent(@Body() userDto: CreateAdminOrParentDto) {
    return this.authService.registerAdminOrParent(userDto);
  }

  @Post('signin')
  @UsePipes(new SanitizePipe())
  @ApiOperation({ summary: 'User login (SuperAdmin & Parent)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Login successful' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'invalid credentials',
  })
  sigin(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('school/signin')
  async schoolLogin(@Body() dto: LoginDto) {
    return this.authService.schoolSignin(dto);
  }

  @Post('mentor/signin')
  @ApiOperation({ summary: 'Mentor sign in' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthTokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async mentorLogin(@Body() dto: LoginDto) {
    return this.authService.mentorSignin(dto);
  }

  @Post('child/signin')
  async childLogin(
    @Body() credentials: { firstName: string; password: string },
  ) {
    return this.authService.childLogin(credentials);
  }
}
