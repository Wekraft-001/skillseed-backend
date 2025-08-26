import {
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Get,
  Req,
  Res,
  Controller,
  Body,
  Post,
  UsePipes,
  HttpStatus,
} from '@nestjs/common';
import { CreateAdminOrParentDto, CreateStudentDto, LoginDto } from './dtos';
import { RegisterParentDto } from './dtos/register-parent.dto';
import { AuthService } from './auth.service';
import { SanitizePipe } from '../sanitizer/sanitize.pipe';
import {
  ApiResponse,
  ApiOperation,
  ApiTags,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { User } from '../schemas';
import { UserRole } from 'src/common/interfaces';
import { CurrentUser } from 'src/common/decorators';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { LoggerService } from 'src/common/logger/logger.service';
import { ParentDashboardService } from '../dashboard/parents/services/dashboard.service';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { RegisterMentorDto } from 'src/common/interfaces';
import { AuthTokenResponseDto } from 'src/common/interfaces';

@Controller('auth')
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

  // @Get('google/callback')
  // @UseGuards(GoogleAuthGuard)
  // async googleAuthCallback(
  //   @Req() req: Request,
  //   @Res() res: Response,
  //   @CurrentUser() user: User,
  // ) {
  //   try {
  //     const payload = {
  //       sub: user._id,
  //       firstName: user.firstName,
  //       lastName: user.lastName,
  //       role: user.role,
  //       phoneNumber: user.phoneNumber,
  //       email: user.email,
  //     };

  //     const token = await this.jwtService.sign(payload, { expiresIn: '1d' });

  //     // for testing purposes only
  //     const html = `
  //       <!DOCTYPE html>
  //       <html>
  //       <head>
  //         <title>Google OAuth Success</title>
  //         <style>
  //           body { font-family: Arial, sans-serif; padding: 20px; }
  //           .token { background: #f5f5f5; padding: 15px; border-radius: 5px; word-break: break-all; }
  //           .user-info { background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; }
  //         </style>
  //       </head>
  //       <body>
  //         <h1>🎉 Google OAuth Success!</h1>
  //         <div class="user-info">
  //           <h3>User Info:</h3>
  //           <p><strong>Email:</strong> ${user.email}</p>
  //           <p><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
  //           <p><strong>Role:</strong> ${user.role}</p>
  //           <p><strong>ID:</strong> ${user._id}</p>
  //         </div>
  //         <div class="token">
  //           <h3>JWT Token:</h3>
  //           <p>${token}</p>
  //         </div>
  //         <p><em>Copy this token to test your protected routes!</em></p>
  //         <script>
  //           // Also log to console for easy copying
  //           console.log('JWT Token:', '${token}');
  //         </script>
  //       </body>
  //       </html>
  //     `;
  //     res.send(html);
  //   } catch (error) {
  //     this.logger.error('Error in Google 0Auth callback: ', error);
  //     res.status(400).send(`
  //       <h1>❌ OAuth Error</h1>
  //       <p>Something went wrong: ${error.message}</p>
  //       <a href="/auth/google">Try Again</a>
  //     `);
  //   }
  // }

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
      const frontendUrl = process.env.GOOGLE_FRONTEND_URL || 'https://parents.wekraft.co/';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
      this.logger.error('Error in Google OAuth callback: ', error);
      res.redirect(
        `${process.env.GOOGLE_FRONTEND_URL || 'https://parents.wekraft.co/'}/login?error=OAuthFailed`,
      );
    }
  }

  // @ApiTags('Authentication')
  // @ApiResponse({
  //   status: HttpStatus.CREATED,
  //   description: 'User registered successfully',
  // })
  // @ApiResponse({
  //   status: HttpStatus.BAD_REQUEST,
  //   description: 'Invalid input data',
  // })
  // @ApiResponse({
  //   status: HttpStatus.CONFLICT,
  //   description: 'User already exists',
  // })
  // @ApiOperation({ summary: 'Register a new user ' })
  // @ApiResponse({
  //   status: HttpStatus.CREATED,
  //   description: 'User registered successfully',
  // })
  // @ApiResponse({
  //   status: HttpStatus.BAD_REQUEST,
  //   description: 'Invalid input data',
  // })
  // @ApiResponse({
  //   status: HttpStatus.CONFLICT,
  //   description: 'User already exists',
  // })
  // @ApiBadRequestResponse({
  //   description: 'Bad Request - Invalid input data',
  // })
  // @UseGuards(AuthGuard('jwt'), RolesGuard)
  // @Roles(UserRole.PARENT, UserRole.SCHOOL_ADMIN)
  // @Post('addStudent')
  // @UseInterceptors(FileInterceptor('image'))
  // async registerStudent(
  //   @UploadedFile() image: Express.Multer.File,
  //   @Body() createStudentDto: CreateStudentDto,
  //   @CurrentUser() user: User,
  // ) {
  //   return this.parentDashboardService.registerStudentByParent(createStudentDto, user, image);
  // }

  @Post('register')
  @ApiTags('Authentication')
  @ApiOperation({ summary: 'Register a new user' })
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
  @ApiTags('Authentication')
  @UsePipes(new SanitizePipe())
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Login successful' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'invalid credentials',
  })
  sigin(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('parent/signin')
  @ApiTags('Authentication')
  @ApiOperation({ summary: 'Parent sign in' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Login successful' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  async parentLogin(@Body() dto: LoginDto) {
    return this.authService.parentSignin(dto);
  }

  @Post('school/signin')
  async schoolLogin(@Body() dto: LoginDto) {
    return this.authService.schoolSignin(dto);
  }

  @Post('mentor/signin')
  @ApiTags('Mentor Authentication')
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

  @Post('mentor/register')
  @ApiTags('Mentor Authentication')
  @ApiOperation({ summary: 'Mentor self-registration' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'photo', maxCount: 1 },
      { name: 'nationalId', maxCount: 1 },
    ]),
  )
  @ApiBody({
    description: 'Mentor self-registration with optional photo and national ID',
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        specialty: { type: 'string' },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 },
        phoneNumber: { type: 'string' },
        city: { type: 'string' },
        country: { type: 'string' },
        biography: { type: 'string' },
        linkedin: { type: 'string' },
        photo: { type: 'string', format: 'binary' },
        nationalId: { type: 'string', format: 'binary' },
      },
      required: [
        'firstName',
        'lastName',
        'specialty',
        'email',
        'password',
        'phoneNumber',
        'city',
        'country',
      ],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Mentor registered successfully',
    type: AuthTokenResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async mentorRegister(
    @UploadedFile() _unused?: any,
    @Body() body?: RegisterMentorDto,
    @Req() req?: Request,
  ) {
    const files = (req as any)?.files as {
      photo?: any[];
      nationalId?: any[];
    };
    return this.authService.mentorSelfRegister(body, {
      photo: (files?.photo && files.photo[0]) || undefined,
      nationalId: (files?.nationalId && files.nationalId[0]) || undefined,
    });
  }

  @Post('parent/register')
  @ApiTags('Authentication')
  @ApiOperation({ summary: 'Parent self-registration' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Parent registered successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async parentRegister(@Body() dto: RegisterParentDto) {
    // Force role to parent regardless of input
    const payload: CreateAdminOrParentDto = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phoneNumber: dto.phoneNumber ? Number(dto.phoneNumber) : undefined,
      role: UserRole.PARENT,
      password: dto.password,
    };
    return this.authService.registerAdminOrParent(payload);
  }

  @Post('child/signin')
  async childLogin(
    @Body() credentials: { firstName: string; password: string },
  ) {
    return this.authService.childLogin(credentials);
  }
}
