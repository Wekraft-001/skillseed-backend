import { Body, Controller, Get, Post, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators';
import { User } from '../schemas';
import { SubmitAnswersDto, UserRole } from 'src/common/interfaces';

@Controller('ai')
@ApiTags('AI')
export class AiController {
  private readonly logger = new Logger(AiController.name);
  
  constructor(private readonly aiService: AiService) {}

  // Signed-in student quiz creation
  @Post('quiz')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Create a quiz for a signed-in student' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ageRange: { type: 'string', enum: ['6-8', '9-12', '13-15', '16-18'] },
      },
      required: ['ageRange'],
    },
  })
  createQuiz(
    @CurrentUser() user: User,
    @Body() body: { ageRange: string },
  ) {
    return this.aiService.generateCareerQuizForUserId((user as any)._id, body.ageRange);
  }

  // Signed-in student quiz submit
  @Post('quiz/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Submit answers for a student quiz' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        quizId: { type: 'string' },
        answers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phaseIndex: { type: 'number', example: 0 },
              questionIndex: { type: 'number', example: 1 },
              answer: { type: 'string', example: 'Often' },
            },
            required: ['phaseIndex', 'questionIndex', 'answer'],
          },
        },
      },
      required: ['quizId', 'answers'],
    },
  })
  submitQuiz(
    @CurrentUser() user: User,
    @Body() body: SubmitAnswersDto,
  ) {
    return this.aiService.submitAnswers(body, (user as any)._id);
  }

  // Signed-in recommendations creation
  @Post('recommendations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Generate educational content recommendations for a student' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        childId: { type: 'string', description: 'Required if caller is parent or school_admin' },
        quizId: { type: 'string', description: 'ID of the specific quiz to use for recommendations' },
      },
    },
  })
  generateRecommendations(
    @CurrentUser() user: User, 
    @Body() body: { childId?: string; quizId?: string },
    @Query('quizId') queryQuizId?: string
  ) {
    const targetUserId =
      user.role === UserRole.STUDENT ? (user as any)._id : body.childId;
    // Use quizId from query parameters or body
    const quizId = queryQuizId || body.quizId;
    return this.aiService.generateEducationalContent(targetUserId as any, quizId);
  }

  // Also support GET method for recommendations
  @Get('recommendations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get educational content recommendations for a student' })
  getRecommendations(
    @CurrentUser() user: User, 
    @Query('childId') childId?: string,
    @Query('quizId') quizId?: string
  ) {
    this.logger.log(`GET recommendations for user ${user._id} with childId ${childId || 'N/A'} and quizId ${quizId || 'N/A'}`);
    const targetUserId =
      user.role === UserRole.STUDENT ? (user as any)._id : childId;
    return this.aiService.generateEducationalContent(targetUserId as any, quizId);
  }
  
  @Post('recommendations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get educational content recommendations for a student (POST method)' })
  postRecommendations(
    @CurrentUser() user: User, 
    @Body() body: { childId?: string; quizId?: string },
    @Query('childId') queryChildId?: string,
    @Query('quizId') queryQuizId?: string
  ) {
    const childId = body.childId || queryChildId;
    const quizId = body.quizId || queryQuizId;
    
    this.logger.log(`POST recommendations for user ${user._id} with childId ${childId || 'N/A'} and quizId ${quizId || 'N/A'}`);
    
    const targetUserId =
      user.role === UserRole.STUDENT ? (user as any)._id : childId;
    return this.aiService.generateEducationalContent(targetUserId as any, quizId);
  }

  // Signed-in latest content access
  @Get('content/latest')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get latest educational content for current student' })
  latestContent(@CurrentUser() user: User) {
    return this.aiService.getLatestEducationalContentForUser((user as any)._id as any);
  }

  // Guest quiz (no auth)
  @Post('guest/quiz')
  @ApiOperation({ summary: 'Create a guest (anonymous) quiz' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', example: 'anon-1234' },
        ageRange: { type: 'string', enum: ['6-8', '9-12', '13-15', '16-18'] },
      },
      required: ['sessionId', 'ageRange'],
    },
  })
  createAnonymousQuiz(@Body() body: { sessionId: string; ageRange: string }) {
    return this.aiService.generateGuestQuiz(body.sessionId, body.ageRange);
  }

  @Post('guest/quiz/submit')
  @ApiOperation({ summary: 'Submit answers for guest quiz and get analysis' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
        quizId: { type: 'string' },
        answers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phaseIndex: { type: 'number' },
              questionIndex: { type: 'number' },
              answer: { type: 'string' },
            },
            required: ['phaseIndex', 'questionIndex', 'answer'],
          },
        },
      },
      required: ['sessionId', 'quizId', 'answers'],
    },
  })
  submitGuestQuiz(
    @Body()
    body: {
      sessionId: string;
      quizId: string;
      answers: { phaseIndex: number; questionIndex: number; answer: string }[];
    },
  ) {
    return this.aiService.submitGuestAnswers(body);
  }

  @Post('guest/recommendations')
  @ApiOperation({ summary: 'Get guest recommendations after analysis' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
        quizId: { type: 'string' },
      },
      required: ['sessionId', 'quizId'],
    },
  })
  guestRecommendations(@Body() body: { sessionId: string; quizId: string }) {
    return this.aiService.generateGuestRecommendations(body);
  }
}


