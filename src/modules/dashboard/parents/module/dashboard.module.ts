import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ParentDashboardService } from '../services/dashboard.service';
import { ParentDashboardController } from '../controllers/dashboard.controller';
import {
  CareerQuiz,
  CareerQuizSchema,
  CompletedChallenge,
  CompletedChallengeSchema,
  EducationalContent,
  EducationalContentSchema,
  LearningProgress,
  LearningProgressSchema,
  School,
  SchoolSchema,
  User,
  UserSchema,
} from '../../../schemas/index';
import { LoggerModule } from 'src/common/logger/logger.module';
import { Subscription } from 'rxjs';
import { SubscriptionSchema } from 'src/modules/schemas/subscription.schema';
import { SubscriptionModule } from '../../../../subscription/subscription.module';
import { PaymentModule } from 'src/payment/payment.module';
import {
  TempStudent,
  TempStudentSchema,
} from 'src/modules/schemas/temp-student.schema';
import {
  Transaction,
  TransactionSchema,
} from 'src/modules/schemas/transaction.schema';
import { ContentModule } from 'src/modules/content/content.module';
import { EmailModule } from 'src/common/utils/mailing/email.module';
import { ParentChildOverviewService } from '../services/parent-child-overview.service';
import { RewardsModule } from 'src/modules/rewards/rewards.module';
import { StudentDashboardModule } from '../../student/module/dashboard.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: School.name, schema: SchoolSchema },
      { name: User.name, schema: UserSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: TempStudent.name, schema: TempStudentSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: CareerQuiz.name, schema: CareerQuizSchema },
      { name: EducationalContent.name, schema: EducationalContentSchema },
      { name: CompletedChallenge.name, schema: CompletedChallengeSchema },
      { name: LearningProgress.name, schema: LearningProgressSchema },
    ]),
    forwardRef(() => SubscriptionModule),
    forwardRef(() => PaymentModule),
    forwardRef(() => StudentDashboardModule),
    LoggerModule,
    ContentModule,
    EmailModule,
    RewardsModule,
  ],
  controllers: [ParentDashboardController],
  providers: [ParentDashboardService, ParentChildOverviewService],
  exports: [ParentDashboardService],
})
export class ParentDashboardModule {}
