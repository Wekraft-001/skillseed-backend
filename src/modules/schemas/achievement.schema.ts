import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AchievementDocument = Achievement & Document;

export enum AchievementType {
  COMPLETION = 'completion',
  SKILL_MASTERY = 'skill_mastery',
  CONSISTENCY = 'consistency',
  MILESTONE = 'milestone',
  SPECIAL = 'special'
}

@Schema({ timestamps: true })
export class Achievement {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ 
    type: String, 
    enum: AchievementType, 
    required: true,
    index: true 
  })
  type: AchievementType;

  @Prop({ required: true })
  iconUrl: string;

  @Prop({ required: false })
  badgeUrl?: string;

  @Prop({ required: true })
  pointsAwarded: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  students: Types.ObjectId[];
}

export const AchievementSchema = SchemaFactory.createForClass(Achievement);
