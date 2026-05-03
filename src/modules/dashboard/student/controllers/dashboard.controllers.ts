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
import { LearningProgressService } from '../services/learning-progress.service';

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
    private readonly learningProgressService: LearningProgressService,
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

  // @Post('recommendations/:id/complete')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({
  //   summary: 'Mark educational content as completed and earn a star',
  // })
  // @ApiParam({ name: 'id', description: 'Educational content ID' })
  // @ApiBody({
  //   schema: {
  //     type: 'object',
  //     required: ['contentType', 'contentIndex'],
  //     properties: {
  //       contentType: { type: 'string', enum: ['video', 'book', 'game'] },
  //       contentIndex: {
  //         type: 'number',
  //         description: 'Index of the content item in the array',
  //       },
  //     },
  //   },
  // })
  // async markCompleted(
  //   @Param('contentId') contentId: string,
  //   @Body()
  //   body: {
  //     contentType: 'video' | 'book' | 'game';
  //     contentIndex: number;
  //     timeSpentSeconds?: number;
  //   },
  //   @CurrentUser() student: User,
  // ) {
  //   return this.studentDashboardService.markContentItemCompleted(
  //     student,
  //     contentId,
  //     body.contentType,
  //     body.contentIndex,
  //     body.timeSpentSeconds,
  //   );
  // }

  @Post('recommendations/:id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark a video or book as completed and earn a star',
  })
  @ApiParam({ name: 'id', description: 'Educational content document ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['contentType', 'contentIndex'],
      properties: {
        contentType: { type: 'string', enum: ['video', 'book'] },
        contentIndex: {
          type: 'number',
          description: 'Index of the item in its array',
        },
        timeSpentSeconds: {
          type: 'number',
          description: 'Optional — seconds spent on content',
        },
      },
    },
  })
  async markCompleted(
    @Param('id') contentId: string, // ← was @Param('contentId') which never matched :id
    @Body()
    body: {
      contentType: 'video' | 'book';
      contentIndex: number;
      timeSpentSeconds?: number;
    },
    @CurrentUser() student: User,
  ) {
    return this.studentDashboardService.markContentItemCompleted(
      student,
      contentId,
      body.contentType,
      body.contentIndex,
      body.timeSpentSeconds,
    );
  }

  @Get('progress')
  @ApiBearerAuth()
  async getLearningProgress(@CurrentUser() student: User) {
    return this.learningProgressService.getSummaryForUser(
      student._id.toString(),
    );
  }

  @Get('career-recommendation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get the student's saved career recommendation",
    description:
      'Returns the persisted career recommendation generated after quiz submission. ' +
      'Does NOT re-run analysis — reads directly from DB. ' +
      'Returns 404 if the student has not yet completed the career assessment quiz.',
  })
  @ApiResponse({
    status: 404,
    description: 'No career recommendation found — quiz not yet completed',
  })
  async getCareerRecommendation(@CurrentUser() student: User) {
    return this.studentDashboardService.getCareerRecommendation(student);
  }

  // ───Learning Journey endpoint ─────────────────────────────────────
  @Get('learning-journey')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Get the student's learning journey stats (reading, videos, problem solving, streak)",
  })
  @ApiResponse({
    status: 200,
    description: 'Returns learning journey progress and streak data',
    schema: {
      example: {
        streak: 5,
        longestStreak: 12,
        reading: { completed: 15, target: 20, percentage: 75 },
        videos: { watched: 8, target: 10, percentage: 80 },
        problemSolving: { completed: 12, target: 15, percentage: 80 },
      },
    },
  })
  async getLearningJourney(@CurrentUser() student: User) {
    return this.learningProgressService.getLearningJourney(
      (student as any)._id.toString(),
    );
  }
}
