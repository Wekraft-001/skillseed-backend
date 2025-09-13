import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsController } from './controllers/reports.controller';
import { ReportsService } from './services/reports.service';
import { LoggerModule } from 'src/common/logger/logger.module';
import { 
  User,
  UserSchema,
  School, 
  SchoolSchema,
  Subscription,
  SubscriptionSchema,
  Challenge,
  ChallengeSchema,
  MentorSession,
  MentorSessionSchema,
  Achievement,
  AchievementSchema,
  StudentActivity,
  StudentActivitySchema,
  StudentAchievement,
  StudentAchievementSchema
} from '../schemas';

@Module({
  imports: [
    LoggerModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: School.name, schema: SchoolSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Challenge.name, schema: ChallengeSchema },
      { name: MentorSession.name, schema: MentorSessionSchema },
      { name: Achievement.name, schema: AchievementSchema },
      { name: StudentActivity.name, schema: StudentActivitySchema },
      { name: StudentAchievement.name, schema: StudentAchievementSchema }
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
