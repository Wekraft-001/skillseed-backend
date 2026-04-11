import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, CareerQuiz, EducationalContent } from 'src/modules/schemas';
import { LoggerService } from 'src/common/logger/logger.service';
import { AiGatewayService } from 'src/modules/ai-gateway/ai-gateway.service';
import { RewardsService } from 'src/modules/rewards/rewards.service';
import { DashboardResponse, UserProfileDto } from 'src/common/interfaces';
import { CareerRecommendationService } from './career-recommendation.service';
import { LearningProgressService } from './learning-progress.service';

@Injectable()
export class StudentDashboardService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(CareerQuiz.name)
    private readonly quizModel: Model<CareerQuiz>,
    @InjectModel(EducationalContent.name)
    private readonly eduContentModel: Model<EducationalContent>,
    private readonly logger: LoggerService,
    private readonly aiService: AiGatewayService,
    private readonly rewardsService: RewardsService,
    private readonly careerRecService: CareerRecommendationService,
    private readonly learningProgressService: LearningProgressService,
  ) {}

  async getDashboardData(
    student: User,
    token: string,
  ): Promise<{
    dashboardResponse: DashboardResponse;
  }> {
    const completeUserData = await this.userModel.findById(student._id).exec();

    // Get quiz status, recommendations, and rewards for this user - use completeUserData
    const [quizStatus, recommendations, badges, stars] = await Promise.all([
      this.getQuizStatusForUser(completeUserData || student),
      this.getRecommendations(completeUserData || student, token),
      this.rewardsService.getBadgesForUser(student._id.toString()),
      this.rewardsService.getStarsForUser(student._id.toString()),
    ]);

    // Calculate summary statistics
    // Count completed quizzes based on actual quiz completion status
    const summary = {
      totalBadges: badges.length,
      completedQuizzes: quizStatus.isCompleted ? 1 : 0,
      totalStars: stars.reduce(
        (total, star) => total + (star.starValue || 0),
        0,
      ),
    };

    return {
      dashboardResponse: {
        success: true,
        message: 'Student dashboard data retrieved successfully',
        timestamp: new Date().toISOString(),
        userId: student._id.toString(),
        quizStatus: {
          hasQuiz: quizStatus.hasQuiz,
          isCompleted: quizStatus.isCompleted,
          needsToTakeQuiz: !quizStatus.hasQuiz || !quizStatus.isCompleted,
        },
        educationalContents: recommendations || [],
        badges: badges || [],
        stars: stars || [],
        summary: summary,
        currentUser: completeUserData || student,
      },
    };
  }

  async getQuizStatusForUser(student: User): Promise<{
    hasQuiz: boolean;
    isCompleted: boolean;
    quiz?: CareerQuiz;
  }> {
    let quiz: CareerQuiz | null = null;

    // Debug: Log student object details
    this.logger.log(`🔍 Checking quiz status for student ${student._id}`);
    this.logger.log(
      `📊 Student object keys: ${Object.keys(student).join(', ')}`,
    );
    this.logger.log(`🎯 initialQuizId: ${(student as any).initialQuizId}`);
    this.logger.log(
      `📋 quizzes array: ${JSON.stringify((student as any).quizzes)}`,
    );

    // First, try to find quiz using initialQuizId if it exists
    if ((student as any).initialQuizId) {
      this.logger.log(
        `🔎 Searching by initialQuizId: ${(student as any).initialQuizId}`,
      );
      quiz = await this.quizModel
        .findById((student as any).initialQuizId)
        .exec();
      this.logger.log(`📋 Quiz found by initialQuizId: ${!!quiz}`);
      if (quiz) {
        this.logger.log(
          `✅ Quiz details: ID=${quiz._id}, completed=${quiz.completed}, user=${quiz.user}`,
        );
      }
    }

    // If no quiz found by initialQuizId, try to find by user ID
    if (!quiz) {
      this.logger.log(`🔎 Searching by user ID: ${student._id}`);
      quiz = await this.quizModel
        .findOne({
          user: student._id,
        })
        .sort({ createdAt: -1 })
        .exec();
      this.logger.log(`📋 Quiz found by user ID: ${!!quiz}`);
      if (quiz) {
        this.logger.log(
          `✅ Quiz details: ID=${quiz._id}, completed=${quiz.completed}, user=${quiz.user}`,
        );
      }
    }

    // If still no quiz, try searching with quizzes array
    if (
      !quiz &&
      (student as any).quizzes &&
      (student as any).quizzes.length > 0
    ) {
      const latestQuizId = (student as any).quizzes[
        (student as any).quizzes.length - 1
      ];
      this.logger.log(
        `🔎 Searching by quizzes array, latest quiz ID: ${latestQuizId}`,
      );
      quiz = await this.quizModel.findById(latestQuizId).exec();
      this.logger.log(`📋 Quiz found by quizzes array: ${!!quiz}`);
      if (quiz) {
        this.logger.log(
          `✅ Quiz details: ID=${quiz._id}, completed=${quiz.completed}, user=${quiz.user}`,
        );
      }
    }

    if (!quiz) {
      this.logger.log(`❌ No career quiz found for student ${student._id}`);

      // Debug: Check all quizzes in database
      const allQuizzes = await this.quizModel.find({}).limit(3).exec();
      this.logger.log(`🗄️ Total quizzes in DB: ${allQuizzes.length}`);
      allQuizzes.forEach((q, index) => {
        this.logger.log(
          `📝 Quiz ${index + 1}: ID=${q._id}, user=${q.user}, completed=${q.completed}`,
        );
      });

      return {
        hasQuiz: false,
        isCompleted: false,
      };
    }

    this.logger.log(
      `✅ Found career quiz ${quiz._id} for student ${student._id}, completed: ${quiz.completed}`,
    );

    return {
      hasQuiz: true,
      isCompleted: quiz.completed,
      quiz: quiz,
    };
  }

  async getAllQuizzesForUser(student: User): Promise<CareerQuiz[]> {
    // Find all quizzes for this user
    const quizzes = await this.quizModel
      .find({
        user: student._id,
      })
      .sort({ createdAt: -1 })
      .exec();

    this.logger.log(
      `Found ${quizzes.length} quizzes for student ${student._id}`,
    );

    return quizzes;
  }

  async getRecommendations(student: User, token: string) {
    const userId = student._id.toString();

    let content = await this.eduContentModel
      .find({
        user: this.userMatcher(userId),
        type: { $ne: 'career_recommendation' },
      })
      .sort({ createdAt: -1 })
      .exec();

    this.logger.log(
      'Found ' +
        content.length +
        ' educational content items for student ' +
        student._id,
    );

    if (!content.length) {
      this.logger.log(
        `No educational content yet for student ${student._id}. ` +
          `Content will be generated after quiz submission.`,
      );
      return [];
    }

    const normalised = content.map((d) => this.normaliseContent(d));

    if (normalised.length === 1) return normalised;

    const best = normalised.reduce((prev, curr) =>
      this.contentScore(curr) > this.contentScore(prev) ? curr : prev,
    );

    this.logger.log(
      `Returning best content doc (score ${this.contentScore(best)}) for student ${userId}`,
    );

    return [best];
  }

  async getCareerRecommendation(student: User) {
    const rec = await this.careerRecService.getRecommendationForUser(
      student._id.toString(),
    );

    if (!rec) {
      throw new NotFoundException(
        'No career recommendation found. Please complete the career assessment quiz first.',
      );
    }

    return rec;
  }

  async getEducationalContent(
    contentId: string,
  ): Promise<EducationalContent | null> {
    return this.eduContentModel.findById(contentId).exec();
  }

  async markContentItemCompleted(
    student: User,
    educationalContentId: string,
    contentType: 'video' | 'book' | 'game',
    contentIndex: number,
    timeSpentSeconds?: number,
  ): Promise<{ content: EducationalContent; progress: any }> {
    const content = await this.eduContentModel
      .findById(educationalContentId)
      .exec();

    if (!content) {
      throw new NotFoundException('Educational content not found');
    }

    const fieldMap: Record<string, string> = {
      video: 'videos',
      book: 'books',
      game: 'games',
    };

    const field = fieldMap[contentType];
    const items: any[] = (content as any)[field] ?? [];

    if (contentIndex < 0 || contentIndex >= items.length) {
      throw new NotFoundException(
        `${contentType} at index ${contentIndex} not found`,
      );
    }

    const contentTitle =
      items[contentIndex]?.title || items[contentIndex]?.name;

    // Mark completed on the content doc
    items[contentIndex] = { ...items[contentIndex], completed: true };
    (content as any)[field] = items;
    content.markModified(field);
    await content.save();

    // Record in progress tracker
    const progress = await this.learningProgressService.recordCompletion({
      userId: student._id.toString(),
      contentId: educationalContentId,
      contentType,
      contentIndex,
      contentTitle,
      timeSpentSeconds,
    });

    this.logger.log(
      `Marked ${contentType}[${contentIndex}] completed for student ${student._id}`,
    );

    return { content, progress };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────
  private userMatcher(userId: string): { $in: any[] } {
    try {
      return { $in: [userId, new Types.ObjectId(userId)] };
    } catch {
      return { $in: [userId] };
    }
  }

  private normaliseContent(doc: any): any {
    const raw = doc.toObject ? doc.toObject() : doc;
    return {
      ...raw,
      // Prefer the schema field name; fall back to the AI service field name
      videoUrl: raw.videoUrl?.length ? raw.videoUrl : (raw.videos ?? []),
      videos: raw.videos?.length ? raw.videos : (raw.videoUrl ?? []),
      books: raw.books ?? [],
      games: raw.games ?? [],
      resources: raw.resources ?? [],
    };
  }

  private contentScore(doc: any): number {
    return (
      (doc.videoUrl?.length || 0) +
      (doc.videos?.length || 0) +
      (doc.books?.length || 0) +
      (doc.games?.length || 0)
    );
  }
}
