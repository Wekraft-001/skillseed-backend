import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './users/user.schema';
import { ProjectShowcase } from './showcase.schema';

export type BadgeDocument = Badge & Document;

export enum BadgeTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  LEGENDARY = 'legendary',
  SPECIAL = 'special'
}

@Schema({ timestamps: true })
export class Badge {
  @Prop({ required: true, index: true })
  name: string;

  @Prop({ required: true, index: true })
  description: string;

  @Prop({ index: true })
  imageUrl: string;

  @Prop({ 
    type: String, 
    enum: BadgeTier, 
    default: BadgeTier.BRONZE, 
    index: true 
  })
  tier: BadgeTier;

  @Prop({ type: String, required: true, index: true })
  icon: string;

  @Prop({
    type: [
      {
        description: String,
        isCompleted: Boolean,
      },
    ],
    required: true,
    index: true
  })
  tasks: {
    description: string;
    isCompleted: boolean;
  }[];

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop({ type: Types.ObjectId, ref: 'ProjectShowcase', index: true })
  showcase: ProjectShowcase;

  @Prop({ type: Types.ObjectId, ref: 'Challenge', index: true })
  challenge: Types.ObjectId;

  @Prop({ type: String, index: true })
  badgeType: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: User;
}

export const BadgeSchema = SchemaFactory.createForClass(Badge);
