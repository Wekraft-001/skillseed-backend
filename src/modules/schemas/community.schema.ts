import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommunityDocument = Community & Document;

// This enum will be deprecated in favor of dynamic challenge categories
export enum CommunityCategory {
  ARTS_CRAFTS = 'arts_crafts',
  SCIENCE = 'science',
  TECH_CODING = 'tech_coding',
  MUSIC_DANCE = 'music_dance',
  READING = 'reading',
  GAMES = 'games',
  OTHER = 'other'
}

export enum AgeGroup {
  AGE_5_TO_8 = '5-8',
  AGE_9_TO_12 = '9-12',
  AGE_13_TO_16 = '13-16',
  AGE_17_PLUS = '17+'
}

@Schema({ timestamps: true })
export class Community {
  @Prop({ required: true, index: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ 
    type: String, 
    enum: CommunityCategory, 
    required: false,
    index: true 
  })
  category?: CommunityCategory;

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'ChallengeCategory',
    required: true,
    index: true 
  })
  challengeCategory: Types.ObjectId;

  @Prop({
    type: String,
    enum: AgeGroup,
    required: true,
    index: true
  })
  ageGroup: AgeGroup;

  @Prop({ type: String, required: false })
  imageUrl?: string;

  @Prop({ type: String, required: false })
  bannerUrl?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [], index: true })
  members: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;
}

export const CommunitySchema = SchemaFactory.createForClass(Community);
