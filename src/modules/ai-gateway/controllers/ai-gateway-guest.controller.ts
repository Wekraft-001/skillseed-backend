import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiGatewayGuestService } from '../services';

@Controller('ai')
@ApiTags('AI Gateway — Guest')
export class AiGatewayGuestController {
  constructor(private readonly aiGatewayGuestService: AiGatewayGuestService) {}

  // ---------------------------------------------------------------------------
  // Quiz creation
  // ---------------------------------------------------------------------------

  @Post('guest/quiz')
  @ApiOperation({ summary: '[AI Gateway] Create a guest quiz (15 questions)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Guest session identifier' },
        ageRange: { type: 'string', enum: ['6-8', '9-12', '13-15', '16-18'] },
      },
      required: ['sessionId', 'ageRange'],
    },
  })
  async createGuestQuiz(@Body() body: { sessionId: string; ageRange: string }) {
    return this.aiGatewayGuestService.createGuestQuiz(
      body.sessionId,
      body.ageRange,
    );
  }

  // ---------------------------------------------------------------------------
  // Quiz submission
  // ---------------------------------------------------------------------------

  @Post('guest/quiz/submit')
  @ApiOperation({
    summary: '[AI Gateway] Submit guest quiz answers',
    description:
      'Returns an AI-generated career profile only. Sign up to unlock educational content and full recommendations.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        quizId: { type: 'string' },
        sessionId: { type: 'string' },
        ageRange: {
          type: 'string',
          enum: ['6-8', '9-12', '13-15', '16-18'],
          description:
            'Include when answers are sent as label strings so they can be resolved to indices',
        },
        answers: {
          type: 'array',
          description:
            'Array of numeric indices (0-4) or { questionIndex, answer } objects',
          items: {
            oneOf: [
              { type: 'number' },
              {
                type: 'object',
                properties: {
                  questionIndex: { type: 'number' },
                  answer: { oneOf: [{ type: 'number' }, { type: 'string' }] },
                },
              },
            ],
          },
        },
      },
      required: ['quizId', 'sessionId', 'answers'],
    },
  })
  async submitGuestQuiz(
    @Body()
    body: {
      quizId: string;
      sessionId: string;
      ageRange?: string;
      answers: any[];
    },
  ) {
    if (!body.quizId) throw new BadRequestException('quizId is required');
    if (!body.sessionId) throw new BadRequestException('sessionId is required');
    if (!Array.isArray(body.answers) || body.answers.length === 0) {
      throw new BadRequestException(
        'answers array is required and must not be empty',
      );
    }

    return this.aiGatewayGuestService.submitGuestQuiz(body);
  }
}
