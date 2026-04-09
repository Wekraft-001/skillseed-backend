import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LearningProgressDocument = LearningProgress & Document;

@Schema({ timestamps: true })
export class LearningProgress {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  // ── Reading ──────────────────────────────────────────────
  @Prop({ default: 0 })
  booksCompleted: number;

  /** Target used to compute the reading percentage shown in the UI */
  @Prop({ default: 20 })
  booksTarget: number;

  // ── Videos ───────────────────────────────────────────────
  @Prop({ default: 0 })
  videosWatched: number;

  @Prop({ default: 10 })
  videosTarget: number;

  // ── Problem Solving (challenges / projects) ───────────────
  @Prop({ default: 0 })
  challengesCompleted: number;

  @Prop({ default: 15 })
  challengesTarget: number;

  // ── Streak ───────────────────────────────────────────────
  @Prop({ default: 0 })
  currentStreak: number;

  @Prop({ default: 0 })
  longestStreak: number;

  /** UTC date string (YYYY-MM-DD) of the last day the student was active */
  @Prop({ default: null })
  lastActiveDate: string | null;
}

export const LearningProgressSchema =
  SchemaFactory.createForClass(LearningProgress);
