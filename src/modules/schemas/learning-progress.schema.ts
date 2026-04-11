import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LearningProgressDocument = LearningProgress & Document;

@Schema({ timestamps: true })
export class LearningProgress {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: String, enum: ['video', 'book', 'game'], required: true })
  contentType: 'video' | 'book' | 'game';

  @Prop({ type: String, required: true })
  contentId: string;

  @Prop({ type: Number, required: true })
  contentIndex: number;

  @Prop({ type: String, required: false })
  contentTitle?: string;

  @Prop({ type: Date, default: Date.now })
  completedAt: Date;

  @Prop({ type: Number, default: 0 })
  timeSpentSeconds: number;
}

export const LearningProgressSchema =
  SchemaFactory.createForClass(LearningProgress);
