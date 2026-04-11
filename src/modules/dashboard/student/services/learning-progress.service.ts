import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LearningProgress, LearningProgressDocument } from '../../../schemas';
import { LoggerService } from 'src/common/logger/logger.service';

@Injectable()
export class LearningProgressService {
  constructor(
    @InjectModel(LearningProgress.name)
    private readonly progressModel: Model<LearningProgressDocument>,
    private readonly logger: LoggerService,
  ) {}

  async recordCompletion(params: {
    userId: string;
    contentId: string;
    contentType: 'video' | 'book' | 'game';
    contentIndex: number;
    contentTitle?: string;
    timeSpentSeconds?: number;
  }): Promise<{ recorded: boolean; alreadyCompleted: boolean }> {
    try {
      await this.progressModel.create({
        user: new Types.ObjectId(params.userId),
        contentId: params.contentId,
        contentType: params.contentType,
        contentIndex: params.contentIndex,
        contentTitle: params.contentTitle,
        timeSpentSeconds: params.timeSpentSeconds ?? 0,
        completedAt: new Date(),
      });

      this.logger.log(
        `✅ Recorded ${params.contentType} completion for user ${params.userId}`,
      );
      return { recorded: true, alreadyCompleted: false };
    } catch (error) {
      // Unique index violation = already completed
      if (error.code === 11000) {
        this.logger.log(
          `ℹ️ ${params.contentType} already completed by user ${params.userId}`,
        );
        return { recorded: false, alreadyCompleted: true };
      }
      this.logger.error(`Failed to record completion: ${error.message}`);
      throw error;
    }
  }

  async getSummaryForUser(userId: string): Promise<{
    videos: { completed: number; percentage: number };
    books: { completed: number; percentage: number };
    games: { completed: number; percentage: number };
    totalCompleted: number;
    longestStreak: number;
  }> {
    const records = await this.progressModel
      .find({ user: new Types.ObjectId(userId) })
      .sort({ completedAt: 1 })
      .lean();

    const byType = (type: string) =>
      records.filter((r) => r.contentType === type).length;

    const videosCompleted = byType('video');
    const booksCompleted = byType('book');
    const gamesCompleted = byType('game');

    return {
      videos: {
        completed: videosCompleted,
        percentage: Math.min(videosCompleted * 20, 100), // 5 videos = 100%
      },
      books: {
        completed: booksCompleted,
        percentage: Math.min(booksCompleted * 33, 100),
      },
      games: {
        completed: gamesCompleted,
        percentage: Math.min(gamesCompleted * 33, 100),
      },
      totalCompleted: records.length,
      longestStreak: this.calculateStreak(records),
    };
  }

  async getCompletedItemsForUser(userId: string): Promise<{
    completedVideoIds: string[];
    completedBookIds: string[];
    completedGameIds: string[];
  }> {
    const records = await this.progressModel
      .find({ user: new Types.ObjectId(userId) })
      .lean();

    const key = (r: any) => `${r.contentId}:${r.contentIndex}`;

    return {
      completedVideoIds: records
        .filter((r) => r.contentType === 'video')
        .map(key),
      completedBookIds: records
        .filter((r) => r.contentType === 'book')
        .map(key),
      completedGameIds: records
        .filter((r) => r.contentType === 'game')
        .map(key),
    };
  }

  private calculateStreak(records: LearningProgressDocument[] | any[]): number {
    if (!records.length) return 0;

    const days = new Set(
      records.map((r) => new Date(r.completedAt).toISOString().split('T')[0]),
    );

    const sorted = Array.from(days).sort();
    let streak = 1;
    let max = 1;

    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      streak = diff === 1 ? streak + 1 : 1;
      max = Math.max(max, streak);
    }

    return max;
  }
}
