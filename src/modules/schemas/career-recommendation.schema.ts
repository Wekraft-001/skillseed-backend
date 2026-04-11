import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CareerRecommendationDocument = CareerRecommendation & Document;

@Schema({ timestamps: true })
export class CareerRecommendation {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'CareerQuiz', required: true })
  quizId: Types.ObjectId;

  @Prop({ type: Object, required: true })
  recommendationResult: Record<string, any>;

  @Prop({ type: Object, default: null })
  quizAnalysis: Record<string, any> | null;

  @Prop({ type: Date, default: null })
  quizCompletedAt: Date | null;
}

export const CareerRecommendationSchema =
  SchemaFactory.createForClass(CareerRecommendation);
