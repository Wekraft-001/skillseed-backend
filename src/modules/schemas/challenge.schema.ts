import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { AgeRange, ChallengeType } from '../content/dtos';

export type ChallengeDocument = Challenge & Document;

@Schema({ timestamps: true })
export class Challenge {
  @Prop({ required: true, index: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({
    type: String,
    enum: ChallengeType,
    required: true,
    index: true,
  })
  type: ChallengeType;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true,
  })
  categoryId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  difficultyLevel: string;

  @Prop({ required: true })
  theme: string;

  @Prop({ required: true })
  estimatedTime: string;

  @Prop({
    type: String,
    enum: AgeRange,
    required: true,
    index: true,
  })
  ageRange: AgeRange;

  @Prop({ type: String, required: false })
  imageUrl?: string;

  @Prop({ type: String, required: false })
  videoTutorialUrl?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy: Types.ObjectId;
}

export const ChallengeSchema = SchemaFactory.createForClass(Challenge);
