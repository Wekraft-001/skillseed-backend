import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './users/user.schema';
import { UserRole } from 'src/common/interfaces';

@Schema({ timestamps: true })
export class Mentor extends Document {
  @Prop({ required: true, index: true })
  firstName: string;

  @Prop({ required: true, index: true })
  lastName: string;

  @Prop({ index: true })
  email: string;

  @Prop({ index: true })
  phoneNumber: string;

  @Prop({ index: true })
  specialty: string;

  @Prop({ index: true })
  city: string;

  @Prop({ index: true })
  country: string;

  @Prop({ index: true })
  biography?: string;

  @Prop({ index: true })
  linkedin?: string;

  @Prop({ required: true, select: false })
  password?: string;

  @Prop({ index: true })
  image?: string;

  @Prop({ index: true })
  nationalIdUrl?: string;

  @Prop({ type: [String], index: true })
  areasOfExpertise?: string[];

  @Prop({ type: [String], index: true })
  languages?: string[];

  @Prop({ index: true })
  yearsOfExperience?: string;

  @Prop({ index: true })
  education?: string;

  @Prop({
    type: String,
    enum: UserRole,
    default: UserRole.MENTOR,
    index: true,
  })
  role?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], index: true })
  students: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  superAdmin?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  createdBy?: Types.ObjectId;

  @Prop({ default: null, index: true })
  deletedAt: Date;
}

export const MentorSchema = SchemaFactory.createForClass(Mentor);
