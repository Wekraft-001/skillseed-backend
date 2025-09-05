import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './users/user.schema';

export type StarDocument = Star & Document;

@Schema({ timestamps: true })
export class Star {
  @Prop({ required: true, enum: ['video', 'book', 'game'], index: true })
  contentType: 'video' | 'book' | 'game';

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

  @Prop({ type: Types.ObjectId, ref: 'EducationalContent', required: true, index: true })
  educationalContent: Types.ObjectId;
}

export const StarSchema = SchemaFactory.createForClass(Star);
