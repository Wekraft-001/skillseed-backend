import {
  Controller,
  UseGuards,
  Request,
  Get,
  Post,
  HttpCode,
  HttpStatus,
  Patch,
  UseInterceptors,
  Body,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { MentorDashboardService } from '../services/dashboard.services';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { Model } from 'mongoose';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UpdateMentorProfileDto, UserRole } from 'src/common/interfaces';
import { LoggerService } from 'src/common/logger/logger.service';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/modules/schemas';
import { Mentor } from '../schema/mentor.schema';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from 'src/common/decorators';

@Controller('mentor/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MENTOR)
@ApiTags('MENTOR DASHBOARD')
export class MentorDashboardController {
  constructor(
    private readonly mentorDashboardService: MentorDashboardService,
    private readonly logger: LoggerService,

    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  async getProfile(@Request() req) {
    const mentorId = req.user._id;
    return this.mentorDashboardService.getMentorProfile(mentorId);
  }

  @Post('credentials/upload')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'governmentId', maxCount: 1 },
      { name: 'professionalCredentials', maxCount: 1 },
    ]),
  )
  @ApiOperation({ summary: 'Upload mentor credentials' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        governmentId: {
          type: 'string',
          format: 'binary',
          description: 'Government ID document (PDF, JPG, or PNG) - Max 5MB',
        },
        professionalCredentials: {
          type: 'string',
          format: 'binary',
          description: 'Professional credentials document (PDF, JPG, or PNG) - Max 5MB',
        },
        description: {
          type: 'string',
          description: 'Description of the credentials',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Credentials uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  async uploadCredentials(
    @CurrentUser() user: User,
    @UploadedFiles() files: {
      governmentId?: Express.Multer.File[];
      professionalCredentials?: Express.Multer.File[];
    },
    @Body() body: { description?: string },
  ) {
    return this.mentorDashboardService.uploadCredentials(user, files, body.description);
  }

  @Get('credentials')
  @ApiOperation({ summary: 'Get mentor credentials' })
  @ApiResponse({ status: 200, description: 'Returns list of uploaded credentials' })
  async getCredentials(@CurrentUser() user: User) {
    return this.mentorDashboardService.getCredentials(user);
  }

  @Patch('update-profile')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'photo', maxCount: 1 },
      { name: 'nationalId', maxCount: 1 },
    ]),
  )
  @ApiOperation({ summary: 'Mentor updates own profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: Mentor,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({
    description: 'Update mentor profile fields and upload files',
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string', format: 'email' },
        biography: { type: 'string' },
        linkedin: { type: 'string' },
        photo: { type: 'string', format: 'binary' },
        specialty: { type: 'string' },
        areasOfExpertise: { type: 'array', items: { type: 'string' } },
        yearsOfExperience: { type: 'string' },
        education: { type: 'string' },
        languages: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async updateOwnProfile(
    @CurrentUser() mentorUser: User,
    @Body() updateDto: UpdateMentorProfileDto,
    @UploadedFiles() files?: any,
  ): Promise<Mentor> {
    return this.mentorDashboardService.updateMentorProfile(
      mentorUser._id as unknown as string,
      updateDto,
      {
        photo: (files?.photo && files.photo[0]) || undefined,
        nationalId: (files?.nationalId && files.nationalId[0]) || undefined,
      },
    );
  }
}
