import {
  Controller,
  UseGuards,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/interfaces';
import { CurrentUser } from 'src/common/decorators';
import { User } from 'src/modules/schemas';
import { StudentDashboardService } from '../services/dashboard.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('student/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
@ApiTags('Student Dashboard')
export class StudentDashboardController {
  constructor(
    private readonly studentDashboardService: StudentDashboardService,
    private readonly logger: LoggerService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get student dashboard data including profile, quiz status, and recommendations' })
  @ApiResponse({
    status: 200,
    description: 'Returns dashboard data with profile, initial quiz status if not taken, and personalized content',
  })
  async getDashboard(@CurrentUser() student: User) {
    return this.studentDashboardService.getDashboardData(student);
  }

  @Get('initial-quiz')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get initial career assessment quiz for student' })
  @ApiResponse({
    status: 200,
    description: 'Returns the initial quiz if not completed, or completed quiz data if already taken',
  })
  async getInitialQuiz(@CurrentUser() student: User) {
    return this.studentDashboardService.getInitialQuiz(student);
  }

  @Post('initial-quiz/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit answers for initial career assessment quiz' })
  @ApiResponse({
    status: 200,
    description: 'Returns quiz analysis and personalized recommendations',
  })
  async submitInitialQuiz(
    @CurrentUser() student: User,
    @Body() answers: { phaseIndex: number; questionIndex: number; answer: string }[],
  ) {
    const quiz = await this.studentDashboardService.getInitialQuiz(student);
    if (!quiz) {
      throw new NotFoundException('Initial quiz not found');
    }

    return this.studentDashboardService.submitQuizAnswers(student, quiz.id, answers);
  }

  @Get('recommendations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get personalized educational content recommendations' })
  @ApiResponse({
    status: 200,
    description: 'Returns tailored educational content based on quiz results',
  })
  async getRecommendations(@CurrentUser() student: User) {
    return this.studentDashboardService.getRecommendations(student);
  }
}
