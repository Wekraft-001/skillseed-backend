import { 
  Controller, 
  Get, 
  Param, 
  Query, 
  UseGuards, 
  BadRequestException 
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportsService } from '../services/reports.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators';
import { User } from '../../schemas';
import { StudentActivityFilterDto, AdminReportsFilterDto, ActivityType, ActivityStatus, AdminReportTimeframe } from '../dtos';
import { UserRole } from 'src/common/interfaces';
import { LoggerService } from 'src/common/logger/logger.service';

@Controller('reports')
@ApiTags('REPORTS')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly logger: LoggerService
  ) {
    this.logger.setContext('ReportsController');
  }

  // Student report endpoints for parents and schools
  
  @Get('students/:studentId/activities')
  @Roles(UserRole.PARENT, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get student activities report' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiQuery({ name: 'activityType', enum: ActivityType, required: false })
  @ApiQuery({ name: 'status', enum: ActivityStatus, required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'sortOrder', enum: ['asc', 'desc'], required: false })
  @ApiResponse({ status: 200, description: 'Student activities report' })
  async getStudentActivities(
    @Param('studentId') studentId: string,
    @Query() filterDto: StudentActivityFilterDto,
    @CurrentUser() user: User
  ) {
    try {
      // Check authorization - parent can only view their children, school can only view their students
      await this.validateStudentAccess(user, studentId);
      
      return this.reportsService.getStudentActivities(studentId, filterDto);
    } catch (error) {
      this.logger.error(`Error in getStudentActivities: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('students/:studentId/ratings')
  @Roles(UserRole.PARENT, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get student mentor ratings report' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'sortOrder', enum: ['asc', 'desc'], required: false })
  @ApiResponse({ status: 200, description: 'Student mentor ratings report' })
  async getStudentMentorRatings(
    @Param('studentId') studentId: string,
    @Query() filterDto: StudentActivityFilterDto,
    @CurrentUser() user: User
  ) {
    try {
      // Check authorization
      await this.validateStudentAccess(user, studentId);
      
      return this.reportsService.getStudentMentorRatings(studentId, filterDto);
    } catch (error) {
      this.logger.error(`Error in getStudentMentorRatings: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('students/:studentId/sessions')
  @Roles(UserRole.PARENT, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get student session logs report' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'sortOrder', enum: ['asc', 'desc'], required: false })
  @ApiResponse({ status: 200, description: 'Student session logs report' })
  async getStudentSessionLogs(
    @Param('studentId') studentId: string,
    @Query() filterDto: StudentActivityFilterDto,
    @CurrentUser() user: User
  ) {
    try {
      // Check authorization
      await this.validateStudentAccess(user, studentId);
      
      return this.reportsService.getStudentSessionLogs(studentId, filterDto);
    } catch (error) {
      this.logger.error(`Error in getStudentSessionLogs: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('students/:studentId/achievements')
  @Roles(UserRole.PARENT, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get student achievements report' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'sortOrder', enum: ['asc', 'desc'], required: false })
  @ApiResponse({ status: 200, description: 'Student achievements report' })
  async getStudentAchievements(
    @Param('studentId') studentId: string,
    @Query() filterDto: StudentActivityFilterDto,
    @CurrentUser() user: User
  ) {
    try {
      // Check authorization
      await this.validateStudentAccess(user, studentId);
      
      return this.reportsService.getStudentAchievements(studentId, filterDto);
    } catch (error) {
      this.logger.error(`Error in getStudentAchievements: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Admin report endpoints
  
  @Get('admin/learning-hours')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get admin learning hours report' })
  @ApiQuery({ name: 'timeframe', enum: AdminReportTimeframe, required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'schoolId', required: false })
  @ApiResponse({ status: 200, description: 'Admin learning hours report' })
  async getAdminLearningHours(
    @Query() filterDto: AdminReportsFilterDto
  ) {
    try {
      return this.reportsService.getAdminLearningHours(filterDto);
    } catch (error) {
      this.logger.error(`Error in getAdminLearningHours: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('admin/skills-mastery')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get admin skills mastery report' })
  @ApiQuery({ name: 'timeframe', enum: AdminReportTimeframe, required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'schoolId', required: false })
  @ApiResponse({ status: 200, description: 'Admin skills mastery report' })
  async getAdminSkillsMastery(
    @Query() filterDto: AdminReportsFilterDto
  ) {
    try {
      return this.reportsService.getAdminSkillsMastery(filterDto);
    } catch (error) {
      this.logger.error(`Error in getAdminSkillsMastery: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('admin/schools')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get admin schools report' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Admin schools report' })
  async getAdminSchoolsReport(
    @Query() filterDto: AdminReportsFilterDto
  ) {
    try {
      return this.reportsService.getAdminSchoolsReport(filterDto);
    } catch (error) {
      this.logger.error(`Error in getAdminSchoolsReport: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('admin/students')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get admin students report' })
  @ApiQuery({ name: 'timeframe', enum: AdminReportTimeframe, required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'schoolId', required: false })
  @ApiResponse({ status: 200, description: 'Admin students report' })
  async getAdminStudentsReport(
    @Query() filterDto: AdminReportsFilterDto
  ) {
    try {
      return this.reportsService.getAdminStudentsReport(filterDto);
    } catch (error) {
      this.logger.error(`Error in getAdminStudentsReport: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('admin/engagement')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get admin student engagement report' })
  @ApiQuery({ name: 'timeframe', enum: AdminReportTimeframe, required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'schoolId', required: false })
  @ApiResponse({ status: 200, description: 'Admin student engagement report' })
  async getAdminEngagementReport(
    @Query() filterDto: AdminReportsFilterDto
  ) {
    try {
      return this.reportsService.getAdminEngagementReport(filterDto);
    } catch (error) {
      this.logger.error(`Error in getAdminEngagementReport: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Helper methods
  
  private async validateStudentAccess(user: User, studentId: string): Promise<boolean> {
    // This is a placeholder for the actual implementation
    // In a real system, this would check if:
    // 1. For parents: if the student is their child
    // 2. For school admins: if the student belongs to their school
    // 3. For super admins: always allowed
    
    return true;
  }
}
