import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './users/user.schema';

export type MentorCredentialDocument = MentorCredential & Document;

@Schema({ timestamps: true })
export class MentorCredential {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  mentor: User;

  @Prop({ required: true })
  credentialType: 'government_id' | 'professional_credentials';

  @Prop({ required: true })
  fileUrl: string;

  @Prop({ required: true })
  fileName: string;

  @Prop()
  description: string;

  @Prop({ default: 'pending' })
  status: 'pending' | 'approved' | 'rejected';

  @Prop()
  verifiedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  verifiedBy: User;
  
  @Prop()
  rejectionReason: string;
}

export const MentorCredentialSchema = SchemaFactory.createForClass(MentorCredential);
