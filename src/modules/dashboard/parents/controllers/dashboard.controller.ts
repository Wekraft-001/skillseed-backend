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
  Param,
} from '@nestjs/common';
import { ParentDashboardService } from '../services/dashboard.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import {
  CreateSubscriptionDto,
  PaymentMethod,
  UserRole,
} from 'src/common/interfaces';
import { CreateStudentDto, TempStudentDataDto } from 'src/modules/auth/dtos';
import { FileInterceptor } from '@nestjs/platform-express';
import { LoggerService } from 'src/common/logger/logger.service';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/modules/schemas';
import { Model } from 'mongoose';
import { CurrentUser } from 'src/common/decorators';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SubscriptionService } from 'src/subscription/subscription.service';

@Controller('parent/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PARENT)
@ApiTags('PARENT DASHBOARD')
export class ParentDashboardController {
  constructor(
    private readonly parentDashboardService: ParentDashboardService,
    private readonly subscriptionService: SubscriptionService,
    private readonly logger: LoggerService,

    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  @Get()
  async getDashboard(@Request() req) {
    const currentUser = req.user;
    return this.parentDashboardService.getDashboardData(currentUser);
  }

  @ApiOperation({
    summary:
      'Initiate child registration (parent) - create draft and store securely',
  })
  @Post('students/initiate')
  @UseInterceptors(FileInterceptor('image'))
  async initiateStudent(
    @UploadedFile() image: Express.Multer.File,
    @Body() body: TempStudentDataDto,
    @CurrentUser() user: User,
  ) {
    return this.parentDashboardService.initiateStudentRegistration(
      body,
      user,
      image,
    );
  }

  @ApiOperation({
    summary: 'Generate payment link for child registration (parent)',
  })
  @Post('students/:childTempId/payment-link')
  async generatePaymentLink(
    @Param('childTempId') childTempId: string,
    @Body() subscriptionData: CreateSubscriptionDto,
    @CurrentUser() user: User,
  ) {
    return this.parentDashboardService.completeStudentRegistration(
      childTempId,
      subscriptionData,
      user,
      subscriptionData.payment_options,
    );
  }

  @ApiOperation({
    summary: 'Finalize child registration after payment (parent)',
  })
  @Post('students/:childTempId/finalize')
  async finalizeStudent(
    @Param('childTempId') childTempId: string,
    @CurrentUser() user: User,
  ) {
    const temp =
      await this.parentDashboardService.getTempStudentData(childTempId);
    if (!temp) {
      throw new Error('Temporary student data not found');
    }
    return this.parentDashboardService.registerFinalStudent(temp as any, user);
  }

  @Get('students')
  @HttpCode(HttpStatus.OK)
  async getStudent(@Request() req) {
    const user = req.user;
    try {
      this.logger.log(`Fetching student for user: ${user.email}`);
      return await this.parentDashboardService.getStudentForUser(user);
    } catch (error) {
      this.logger.error(`Error fetching student for user: ${user._id}`, error);
      throw error;
    }
  }

  @Get('students/:studentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get complete profile for a single student',
    description:
      'Returns the full student profile including registration details, ' +
      'subscription status, career profile (interests, skills, dream job from quiz), ' +
      'learning activity counts (challenges, books, videos, games), ' +
      'learning journey progress (reading %, video %, problem solving %, streak), ' +
      'and recent badges. Returns 404 if the student does not belong to this parent.',
  })
  @ApiParam({ name: 'studentId', description: 'Student MongoDB ObjectId' })
  async getStudentById(
    @CurrentUser() user: User,
    @Param('studentId') studentId: string,
  ) {
    return this.parentDashboardService.getStudentById(
      (user as any)._id.toString(),
      studentId,
    );
  }

  @ApiOperation({
    summary: 'Get all subscriptions created by the parent (with child details)',
  })
  @Get('subscriptions')
  @HttpCode(HttpStatus.OK)
  async getSubscriptions(@CurrentUser() user: User) {
    try {
      this.logger.log(`Fetching subscriptions for parent: ${user.email}`);
      return await this.parentDashboardService.getUserSubscriptions(user);
    } catch (error) {
      this.logger.error(
        `Error fetching subscriptions for parent: ${user._id}`,
        error,
      );
      throw error;
    }
  }

  @Post('subscriptions/:subscriptionId/renew')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renew an existing child subscription',
    description:
      'Generates a new Flutterwave payment link to renew the specified subscription. ' +
      'After the parent completes payment the webhook will activate the new subscription ' +
      "and restore the child's login access.",
  })
  @ApiParam({
    name: 'subscriptionId',
    description: 'Subscription MongoDB ObjectId',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentMethod: {
          type: 'string',
          enum: ['card', 'mobilemoney'],
          description: 'Payment method for renewal (default: card)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Renewal payment link generated',
    schema: {
      example: {
        message: 'Renewal payment link generated successfully',
        paymentLink: 'https://checkout.flutterwave.com/v3/hosted/pay/...',
        reference: 'renewal-uuid',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription not found or does not belong to you',
  })
  async renewSubscription(
    @CurrentUser() user: User,
    @Param('subscriptionId') subscriptionId: string,
    @Body() body: { paymentMethod?: 'card' | 'mobilemoney' },
  ) {
    const method =
      body?.paymentMethod === 'mobilemoney'
        ? PaymentMethod.MOBILE_MONEY
        : PaymentMethod.CREDIT_CARD;

    const result = await this.subscriptionService.renewSubscription(
      subscriptionId,
      (user as any)._id.toString(),
      method,
    );

    return {
      message: 'Renewal payment link generated successfully',
      paymentLink: result.paymentLink,
      reference: result.reference,
    };
  }

  @Get('children/overview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Get a summary overview for ALL children of the authenticated parent. ' +
      'Returns career profile, learning activities, badges, and learning journey ' +
      'stats for each child. Used to populate child-switcher cards on the dashboard.',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of child overview objects',
    schema: {
      example: [
        {
          child: {
            id: '664abc...',
            firstName: 'Sophia',
            lastName: 'Kelechi',
            age: 14,
            grade: 'Grade 9',
            image: 'https://...',
          },
          careerProfile: {
            interests: ['Technology', 'Science'],
            skills: ['Curious learner', 'Self-motivated'],
            dreamJob: 'Software Engineer',
            quizCompleted: true,
          },
          learningActivities: {
            totalCompleted: 8,
            challengesCompleted: 4,
            booksCompleted: 2,
            videosWatched: 2,
            gamesPlayed: 0,
          },
          learningJourney: {
            streak: 5,
            reading: { completed: 2, target: 20, percentage: 10 },
            videos: { watched: 2, target: 10, percentage: 20 },
            problemSolving: { completed: 4, target: 15, percentage: 27 },
          },
          badges: {
            total: 3,
            recent: [
              {
                id: '665def...',
                name: 'First Challenge',
                earnedAt: '2026-04-01T10:00:00.000Z',
              },
            ],
          },
          lastActive: '2026-04-09T00:00:00.000Z',
        },
      ],
    },
  })
  async getAllChildrenOverview(@CurrentUser() user: User) {
    return this.parentDashboardService.getAllChildrenOverview(
      (user as any)._id.toString(),
    );
  }

  @Get('children/:childId/overview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Get a detailed overview for a single child. ' +
      'Includes career profile (from quiz analysis), learning activity counts, ' +
      'learning journey progress, and recent badges. ' +
      'Returns 404 if the child does not belong to the authenticated parent.',
  })
  @ApiParam({
    name: 'childId',
    description: 'Child (student) MongoDB ObjectId',
  })
  @ApiResponse({ status: 200, description: 'Child overview object' })
  @ApiResponse({ status: 404, description: 'Child not found or access denied' })
  async getChildOverview(
    @CurrentUser() user: User,
    @Param('childId') childId: string,
  ) {
    return this.parentDashboardService.getChildOverview(
      (user as any)._id.toString(),
      childId,
    );
  }

  @Get('children/:childId/insights')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get detailed engagement insights for a child' })
  @ApiParam({ name: 'childId', description: 'Child MongoDB ObjectId' })
  async getChildInsights(
    @CurrentUser() user: User,
    @Param('childId') childId: string,
  ) {
    return this.parentDashboardService.getChildOverview(
      (user as any)._id.toString(),
      childId,
    );
  }
}
