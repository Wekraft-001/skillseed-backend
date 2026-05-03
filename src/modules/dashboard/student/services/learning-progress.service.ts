// import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model, Types } from 'mongoose';
// import { LearningProgress, LearningProgressDocument } from '../../../schemas';
// import { LoggerService } from 'src/common/logger/logger.service';

// @Injectable()
// export class LearningProgressService {
//   constructor(
//     @InjectModel(LearningProgress.name)
//     private readonly progressModel: Model<LearningProgressDocument>,
//     private readonly logger: LoggerService,
//   ) {}

//   async recordCompletion(params: {
//     userId: string;
//     contentId: string;
//     contentType: 'video' | 'book' | 'game';
//     contentIndex: number;
//     contentTitle?: string;
//     timeSpentSeconds?: number;
//   }): Promise<{ recorded: boolean; alreadyCompleted: boolean }> {
//     try {
//       await this.progressModel.create({
//         user: new Types.ObjectId(params.userId),
//         contentId: params.contentId,
//         contentType: params.contentType,
//         contentIndex: params.contentIndex,
//         contentTitle: params.contentTitle,
//         timeSpentSeconds: params.timeSpentSeconds ?? 0,
//         completedAt: new Date(),
//       });

//       this.logger.log(
//         `✅ Recorded ${params.contentType} completion for user ${params.userId}`,
//       );
//       return { recorded: true, alreadyCompleted: false };
//     } catch (error) {
//       // Unique index violation = already completed
//       if (error.code === 11000) {
//         this.logger.log(
//           `ℹ️ ${params.contentType} already completed by user ${params.userId}`,
//         );
//         return { recorded: false, alreadyCompleted: true };
//       }
//       this.logger.error(`Failed to record completion: ${error.message}`);
//       throw error;
//     }
//   }

//   async getSummaryForUser(userId: string): Promise<{
//     videos: { completed: number; percentage: number };
//     books: { completed: number; percentage: number };
//     games: { completed: number; percentage: number };
//     totalCompleted: number;
//     longestStreak: number;
//   }> {
//     const records = await this.progressModel
//       .find({ user: new Types.ObjectId(userId) })
//       .sort({ completedAt: 1 })
//       .lean();

//     const byType = (type: string) =>
//       records.filter((r) => r.contentType === type).length;

//     const videosCompleted = byType('video');
//     const booksCompleted = byType('book');
//     const gamesCompleted = byType('game');

//     return {
//       videos: {
//         completed: videosCompleted,
//         percentage: Math.min(videosCompleted * 20, 100), // 5 videos = 100%
//       },
//       books: {
//         completed: booksCompleted,
//         percentage: Math.min(booksCompleted * 33, 100),
//       },
//       games: {
//         completed: gamesCompleted,
//         percentage: Math.min(gamesCompleted * 33, 100),
//       },
//       totalCompleted: records.length,
//       longestStreak: this.calculateStreak(records),
//     };
//   }

//   async getCompletedItemsForUser(userId: string): Promise<{
//     completedVideoIds: string[];
//     completedBookIds: string[];
//     completedGameIds: string[];
//   }> {
//     const records = await this.progressModel
//       .find({ user: new Types.ObjectId(userId) })
//       .lean();

//     const key = (r: any) => `${r.contentId}:${r.contentIndex}`;

//     return {
//       completedVideoIds: records
//         .filter((r) => r.contentType === 'video')
//         .map(key),
//       completedBookIds: records
//         .filter((r) => r.contentType === 'book')
//         .map(key),
//       completedGameIds: records
//         .filter((r) => r.contentType === 'game')
//         .map(key),
//     };
//   }

//   private calculateStreak(records: LearningProgressDocument[] | any[]): number {
//     if (!records.length) return 0;

//     const days = new Set(
//       records.map((r) => new Date(r.completedAt).toISOString().split('T')[0]),
//     );

//     const sorted = Array.from(days).sort();
//     let streak = 1;
//     let max = 1;

//     for (let i = 1; i < sorted.length; i++) {
//       const prev = new Date(sorted[i - 1]);
//       const curr = new Date(sorted[i]);
//       const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
//       streak = diff === 1 ? streak + 1 : 1;
//       max = Math.max(max, streak);
//     }

//     return max;
//   }

//   async getLearningJourney(userId: string) {
//     // For now, return a safe default structure
//     // You can later connect this to real progress tracking logic

//     return {
//       streak: 0,
//       reading: {
//         completed: 0,
//         target: 5,
//         percentage: 0,
//       },
//       videos: {
//         watched: 0,
//         target: 5,
//         percentage: 0,
//       },
//       problemSolving: {
//         completed: 0,
//         target: 5,
//         percentage: 0,
//       },
//     };
//   }

//   async onChallengeCompleted(userId: string) {
//     // Hook for updating streaks, progress, rewards, etc.

//     this.logger.log(`Challenge completed for user ${userId}`);

//     // Example (future logic):
//     // - increment streak
//     // - update progress metrics
//     // - trigger rewards

//     return true;
//   }
// }

// NEW IMPLEMENTATION
// student/services/learning-progress.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LoggerService } from 'src/common/logger/logger.service';
import {
  LearningProgress,
  LearningProgressDocument,
} from 'src/modules/schemas/learning-progress.schema';

export interface RecordCompletionDto {
  userId: string;
  contentId: string;
  contentType: 'video' | 'book';
  contentIndex: number;
  contentTitle?: string;
  timeSpentSeconds?: number;
}

@Injectable()
export class LearningProgressService {
  constructor(
    @InjectModel(LearningProgress.name)
    private readonly progressModel: Model<LearningProgressDocument>,
    private readonly logger: LoggerService,
  ) {}

