import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LoggerService } from 'src/common/logger/logger.service';
import { User, CareerQuiz, EducationalContent } from 'src/modules/schemas';
import {
  CompletedChallenge,
  CompletedChallengeDocument,
} from 'src/modules/schemas';
import { RewardsService } from 'src/modules/rewards/rewards.service';
import { LearningProgressService } from 'src/modules/dashboard/student/services/learning-progress.service';
import { UserRole } from 'src/common/interfaces';
import { CareerRecommendationService } from '../../student/services/career-recommendation.service';

// ── Shaped response types ──────────────────────────────────────────────────

export interface CareerProfileSummary {
  interests: string[];
  skills: string[];
  dreamJob: string | null;
  quizCompleted: boolean;
}

export interface LearningActivitiesSummary {
  totalCompleted: number;
  challengesCompleted: number;
  booksCompleted: number;
  videosWatched: number;
  gamesPlayed: number;
}

export interface BadgeSummary {
  total: number;
  recent: {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    earnedAt: Date;
  }[];
}

export interface ChildOverviewResponse {
  child: {
    id: string;
    firstName: string;
    lastName: string;
    age: number;
    grade: string;
    image: string;
  };
  careerProfile: CareerProfileSummary;
  learningActivities: LearningActivitiesSummary;
  learningJourney: {
    streak: number;
    reading: { completed: number; target: number; percentage: number };
    videos: { watched: number; target: number; percentage: number };
    problemSolving: { completed: number; target: number; percentage: number };
  } | null;
  badges: BadgeSummary;
  insights: string | null;
  lastActive: string | null;
}

// ──────────────────────────────────────────────────────────────────────────

