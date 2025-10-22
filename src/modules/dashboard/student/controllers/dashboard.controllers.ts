import {
  Controller,
  UseGuards,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/interfaces';
import { CurrentUser } from 'src/common/decorators';
import { User } from 'src/modules/schemas';
import { StudentDashboardService } from '../services/dashboard.service';
import { LoggerService } from 'src/common/logger/logger.service';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RewardsService } from 'src/modules/rewards/rewards.service';

@Controller('student/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
@ApiBearerAuth()
@ApiTags('STUDENT DASHBOARD')
export class StudentDashboardController {
  constructor(
    private readonly studentDashboardService: StudentDashboardService,
    private readonly logger: LoggerService,
    private readonly rewardsService: RewardsService,
  ) {}

  /**
   * Extract JWT token from request headers
   */
  private getTokenFromRequest(req: Request): string {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new Error('No authorization header found');
    }
    return authHeader.replace('Bearer ', '');
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Get student dashboard data including profile, quiz status, and recommendations',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns dashboard data with profile, initial quiz status if not taken, and personalized content',
  })
  async getDashboard(@CurrentUser() student: User, @Req() req: Request) {
    const token = this.getTokenFromRequest(req);
    return this.studentDashboardService.getDashboardData(student, token);
  }

  @Get('initial-quiz')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get initial career assessment quiz for student' })
  @ApiResponse({
    status: 200,
    description:
      'Returns the initial quiz if not completed, or completed quiz data if already taken',
  })
  async getInitialQuiz(@CurrentUser() student: User) {
    return this.studentDashboardService.getInitialQuiz(student);
  }

  @Post('initial-quiz/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit answers for initial career assessment quiz',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns quiz analysis and personalized recommendations',
  })
  async submitInitialQuiz(
    @CurrentUser() student: User,
    @Body()
    answers: { phaseIndex: number; questionIndex: number; answer: string }[],
    @Req() req: Request,
  ) {
    const quiz = await this.studentDashboardService.getInitialQuiz(student);
    if (!quiz) {
      throw new NotFoundException('Initial quiz not found');
    }

    const token = this.getTokenFromRequest(req);
    return this.studentDashboardService.submitQuizAnswers(
      student,
      quiz.id,
      answers,
      token,
    );
  }

  @Get('recommendations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get personalized educational content recommendations',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns tailored educational content based on quiz results',
  })
  async getRecommendations(@CurrentUser() student: User, @Req() req: Request) {
    const token = this.getTokenFromRequest(req);
    return this.studentDashboardService.getRecommendations(student, token);
  }

  @Post('recommendations/:id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark educational content as completed and earn a star',
  })
  @ApiParam({ name: 'id', description: 'Educational content ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['contentType', 'contentIndex'],
      properties: {
        contentType: { type: 'string', enum: ['video', 'book', 'game'] },
        contentIndex: {
          type: 'number',
          description: 'Index of the content item in the array',
        },
      },
    },
  })
  async completeEducationalContent(
    @CurrentUser() student: User,
    @Param('id') educationalContentId: string,
    @Body()
    payload: { contentType: 'video' | 'book' | 'game'; contentIndex: number },
  ) {
    // Check if the educational content exists and belongs to the student
    const content =
      await this.studentDashboardService.getEducationalContent(
        educationalContentId,
      );

    if (
      !content ||
      content.user.toString() !== (student as any)._id.toString()
    ) {
      throw new NotFoundException(
        'Educational content not found or does not belong to you',
      );
    }

    // Award a star for completion
    const star = await this.rewardsService.completeEducationalContent(
      (student as any)._id,
      educationalContentId,
      payload.contentType,
      payload.contentIndex,
    );

    return {
      message: `${payload.contentType} marked as completed successfully`,
      star,
    };
  }
}
