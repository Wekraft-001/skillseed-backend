import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ContentCategory, ContentType, TargetAudience } from '../content/dtos';

export type ContentDocument = Content & Document;

@Schema({ timestamps: true })
export class Content {
  @Prop({ required: true, index: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ 
    type: String, 
    enum: ContentType, 
    required: true,
    index: true 
  })
  type: ContentType;

  @Prop({ 
    type: String, 
    enum: ContentCategory, 
    required: true,
    index: true
  })
  category: ContentCategory;

  @Prop({ 
    type: String, 
    enum: TargetAudience, 
    required: true,
    index: true
  })
  targetAudience: TargetAudience;

  @Prop({ type: String, required: false })
  videoUrl?: string;

  @Prop({ type: String, required: false })
  author?: string;

  @Prop({ type: String, required: false })
  bookUrl?: string;

  @Prop({ type: String, required: false })
  thumbnailUrl?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy: Types.ObjectId;
}

export const ContentSchema = SchemaFactory.createForClass(Content);
