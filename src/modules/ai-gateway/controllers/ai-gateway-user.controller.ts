import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Logger,
  Headers,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AiGatewayService } from '../services';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators';
import { User } from '../../schemas';
import { UserRole } from 'src/common/interfaces';

@Controller('ai')
@ApiTags('AI Gateway')
export class AiGatewayController {
  private readonly logger = new Logger(AiGatewayController.name);

  constructor(private readonly aiGatewayService: AiGatewayService) {}

  // ---------------------------------------------------------------------------
  // Quiz
  // ---------------------------------------------------------------------------

  @Post('quiz')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[AI Gateway] Create a quiz for a signed-in student',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ageRange: { type: 'string', enum: ['6-8', '9-12', '13-15', '16-18'] },
      },
      required: ['ageRange'],
    },
  })
  async createQuiz(
    @CurrentUser() user: User,
    @Body() body: { ageRange: string },
    @Headers('authorization') authorization: string,
  ) {
    const token = authorization?.replace('Bearer ', '');
    return this.aiGatewayService.createQuiz(
      (user as any)._id,
      body.ageRange,
      token,
    );
  }

  @Post('quiz/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[AI Gateway] Submit answers for a student quiz' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        quizId: { type: 'string' },
        answers: {
          type: 'array',
          items: { type: 'number' },
          description: 'Array of answer indices',
        },
      },
      required: ['quizId', 'answers'],
    },
  })
  async submitQuiz(
    @CurrentUser() user: User,
    @Body() body: { quizId: string; answers: number[] },
    @Headers('authorization') authorization: string,
  ) {
    const token = authorization?.replace('Bearer ', '');
    const quizData = {
      ...body,
      userId: (user as any)._id,
    };
    return this.aiGatewayService.submitQuiz(quizData, token);
  }

  // ---------------------------------------------------------------------------
  // Recommendations
  // ---------------------------------------------------------------------------

  @Get('recommendations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      '[AI Gateway] Get educational content recommendations for a student',
  })
  async getRecommendations(
    @CurrentUser() user: User,
    @Headers('authorization') authorization: string,
  ) {
    const token = authorization?.replace('Bearer ', '');
    return this.aiGatewayService.getRecommendations((user as any)._id, token);
  }

  // ---------------------------------------------------------------------------
  // Career recommendations
  // ---------------------------------------------------------------------------

  @Get('career-recommendations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[AI Gateway] Get career recommendations based on completed quiz',
  })
  async getCareerRecommendations(
    @CurrentUser() user: User,
    @Query('quizId') quizId: string,
    @Headers('authorization') authorization: string,
  ) {
    const token = authorization?.replace('Bearer ', '');
    return this.aiGatewayService.getCareerRecommendations(
      (user as any)._id,
      token,
      quizId,
    );
  }

  // ---------------------------------------------------------------------------
  // Quiz analysis & content
  // ---------------------------------------------------------------------------

  @Get('quiz-analysis')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      '[AI Gateway] Get raw quiz analysis for debugging (development only)',
  })
  async getQuizAnalysis(
    @CurrentUser() user: User,
    @Query('quizId') quizId: string,
    @Headers('authorization') authorization: string,
  ) {
    const token = authorization?.replace('Bearer ', '');
    return this.aiGatewayService.getQuizAnalysis(
      (user as any)._id,
      quizId,
      token,
    );
  }

  @Get('content/latest')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[AI Gateway] Get latest educational content for current student',
  })
  async getLatestContent(
    @CurrentUser() user: User,
    @Headers('authorization') authorization: string,
  ) {
    const token = authorization?.replace('Bearer ', '');
    return this.aiGatewayService.getLatestContent((user as any)._id, token);
  }

  // ---------------------------------------------------------------------------
  // Health check
  // ---------------------------------------------------------------------------

  @Get('health')
  @ApiOperation({
    summary:
      '[AI Gateway] Health check for AI Gateway and microservice connection',
  })
  @ApiResponse({
    status: 200,
    description: 'AI Gateway health status and connection to AI microservice',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        timestamp: { type: 'string' },
        aiGateway: { type: 'object' },
        aiMicroservice: { type: 'object' },
      },
    },
  })
  async healthCheck() {
    return this.aiGatewayService.healthCheck();
  }
}
