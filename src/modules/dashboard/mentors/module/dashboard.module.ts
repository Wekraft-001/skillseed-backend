import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MentorDashboardController } from '../controller/dashboard.controller';
import { Mentor, MentorSchema, User, UserSchema } from '../../../schemas/index';
import { LoggerModule } from 'src/common/logger/logger.module';
import { MentorDashboardService } from '../services/dashboard.services';
import {
  MentorCredential,
  MentorCredentialSchema,
} from 'src/modules/schemas/mentor-credential.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Mentor.name, schema: MentorSchema },
      { name: User.name, schema: UserSchema },
      { name: MentorCredential.name, schema: MentorCredentialSchema },
    ]),
    LoggerModule,
  ],
  controllers: [MentorDashboardController],
  providers: [MentorDashboardService],
})
export class MentorDashboardModule {}
