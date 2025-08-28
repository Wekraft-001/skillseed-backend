import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommunityDocument = Community & Document;

export enum CommunityCategory {
  ARTS_CRAFTS = 'arts_crafts',
  SCIENCE = 'science',
  TECH_CODING = 'tech_coding',
  MUSIC_DANCE = 'music_dance',
  READING = 'reading',
  GAMES = 'games',
  OTHER = 'other'
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
    required: true,
    index: true 
  })
  category: CommunityCategory;

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
