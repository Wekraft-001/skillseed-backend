import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MentorSessionDocument = MentorSession & Document;

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

@Schema({ timestamps: true })
export class MentorSession {
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  })
  student: Types.ObjectId;

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  })
  mentor: Types.ObjectId;

  @Prop({ required: true })
  scheduledAt: Date;

  @Prop({ required: false })
  endedAt?: Date;

  @Prop({ 
    type: String, 
    enum: SessionStatus, 
    required: true,
    default: SessionStatus.SCHEDULED,
    index: true 
  })
  status: SessionStatus;

  @Prop({ required: false })
  durationMinutes?: number;

  @Prop({ required: false })
  topic?: string;

  @Prop({ required: false })
  notes?: string;

  @Prop({ required: false })
  studentRating?: number;

  @Prop({ required: false })
  mentorRating?: number;

  @Prop({ required: false })
  studentFeedback?: string;

  @Prop({ required: false })
  mentorFeedback?: string;
}

export const MentorSessionSchema = SchemaFactory.createForClass(MentorSession);
