import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommunityDocument = Community & Document;

@Schema({ timestamps: true })
export class Community {
  @Prop({ required: true, index: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({
    required: false,
    index: true,
  })
  category?: string;

  @Prop({
    required: true,
    index: true,
  })
  ageGroup: string;

  @Prop({ type: String, required: false })
  imageUrl?: string;

  @Prop({ type: String, required: false })
  bannerUrl?: string;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'User' }],
    default: [],
    index: true,
  })
  members: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;
}

export const CommunitySchema = SchemaFactory.createForClass(Community);
