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

  /**
   * Validate a quizId string.
   * Returns the id unchanged when valid, or null when it is absent / malformed.
   * We never pad or mutate an invalid id — callers treat null as "use latest quiz".
   */
  private sanitizeQuizId(quizId: string | undefined | null): string | null {
    if (!quizId) return null;

    // A valid MongoDB ObjectId is exactly 24 hex characters
    if (Types.ObjectId.isValid(quizId) && quizId.length === 24) {
      return quizId;
    }

    this.logger.warn(
      `Malformed quizId received: "${quizId}" — will use latest quiz for this user instead`,
    );
    return null;
  }

  /**
   * Build a standard Authorization header object.
   */
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

      // Treat an empty question list the same as a service failure
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
      quizId: sanitizedQuizId, // null tells the AI service to resolve latest
      answers: this.processAnswers(quizData.answers),
    };

    this.logger.debug(`Processed payload: ${JSON.stringify(payload)}`);

    // Locally-generated quizzes cannot be submitted to the AI service because
    // they were never persisted. Tell the client to retake the quiz properly.
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

    // Let HTTP errors propagate — the global exception filter will handle them
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
    this.logger.log(`Submitting guest quiz — raw quizId: ${quizData.quizId}`);

    // Locally-generated guest quizzes were never persisted
    if (this.isLocalQuizId(quizData.quizId)) {
      throw new BadRequestException(
        'This quiz was created offline and cannot be submitted. Please start a new quiz.',
      );
    }

    const sanitizedQuizId = this.sanitizeQuizId(quizData.quizId);
    const payload = {
      ...quizData,
      quizId: sanitizedQuizId,
      answers: this.processAnswers(quizData.answers),
    };

    const response = await firstValueFrom(
      this.httpService.post(
        `${this.aiServiceUrl}/api/ai/guest/quiz/submit`,
        payload,
        { timeout: TIMEOUT.AI_PROCESSING },
      ),
    );

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
    let aiMicroserviceStatus: any;
    let overallStatus = 'healthy';

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.aiServiceUrl}/api/ai/health`, {
          timeout: TIMEOUT.HEALTH,
        }),
      );
      aiMicroserviceStatus = response.data;
    } catch (error) {
      this.logger.error(
        `AI microservice health check failed: ${error.message}`,
      );
      aiMicroserviceStatus = { status: 'unavailable', error: error.message };
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
      aiMicroservice: aiMicroserviceStatus,
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Returns true for IDs that were generated locally (never persisted to DB).
   */
  private isLocalQuizId(quizId: string | undefined | null): boolean {
    return !!(
      quizId &&
      (quizId.startsWith('local_') || quizId.startsWith('guest_local_'))
    );
  }

  /**
   * Normalise answers to a plain number[].
   * Accepts both number[] and AnswerDto[] ({ questionIndex, answer }).
   */
  private processAnswers(answers: any[]): number[] {
    if (!Array.isArray(answers)) return [];

    try {
      return this.quizDataService.processAnswers(answers);
    } catch (error) {
      this.logger.warn(
        `QuizDataService.processAnswers failed, using manual normalisation: ${error.message}`,
      );

      return answers.map((a) => {
        if (typeof a === 'number') return a;
        if (typeof a === 'object' && a !== null && 'answer' in a) {
          const v = Number(a.answer);
          return isNaN(v) ? 0 : v;
        }
        return 0;
      });
    }
  }

  /**
   * Build a local quiz response when the AI microservice is unavailable.
   * The quiz ID is prefixed with "local_" so we can detect it on submission
   * and reject it clearly rather than attempting to look it up in the DB.
   */
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
