import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Types } from 'mongoose';

const TIMEOUT = {
  DEFAULT: 10_000, // 10 s
  AI_PROCESSING: 60_000, // 60 s — OpenAI calls
} as const;

@Injectable()
export class AiGatewayGuestService {
  private readonly logger = new Logger(AiGatewayGuestService.name);
  private readonly aiServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.aiServiceUrl =
      this.configService.get<string>('AI_SERVICE_URL') ||
      'http://localhost:3001';
  }

  // ---------------------------------------------------------------------------
  // Quiz creation
  // ---------------------------------------------------------------------------

  async createGuestQuiz(sessionId: string, ageRange: string) {
    if (!sessionId) throw new BadRequestException('sessionId is required');
    if (!ageRange) throw new BadRequestException('ageRange is required');

    this.logger.log(
      `Creating guest quiz — sessionId=${sessionId}, ageRange=${ageRange}`,
    );

    const response = await firstValueFrom(
      this.httpService.post(
        `${this.aiServiceUrl}/api/ai/guest/quiz`,
        { sessionId, ageRange },
        { timeout: TIMEOUT.DEFAULT },
      ),
    );

    return response.data;
  }

  // ---------------------------------------------------------------------------
  // Quiz submission — normalises answers then forwards; returns profile as-is
  // ---------------------------------------------------------------------------

  async submitGuestQuiz(body: {
    quizId: string;
    sessionId: string;
    ageRange?: string;
    answers: any[];
  }) {
    if (!body.quizId) throw new BadRequestException('quizId is required');
    if (!body.sessionId) throw new BadRequestException('sessionId is required');
    if (!Array.isArray(body.answers) || body.answers.length === 0) {
      throw new BadRequestException(
        'answers array is required and must not be empty',
      );
    }

    const sanitizedQuizId = this.sanitizeQuizId(body.quizId);
    const normalizedAnswers = this.normalizeAnswers(
      body.answers,
      body.ageRange,
    );

    this.logger.log(
      `Submitting guest quiz — quizId=${sanitizedQuizId}, ` +
        `answers=[${normalizedAnswers.join(', ')}]`,
    );

    const response = await firstValueFrom(
      this.httpService.post(
        `${this.aiServiceUrl}/api/ai/guest/quiz/submit`,
        {
          quizId: sanitizedQuizId,
          sessionId: body.sessionId,
          answers: normalizedAnswers,
        },
        { timeout: TIMEOUT.AI_PROCESSING },
      ),
    );

    return response.data;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private sanitizeQuizId(quizId: string): string {
    if (Types.ObjectId.isValid(quizId) && quizId.length === 24) return quizId;
    throw new BadRequestException(
      `Invalid quizId format: "${quizId}". Must be a valid 24-character MongoDB ObjectId.`,
    );
  }

  /**
   * Normalise answers to number[].
   *
   * Accepts three shapes:
   *   1. number[]                              → used as-is
   *   2. { questionIndex, answer: number }     → extracts the number
   *   3. { questionIndex, answer: string }     → resolves label to index via
   *                                              the age-specific scale; falls
   *                                              back to middle value (2) with a warning
   */
  private normalizeAnswers(answers: any[], ageRange?: string): number[] {
    const scaleMap: Record<string, Record<string, number>> = {
      '6-8': {
        '😞 Not at all': 0,
        '😐 A little': 1,
        '🙂 Sometimes': 2,
        '😀 Often': 3,
        '🤩 A lot': 4,
      },
      '9-12': {
        Never: 0,
        Rarely: 1,
        Sometimes: 2,
        Often: 3,
        Always: 4,
      },
      '13-15': {
        'Strongly Disagree': 0,
        Disagree: 1,
        Neutral: 2,
        Agree: 3,
        'Strongly Agree': 4,
      },
      '16-18': {
        'Very Untrue': 0,
        Untrue: 1,
        Neutral: 2,
        True: 3,
        'Very True': 4,
      },
    };

    const labelMap = ageRange ? scaleMap[ageRange] : undefined;

    return answers.map((a, i) => {
      // Shape 1 — plain number
      if (typeof a === 'number') return a;

      if (typeof a === 'object' && a !== null && 'answer' in a) {
        const raw = a.answer;

        // Shape 2 — numeric answer value
        if (typeof raw === 'number') return raw;

        // Try parsing as a number string ("3", "0", etc.)
        const asNum = Number(raw);
        if (!isNaN(asNum)) return asNum;

        // Shape 3 — label string
        if (typeof raw === 'string') {
          if (labelMap && raw in labelMap) return labelMap[raw];

          // Try all scales as a last resort
          for (const scale of Object.values(scaleMap)) {
            if (raw in scale) return scale[raw];
          }

          this.logger.warn(
            `Answer ${i}: unknown label "${raw}" — defaulting to 2 (middle of scale)`,
          );
          return 2;
        }
      }

      this.logger.warn(`Answer ${i}: unrecognised format — defaulting to 0`);
      return 0;
    });
  }
}
