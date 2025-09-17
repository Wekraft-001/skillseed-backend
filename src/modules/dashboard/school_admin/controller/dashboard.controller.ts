import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  Get,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { SchoolDashboardService } from '../services/index';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/interfaces';
import { CreateStudentDto } from 'src/modules/auth/dtos';
import { FileInterceptor } from '@nestjs/platform-express';
import { LoggerService } from 'src/common/logger/logger.service';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/modules/schemas';
import { Model } from 'mongoose';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ContentType,
  FilterContentWithoutCategoryDto,
} from 'src/modules/content/dtos';
import { CurrentUser } from 'src/common/decorators';

@Controller('school/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SCHOOL_ADMIN)
@ApiTags('SCHOOL DASHBOARD')
export class SchoolDashboardController {
  constructor(
    private readonly schoolDashboardService: SchoolDashboardService,
    private readonly logger: LoggerService,

    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  @Get()
  async getDashboard(@Request() req) {
    const currentUser = req.user;
    return this.schoolDashboardService.getDashboardData(currentUser);
  }

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  async getProfile(@Request() req) {
    const schoolId = req.user._id;
    return this.schoolDashboardService.getMyProfile(schoolId);
  }

  @Post('register-student')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({
    summary: 'Register a student under the current school (admin)',
  })
  @ApiResponse({ status: 201, description: 'Student registered' })
  async registerStudent(
    @UploadedFile() image: Express.Multer.File,
    @Body() createStudentDto: CreateStudentDto,
    @Request() req,
  ) {
    const currentUser = req.user;
    return this.schoolDashboardService.registerStudentBySchoolAdmin(
      createStudentDto,
      currentUser,
      image,
    );
  }

  @Get('students')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SCHOOL_ADMIN)
  async getStudent(@Request() req) {
    const user = req.user;
    try {
      this.logger.log(`Fetching student for user: ${user.email}`);
      return await this.schoolDashboardService.getStudentForUser(user);
    } catch (error) {
      this.logger.error(`Error fetching student for user: ${user._id}`, error);
      throw error;
    }
  }

  @Get('content')
  @ApiOperation({ summary: 'Get content uploaded by admin for schools' })
  @ApiQuery({ name: 'type', enum: ContentType, required: false })
  @ApiQuery({ name: 'search', required: false })
  async getContent(
    @CurrentUser() user: User,
    @Query() filterDto: FilterContentWithoutCategoryDto,
  ) {
    return this.schoolDashboardService.getContent((user as any)._id, filterDto);
  }

  @Get('resources')
  @ApiOperation({ summary: 'Get resources for school admins' })
  @ApiQuery({ name: 'type', enum: ContentType, required: false })
  @ApiQuery({ name: 'search', required: false })
  async getResources(
    @CurrentUser() user: User,
    @Query() filterDto: FilterContentWithoutCategoryDto,
  ) {
    return this.schoolDashboardService.getResources(
      (user as any)._id,
      filterDto,
    );
  }
}