@Injectable()
export class ParentChildOverviewService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(CareerQuiz.name)
    private readonly quizModel: Model<CareerQuiz>,
    @InjectModel(EducationalContent.name)
    private readonly eduContentModel: Model<EducationalContent>,
    @InjectModel(CompletedChallenge.name)
    private readonly completedChallengeModel: Model<CompletedChallengeDocument>,
    private readonly rewardsService: RewardsService,
    private readonly learningProgressService: LearningProgressService,
    private readonly careerRecService: CareerRecommendationService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('ParentChildOverviewService');
  }

  async getChildOverview(
    parentId: string,
    childId: string,
  ): Promise<ChildOverviewResponse> {
    // ── Step 1: fetch by _id + role ONLY
    const child = await this.userModel
      .findOne({
        _id: new Types.ObjectId(childId),
        role: UserRole.STUDENT,
      })
      .lean()
      .exec();

    if (!child) {
      this.logger.warn(`getChildOverview: no student found with id ${childId}`);
      throw new NotFoundException('Child not found');
    }

    // ── Step 2: ownership check in application code
    const parentIdStr = parentId.toString();
    const childParentStr = (child as any).parent?.toString() ?? '';
    const childCreatedByStr = (child as any).createdBy?.toString() ?? '';

    this.logger.log(
      `Ownership check — ` +
        `requestingParent=${parentIdStr} | ` +
        `child.parent="${childParentStr}" | ` +
        `child.createdBy="${childCreatedByStr}"`,
    );

    const belongsToParent =
      childParentStr === parentIdStr || childCreatedByStr === parentIdStr;

    if (!belongsToParent) {
      this.logger.warn(
        `Access denied: parent ${parentIdStr} does not own child ${childId}`,
      );
      throw new NotFoundException(
        'Child not found or does not belong to this parent',
      );
    }

    // ── Step 3: fetch all child data in parallel ──────────────────────────
    const [
      // quiz,
      careerProfile,
      eduContents,
      completedChallenges,
      badges,
      learningJourney,
      insights,
    ] = await Promise.all([
      this.careerRecService
        .getCareerProfileSummary(childId)
        .then((rec) => {
          if (rec && rec.quizCompleted) return rec;
          return this.buildCareerProfileFromEduContent(childId);
        })
        .catch(() => this.buildCareerProfileFromEduContent(childId)),
      this.eduContentModel
        .find({ user: this.userMatcher(childId) })
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
      this.completedChallengeModel.find({ userId: childId }).lean().exec(),
      this.rewardsService.getBadgesForUser(childId),
      this.learningProgressService
        .getLearningJourney(childId)
        .catch(() => null),
      this.learningProgressService
        .getInsightsForParent(childId)
        .catch(() => null),
    ]);

    // ── Step 4: shape sections ────────────────────────────────────────────
    // const careerProfile = this.buildCareerProfile(careerSummary);
    const learningActivities = this.buildLearningActivities(
      completedChallenges,
      eduContents,
    );
    const badgeSummary = this.buildBadgeSummary(badges);

    return {
      child: {
        id: child._id.toString(),
        firstName: (child as any).firstName,
        lastName: (child as any).lastName,
        age: (child as any).age,
        grade: (child as any).grade,
        image: (child as any).image || '',
      },
      careerProfile,
      learningActivities,
      learningJourney,
      insights,
      badges: badgeSummary,
      lastActive:
        learningJourney && learningJourney.streak > 0
          ? new Date().toISOString()
          : null,
    };
  }

  async getAllChildrenOverview(
    parentId: string,
  ): Promise<ChildOverviewResponse[]> {
    const children = await this.userModel
      .find({
        role: UserRole.STUDENT,
        $or: [
          { parent: new Types.ObjectId(parentId) },
          { createdBy: new Types.ObjectId(parentId) },
        ],
      })
      .lean()
      .exec();

    this.logger.log(
      `getAllChildrenOverview: found ${children.length} children for parent ${parentId}`,
    );

    if (!children.length) return [];

    return Promise.all(
      children.map((child) =>
        this.getChildOverview(parentId, child._id.toString()),
      ),
    );
  }

  // ── Section builders ────────────────────────────────────────────────────

  private userMatcher(userId: string) {
    try {
      return { $in: [userId, new Types.ObjectId(userId)] } as any;
    } catch {
      return { $in: [userId] } as any;
    }
  }

  private buildLearningActivities(
    completedChallenges: any[],
    eduContents: any[],
  ): LearningActivitiesSummary {
    let booksCompleted = 0;
    let videosWatched = 0;
    let gamesPlayed = 0;

    for (const content of eduContents) {
      booksCompleted += (content.books ?? []).filter(
        (b: any) => b?.completed,
      ).length;
      videosWatched += (content.videoUrl ?? []).filter(
        (v: any) => v?.completed,
      ).length;
      gamesPlayed += (content.games ?? []).filter(
        (g: any) => g?.completed,
      ).length;
    }

    const challengesCompleted = completedChallenges.length;
    return {
      totalCompleted:
        challengesCompleted + booksCompleted + videosWatched + gamesPlayed,
      challengesCompleted,
      booksCompleted,
      videosWatched,
      gamesPlayed,
    };
  }

  private buildBadgeSummary(badges: any[]): BadgeSummary {
    const recent = [...badges]
      .sort(
        (a, b) =>
          new Date(b.earnedAt ?? b.createdAt).getTime() -
          new Date(a.earnedAt ?? a.createdAt).getTime(),
      )
      .slice(0, 5)
      .map((b) => ({
        id: b._id?.toString() ?? '',
        name: b.name ?? b.title ?? 'Badge',
        description: b.description,
        imageUrl: b.imageUrl ?? b.image,
        earnedAt: b.earnedAt ?? b.createdAt,
      }));

    return { total: badges.length, recent };
  }

  private async buildCareerProfileFromEduContent(
    childId: string,
  ): Promise<CareerProfileSummary> {
    const latestContent = await this.eduContentModel
      .findOne({ user: this.userMatcher(childId) })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    if (!latestContent) {
      return {
        interests: [],
        skills: [],
        dreamJob: null,
        quizCompleted: false,
      };
    }

    const analysis = (latestContent as any).analysis ?? {};
    const careerRec = (latestContent as any).careerRecommendation ?? {};

    const interests: string[] =
      analysis.topCareerAreas ??
      (careerRec.careers as any[])?.map((c: any) => c.career ?? c) ??
      [];

    const skills: string[] =
      analysis.aiAnalysis?.skills ??
      (careerRec.traits as any[])?.map((t: any) => t.trait ?? t) ??
      [];

    const dreamJob: string | null =
      analysis.topCareerAreas?.[0] ??
      (careerRec.careers as any[])?.[0]?.career ??
      null;

    return {
      interests,
      skills,
      dreamJob,
      quizCompleted: !!(analysis.topCareerAreas?.length || dreamJob),
    };
  }
}
