import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StudentActivityDocument = StudentActivity & Document;

export enum ActivityType {
  CHALLENGE = 'challenge',
  QUIZ = 'quiz',
  LESSON = 'lesson',
  MENTOR_SESSION = 'mentor_session'
}

export enum ActivityStatus {
  COMPLETED = 'completed',
  IN_PROGRESS = 'in_progress',
  NOT_STARTED = 'not_started'
}

@Schema({ timestamps: true })
export class StudentActivity {
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  })
  student: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: ActivityType, 
    required: true,
    index: true 
  })
  activityType: ActivityType;

  @Prop({ 
    type: Types.ObjectId, 
    required: true,
    refPath: 'activityType',
    index: true 
  })
  activityId: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: ActivityStatus, 
    required: true,
    default: ActivityStatus.NOT_STARTED,
    index: true 
  })
  status: ActivityStatus;

  @Prop({ required: false })
  startedAt?: Date;

  @Prop({ required: false })
  completedAt?: Date;

  @Prop({ required: false })
  timeSpentMinutes?: number;

  @Prop({ required: false })
  score?: number;

  @Prop({ type: Object, required: false })
  metadata?: Record<string, any>;
}

export const StudentActivitySchema = SchemaFactory.createForClass(StudentActivity);
