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
  Param,
  Delete,
  Patch,
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
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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
    return this.schoolDashboardService.getSchoolProfile(schoolId);
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

  // NEW: Update Student Endpoint
  @Patch('students/:studentId')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({
    summary: 'Update a student by ID (School Admin only)',
  })
  @ApiParam({ name: 'studentId', description: 'Student ID to update' })
  @ApiResponse({ status: 200, description: 'Student updated successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Student not found or unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only School Admin can update students',
  })
  async updateStudent(
    @Param('studentId') studentId: string,
    @UploadedFile() image: Express.Multer.File,
    @Body() updateData: Partial<CreateStudentDto>,
    @Request() req,
  ) {
    const currentUser = req.user;
    try {
      this.logger.log(
        `Updating student: ${studentId} by admin: ${currentUser.email}`,
      );
      return await this.schoolDashboardService.updateStudent(
        studentId,
        updateData,
        currentUser,
        image,
      );
    } catch (error) {
      this.logger.error(`Error updating student: ${studentId}`, error);
      throw error;
    }
  }

  // NEW: Delete Student Endpoint
  @Delete('students/:studentId')
  @ApiOperation({
    summary: 'Delete a student by ID (School Admin only)',
  })
  @ApiParam({ name: 'studentId', description: 'Student ID to delete' })
  @ApiResponse({ status: 200, description: 'Student deleted successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Student not found or unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only School Admin can delete students',
  })
  @HttpCode(HttpStatus.OK)
  async deleteStudent(@Param('studentId') studentId: string, @Request() req) {
    const currentUser = req.user;
    try {
      this.logger.log(
        `Deleting student: ${studentId} by admin: ${currentUser.email}`,
      );
      return await this.schoolDashboardService.deleteStudent(
        studentId,
        currentUser,
      );
    } catch (error) {
      this.logger.error(`Error deleting student: ${studentId}`, error);
      throw error;
    }
  }
}
