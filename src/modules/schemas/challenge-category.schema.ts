import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ChallengeCategoryDocument = ChallengeCategory & Document;

@Schema({ timestamps: true })
export class ChallengeCategory {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description: string;

  @Prop()
  icon: string;

  @Prop()
  colorTheme: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  createdBy: MongooseSchema.Types.ObjectId;
}

export const ChallengeCategorySchema = SchemaFactory.createForClass(ChallengeCategory);
