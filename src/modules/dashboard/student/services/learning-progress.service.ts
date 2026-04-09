import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LearningProgress, LearningProgressDocument } from '../../../schemas';
import { LoggerService } from 'src/common/logger/logger.service';

export type ContentType = 'book' | 'video' | 'challenge';

export interface LearningJourneyResponse {
  streak: number;
  longestStreak: number;
  reading: {
    completed: number;
    target: number;
    percentage: number;
  };
  videos: {
    watched: number;
    target: number;
    percentage: number;
  };
  problemSolving: {
    completed: number;
    target: number;
    percentage: number;
  };
}

@Injectable()
export class LearningProgressService {
  constructor(
    @InjectModel(LearningProgress.name)
    private readonly progressModel: Model<LearningProgressDocument>,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('LearningProgressService');
  }

  // ─────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────

  /** Returns (or lazily creates) the learning journey summary for a student. */
  async getLearningJourney(userId: string): Promise<LearningJourneyResponse> {
    const progress = await this.getOrCreate(userId);
    return this.toResponse(progress);
  }

  /**
   * Call this whenever a student completes a piece of content.
   * It increments the correct counter, updates the streak, and persists.
   *
   * @param userId   - student's MongoDB ObjectId string
   * @param type     - 'book' | 'video' | 'challenge'
   * @param delta    - how many units to add (default 1)
   */
  async recordCompletion(
    userId: string,
    type: ContentType,
    delta = 1,
  ): Promise<LearningJourneyResponse> {
    try {
      const progress = await this.getOrCreate(userId);

      switch (type) {
        case 'book':
          progress.booksCompleted = Math.max(
            0,
            progress.booksCompleted + delta,
          );
          break;
        case 'video':
          progress.videosWatched = Math.max(0, progress.videosWatched + delta);
          break;
        case 'challenge':
          progress.challengesCompleted = Math.max(
            0,
            progress.challengesCompleted + delta,
          );
          break;
      }

      this.updateStreak(progress);
      await progress.save();

      this.logger.log(
        `Recorded ${type} completion for user ${userId}. Streak: ${progress.currentStreak}`,
      );

      return this.toResponse(progress);
    } catch (error) {
      this.logger.error(
        `Error recording ${type} completion: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Convenience wrapper used by the challenge completion flow.
   * Mirrors the call site in CompletedChallengesService.
   */
  async onChallengeCompleted(userId: string): Promise<void> {
    await this.recordCompletion(userId, 'challenge');
  }

  /**
   * Convenience wrapper used by the educational-content completion flow.
   * Pass the raw contentType from the request body ('video' | 'book' | 'game').
   * Games count toward problem-solving just like challenges.
   */
  async onEducationalContentCompleted(
    userId: string,
    contentType: 'video' | 'book' | 'game',
  ): Promise<void> {
    const mapped: ContentType =
      contentType === 'video'
        ? 'video'
        : contentType === 'book'
          ? 'book'
          : 'challenge'; // games → problem solving

    await this.recordCompletion(userId, mapped);
  }

  // ─────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────

  private async getOrCreate(userId: string): Promise<LearningProgressDocument> {
    const existing = await this.progressModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();

    if (existing) return existing;

    // First visit — seed from existing completed data would happen in a
    // migration script; here we just start from zero.
    const created = new this.progressModel({
      userId: new Types.ObjectId(userId),
    });
    await created.save();
    return created;
  }

  /**
   * Updates currentStreak and longestStreak on a progress document.
   * - Same calendar day  → streak unchanged (idempotent).
   * - Consecutive day    → streak + 1.
   * - Gap of > 1 day     → streak resets to 1.
   */
  private updateStreak(progress: LearningProgressDocument): void {
    const todayStr = this.todayUTC();

    if (progress.lastActiveDate === todayStr) {
      // Already active today — nothing to update
      return;
    }

    const yesterday = this.offsetDateUTC(-1);

    if (progress.lastActiveDate === yesterday) {
      progress.currentStreak += 1;
    } else {
      // Missed at least one day
      progress.currentStreak = 1;
    }

    if (progress.currentStreak > progress.longestStreak) {
      progress.longestStreak = progress.currentStreak;
    }

    progress.lastActiveDate = todayStr;
  }

  private toResponse(p: LearningProgressDocument): LearningJourneyResponse {
    const pct = (done: number, target: number) =>
      target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;

    return {
      streak: p.currentStreak,
      longestStreak: p.longestStreak,
      reading: {
        completed: p.booksCompleted,
        target: p.booksTarget,
        percentage: pct(p.booksCompleted, p.booksTarget),
      },
      videos: {
        watched: p.videosWatched,
        target: p.videosTarget,
        percentage: pct(p.videosWatched, p.videosTarget),
      },
      problemSolving: {
        completed: p.challengesCompleted,
        target: p.challengesTarget,
        percentage: pct(p.challengesCompleted, p.challengesTarget),
      },
    };
  }

  /** Returns today's date in YYYY-MM-DD (UTC). */
  private todayUTC(): string {
    return new Date().toISOString().slice(0, 10);
  }

  /** Returns a date offset by `days` from today (UTC). */
  private offsetDateUTC(days: number): string {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }
}
