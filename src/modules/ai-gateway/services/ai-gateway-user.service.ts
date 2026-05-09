import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Types } from 'mongoose';
import { QuizDataService } from './quiz-data.service';

// How long to wait for the AI microservice on each request type
const TIMEOUT = {
  DEFAULT: 10_000, // 10 s — fast reads
  AI_PROCESSING: 60_000, // 60 s — anything that calls OpenAI
  HEALTH: 5_000, // 5 s — health probes only
} as const;

// ---------------------------------------------------------------------------
// Label → index maps for every age group.
// These mirror AGE_SCALE_LABELS in ai-base.service.ts so the gateway can
// convert human-readable answer labels back to numeric indices before
// forwarding to the microservice.
// ---------------------------------------------------------------------------
const SCALE_LABEL_TO_INDEX: Record<string, Record<string, number>> = {
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

@Injectable()
export class AiGatewayService {
  private readonly logger = new Logger(AiGatewayService.name);
  private readonly aiServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly quizDataService: QuizDataService,
  ) {
    this.aiServiceUrl =
      this.configService.get<string>('AI_SERVICE_URL') ||
      'http://localhost:3001';
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private sanitizeQuizId(quizId: string | undefined | null): string | null {
    if (!quizId) return null;
    if (Types.ObjectId.isValid(quizId) && quizId.length === 24) return quizId;
    this.logger.warn(
      `Malformed quizId received: "${quizId}" — will use latest quiz for this user instead`,
    );
    return null;
  }

  private authHeader(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  // ---------------------------------------------------------------------------
  // Quiz — authenticated
  // ---------------------------------------------------------------------------

  async createQuiz(userId: string, ageRange: string, token: string) {
    this.logger.log(`Creating quiz for user ${userId}, ageRange=${ageRange}`);

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/api/ai/quiz`,
          { userId, ageRange },
          { headers: this.authHeader(token), timeout: TIMEOUT.DEFAULT },
        ),
      );

      if (!response?.data?.quiz?.questions?.length) {
        this.logger.warn(
          'AI service returned a quiz with no questions — using local fallback',
        );
        return this.buildLocalQuiz(userId, ageRange);
      }

      return response.data;
    } catch (error) {
      this.logger.warn(
        `AI service unavailable, falling back to local quiz: ${error.message}`,
      );
      return this.buildLocalQuiz(userId, ageRange);
    }
  }

  async submitQuiz(quizData: any, token: string) {
    this.logger.log(`Submitting quiz — raw quizId: ${quizData.quizId}`);

    const sanitizedQuizId = this.sanitizeQuizId(quizData.quizId);
    const payload = {
      ...quizData,
      quizId: sanitizedQuizId,
      answers: this.processAnswers(quizData.answers),
    };

    if (this.isLocalQuizId(quizData.quizId)) {
      throw new BadRequestException(
        'This quiz was created offline and cannot be submitted. Please start a new quiz.',
      );
    }

    const response = await firstValueFrom(
      this.httpService.post(
        `${this.aiServiceUrl}/api/ai/quiz/submit`,
        payload,
        { headers: this.authHeader(token), timeout: TIMEOUT.AI_PROCESSING },
      ),
    );

    return response.data;
  }

  // ---------------------------------------------------------------------------
  // Recommendations — authenticated
  // ---------------------------------------------------------------------------

  async getRecommendations(userId: string, token: string) {
    this.logger.log(`Getting recommendations for user ${userId}`);

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/api/ai/recommendations`,
          { userId },
          { headers: this.authHeader(token), timeout: TIMEOUT.AI_PROCESSING },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get recommendations: ${error.message}`);
      throw new NotFoundException('No recommendations found');
    }
  }

  async getCareerRecommendations(
    userId: string,
    token: string,
    quizId?: string,
  ) {
    this.logger.log(
      `Getting career recommendations for user ${userId}, quizId=${quizId}`,
    );

    try {
      const params = new URLSearchParams({ userId });
      if (quizId) params.append('quizId', quizId);

      const response = await firstValueFrom(
        this.httpService.get(
          `${this.aiServiceUrl}/api/ai/career-recommendations?${params.toString()}`,
          { headers: this.authHeader(token), timeout: TIMEOUT.AI_PROCESSING },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to get career recommendations: ${error.message}`,
      );
      throw new NotFoundException('No career recommendations found');
    }
  }

  // ---------------------------------------------------------------------------
  // Quiz analysis & content
  // ---------------------------------------------------------------------------

  async getQuizAnalysis(userId: string, quizId: string, token: string) {
    this.logger.log(
      `Getting quiz analysis — userId=${userId}, quizId=${quizId}`,
    );

    const sanitizedQuizId = this.sanitizeQuizId(quizId);

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/api/ai/quiz-analysis`,
          { userId, quizId: sanitizedQuizId },
          { headers: this.authHeader(token), timeout: TIMEOUT.DEFAULT },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get quiz analysis: ${error.message}`);
      throw new NotFoundException('Quiz analysis not found');
    }
  }

  async getLatestContent(userId: string, token: string) {
    this.logger.log(`Getting latest content for user ${userId}`);

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/api/ai/content/latest`,
          { userId },
          { headers: this.authHeader(token), timeout: TIMEOUT.DEFAULT },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get latest content: ${error.message}`);
      throw new NotFoundException('No content found');
    }
  }

  // ---------------------------------------------------------------------------
  // Guest flows
  // ---------------------------------------------------------------------------

  async createGuestQuiz(sessionId: string, ageRange: string) {
    this.logger.log(
      `Creating guest quiz for session ${sessionId}, ageRange=${ageRange}`,
    );

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/api/ai/guest/quiz`,
          { sessionId, ageRange },
          { timeout: TIMEOUT.DEFAULT },
        ),
      );

      if (!response?.data?.quiz?.questions?.length) {
        this.logger.warn(
          'AI service returned a guest quiz with no questions — using local fallback',
        );
        return this.buildLocalGuestQuiz(sessionId, ageRange);
      }

      return response.data;
    } catch (error) {
      this.logger.warn(
        `AI service unavailable for guest quiz, using local fallback: ${error.message}`,
      );
      return this.buildLocalGuestQuiz(sessionId, ageRange);
    }
  }

  async submitGuestQuiz(quizData: any) {
    this.logger.log(`Submitting guest quiz — quizId: ${quizData.quizId}`);

    if (!quizData.quizId) throw new BadRequestException('quizId is required');
    if (!quizData.sessionId)
      throw new BadRequestException('sessionId is required');
    if (!Array.isArray(quizData.answers) || quizData.answers.length === 0) {
      throw new BadRequestException(
        'answers array is required and must not be empty',
      );
    }

    const sanitizedQuizId = this.sanitizeQuizId(quizData.quizId);
    const normalizedAnswers = this.processAnswers(
      quizData.answers,
      quizData.ageRange,
    );

    this.logger.debug(
      `Guest submit — quizId: ${sanitizedQuizId}, answers: [${normalizedAnswers.join(', ')}]`,
    );

    const response = await firstValueFrom(
      this.httpService.post(
        `${this.aiServiceUrl}/api/ai/guest/quiz/submit`,
        {
          quizId: sanitizedQuizId,
          sessionId: quizData.sessionId,
          answers: normalizedAnswers,
        },
        { timeout: TIMEOUT.AI_PROCESSING },
      ),
    );

    // The microservice already returns a clean profile-only response —
    // pass it straight through without modification
    return response.data;
  }

  async getGuestRecommendations(sessionId: string, analysisData: any) {
    this.logger.log(`Getting guest recommendations for session ${sessionId}`);

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/api/ai/guest/recommendations`,
          { sessionId, ...analysisData },
          { timeout: TIMEOUT.AI_PROCESSING },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to get guest recommendations: ${error.message}`,
      );
      throw new BadRequestException('Failed to get guest recommendations');
    }
  }

  // ---------------------------------------------------------------------------
  // Health check
  // ---------------------------------------------------------------------------

  async healthCheck() {
    const timestamp = new Date().toISOString();
    let aiStatus: any;
    let overallStatus = 'healthy';

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.aiServiceUrl}/api/ai/health`, {
          timeout: TIMEOUT.HEALTH,
        }),
      );
      aiStatus = response.data;
    } catch (error) {
      this.logger.error(
        `AI microservice health check failed: ${error.message}`,
      );
      aiStatus = { status: 'unavailable', error: error.message };
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      timestamp,
      aiGateway: {
        status: 'healthy',
        version: '1.0.0',
        environment: {
          nodeEnv: process.env.NODE_ENV || 'development',
          aiServiceUrl: this.aiServiceUrl,
        },
      },
      aiMicroservice: aiStatus,
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private isLocalQuizId(quizId: string | undefined | null): boolean {
    return !!(
      quizId &&
      (quizId.startsWith('local_') || quizId.startsWith('guest_local_'))
    );
  }

  /**
   * Normalise answers to a plain number[].
   *
   * Handles all three shapes the frontend might send:
   *   1. number[]                          → [3, 2, 4, ...]
   *   2. { questionIndex, answer: number } → extract answer as number
   *   3. { questionIndex, answer: string } → resolve label → index using ageRange scale,
   *                                          or fall back to middle value (2) if unknown
   */
  private processAnswers(answers: any[], ageRange?: string): number[] {
    if (!Array.isArray(answers)) return [];

    // Try the QuizDataService normaliser first (handles simple cases fast)
    try {
      const simple = this.quizDataService.processAnswers(answers);
      // If every value came back as 0 but inputs weren't all 0, the labels
      // weren't understood — fall through to the label resolver below.
      const allZero = simple.every((v) => v === 0);
      const inputAllZero = answers.every((a) =>
        typeof a === 'number' ? a === 0 : Number(a?.answer) === 0,
      );
      if (!allZero || inputAllZero) return simple;
    } catch {
      // fall through
    }

    // Full normaliser: handles label strings with optional ageRange lookup
    const labelMap = ageRange ? SCALE_LABEL_TO_INDEX[ageRange] : undefined;

    return answers.map((a) => {
      // Plain number
      if (typeof a === 'number') return a;

      if (typeof a === 'object' && a !== null && 'answer' in a) {
        const raw = a.answer;

        // Numeric answer value
        if (typeof raw === 'number') return raw;

        // String — try to parse as number first
        const asNum = Number(raw);
        if (!isNaN(asNum)) return asNum;

        // String label — look it up in the age-specific map
        if (typeof raw === 'string') {
          if (labelMap && raw in labelMap) return labelMap[raw];

          // Try all scales as a last resort
          for (const scale of Object.values(SCALE_LABEL_TO_INDEX)) {
            if (raw in scale) return scale[raw];
          }

          this.logger.warn(
            `Unknown answer label "${raw}" — defaulting to 2 (middle)`,
          );
          return 2; // safe middle-of-scale fallback
        }
      }

      return 0;
    });
  }

  private buildLocalQuiz(userId: string, ageRange: string) {
    const quizData = this.quizDataService.loadQuizData(ageRange);
    return {
      success: true,
      offline: true,
      message:
        'Quiz loaded from local data. Note: submission requires the AI service to be available.',
      quiz: {
        _id: `local_${Date.now()}_${userId}`,
        userId,
        ageRange,
        questions: quizData.questions,
        createdAt: new Date().toISOString(),
        submitted: false,
      },
    };
  }

  private buildLocalGuestQuiz(sessionId: string, ageRange: string) {
    const quizData = this.quizDataService.loadQuizData(ageRange);
    return {
      success: true,
      offline: true,
      message:
        'Quiz loaded from local data. Note: submission requires the AI service to be available.',
      quiz: {
        _id: `guest_local_${Date.now()}_${sessionId}`,
        sessionId,
        ageRange,
        questions: quizData.questions,
        createdAt: new Date().toISOString(),
        submitted: false,
      },
    };
  }
}
