import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './users/user.schema';

export type StarDocument = Star & Document;

@Schema({ timestamps: true })
export class Star {
  @Prop({ required: true, enum: ['video', 'book', 'game', 'quiz', 'project', 'community', 'mentor_session', 'mentor_review'], index: true })
  contentType: 'video' | 'book' | 'game' | 'quiz' | 'project' | 'community' | 'mentor_session' | 'mentor_review';

  @Prop({ required: true, index: true })
  contentId: string;

  @Prop({ required: true, index: true })
  title: string;

  @Prop({ default: false, index: true })
  completed: boolean;

  @Prop({ type: Date, default: null })
  completedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId | User;

  @Prop({ type: Types.ObjectId, ref: 'EducationalContent', required: false, index: true })
  educationalContent: Types.ObjectId;
  
  @Prop({ type: Number, default: 1 })
  starValue: number;
}

export const StarSchema = SchemaFactory.createForClass(Star);