  async recordCompletion(
    dto: RecordCompletionDto,
  ): Promise<LearningProgressDocument> {
    // Upsert — prevent duplicates if user marks same item twice
    const existing = await this.progressModel.findOne({
      userId: dto.userId,
      contentId: dto.contentId,
      contentType: dto.contentType,
      contentIndex: dto.contentIndex,
    });

    if (existing) {
      existing.timeSpentSeconds =
        (existing.timeSpentSeconds ?? 0) + (dto.timeSpentSeconds ?? 0);
      existing.completedAt = new Date();
      return existing.save();
    }

    const record = new this.progressModel({
      userId: dto.userId,
      contentId: dto.contentId,
      contentType: dto.contentType,
      contentIndex: dto.contentIndex,
      contentTitle: dto.contentTitle ?? 'Untitled',
      timeSpentSeconds: dto.timeSpentSeconds ?? 0,
      completedAt: new Date(),
    });

    await record.save();
    this.logger.log(
      `Progress recorded — user=${dto.userId}, type=${dto.contentType}`,
    );
    return record;
  }

  async getSummaryForUser(userId: string) {
    const records = await this.progressModel.find({ userId }).lean();

    const videos = records.filter((r) => r.contentType === 'video');
    const books = records.filter((r) => r.contentType === 'book');

    const totalTimeSeconds = records.reduce(
      (sum, r) => sum + (r.timeSpentSeconds ?? 0),
      0,
    );

    return {
      userId,
      totalCompleted: records.length,
      videosWatched: videos.length,
      booksRead: books.length,
      totalTimeSpentMins: Math.round(totalTimeSeconds / 60),
      recentActivity: records
        .sort(
          (a, b) =>
            new Date(b.completedAt).getTime() -
            new Date(a.completedAt).getTime(),
        )
        .slice(0, 5)
        .map((r) => ({
          type: r.contentType,
          title: r.contentTitle,
          completedAt: r.completedAt,
          timeSpentMins: Math.round((r.timeSpentSeconds ?? 0) / 60),
        })),
    };
  }

  async getLearningJourney(userId: string) {
    const records = await this.progressModel.find({ userId }).lean();

    const videos = records.filter((r) => r.contentType === 'video').length;
    const books = records.filter((r) => r.contentType === 'book').length;

    // Streak — count consecutive days with at least one completion
    const streak = this.calculateStreak(records);

    return {
      streak,
      longestStreak: streak, // can enhance later with separate tracking
      reading: {
        completed: books,
        target: 20,
        percentage: Math.min(Math.round((books / 20) * 100), 100),
      },
      videos: {
        watched: videos,
        target: 10,
        percentage: Math.min(Math.round((videos / 10) * 100), 100),
      },
      problemSolving: {
        completed: 0, // wire to challenges when ready
        target: 15,
        percentage: 0,
      },
    };
  }

  async getInsightsForParent(childId: string) {
    const records = await this.progressModel.find({ userId: childId }).lean();

    const videos = records.filter((r) => r.contentType === 'video');
    const books = records.filter((r) => r.contentType === 'book');

    const totalTimeSeconds = records.reduce(
      (sum, r) => sum + (r.timeSpentSeconds ?? 0),
      0,
    );
    const streak = this.calculateStreak(records);

    // Group completions by day for a 7-day activity chart
    const last7Days = this.groupByDay(records, 7);

    return {
      childId,
      summary: {
        totalItemsCompleted: records.length,
        videosWatched: videos.length,
        booksRead: books.length,
        totalTimeSpentMins: Math.round(totalTimeSeconds / 60),
        currentStreak: streak,
      },
      weeklyActivity: last7Days, // [{date, count}] — use for bar chart on parent dashboard
      recentActivity: records
        .sort(
          (a, b) =>
            new Date(b.completedAt).getTime() -
            new Date(a.completedAt).getTime(),
        )
        .slice(0, 10)
        .map((r) => ({
          type: r.contentType,
          title: r.contentTitle,
          completedAt: r.completedAt,
          timeSpentMins: Math.round((r.timeSpentSeconds ?? 0) / 60),
        })),
      engagement: {
        mostActiveDay: this.getMostActiveDay(records),
        avgSessionMins: records.length
          ? Math.round(totalTimeSeconds / records.length / 60)
          : 0,
      },
    };
  }

  async onChallengeCompleted(userId: string): Promise<void> {
    const record = new this.progressModel({
      userId,
      contentId: `challenge-${Date.now()}`,
      contentType: 'challenge',
      contentIndex: 0,
      contentTitle: 'Challenge Completed',
      timeSpentSeconds: 0,
      completedAt: new Date(),
    });
    await record.save();
    this.logger.log(`Challenge completion recorded for user=${userId}`);
  }
  // ── Private helpers ──────────────────────────────────────────────────────

  private calculateStreak(records: any[]): number {
    if (!records.length) return 0;

    const days = new Set(
      records.map((r) => new Date(r.completedAt).toISOString().split('T')[0]),
    );

    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      if (days.has(key)) {
        streak++;
      } else if (i > 0) {
        break; // streak broken
      }
    }

    return streak;
  }

  private groupByDay(
    records: any[],
    days: number,
  ): { date: string; count: number }[] {
    const result: { date: string; count: number }[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const count = records.filter(
        (r) => new Date(r.completedAt).toISOString().split('T')[0] === key,
      ).length;
      result.push({ date: key, count });
    }

    return result;
  }

  private getMostActiveDay(records: any[]): string | null {
    if (!records.length) return null;
    const dayCounts: Record<string, number> = {};
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    for (const r of records) {
      const day = dayNames[new Date(r.completedAt).getDay()];
      dayCounts[day] = (dayCounts[day] ?? 0) + 1;
    }

    return (
      Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
    );
  }
}
