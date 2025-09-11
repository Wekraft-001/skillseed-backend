import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StudentAchievementDocument = StudentAchievement & Document;

@Schema({ timestamps: true })
export class StudentAchievement {
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  })
  student: Types.ObjectId;

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'Achievement', 
    required: true,
    index: true 
  })
  achievement: Types.ObjectId;

  @Prop({ required: true })
  awardedAt: Date;

  @Prop({ required: false })
  seenByStudent: boolean;
}

export const StudentAchievementSchema = SchemaFactory.createForClass(StudentAchievement);
