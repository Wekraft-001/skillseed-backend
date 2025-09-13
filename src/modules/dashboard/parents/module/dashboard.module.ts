import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ParentDashboardService } from '../services/dashboard.service';
import { ParentDashboardController } from '../controllers/dashboard.controller';
import { School, SchoolSchema, User, UserSchema } from '../../../schemas/index';
import { LoggerModule } from 'src/common/logger/logger.module';
import { Subscription } from 'rxjs';
import { SubscriptionSchema } from 'src/modules/schemas/subscription.schema';
import { SubscriptionModule } from '../../../../subscription/subscription.module';
import { PaymentModule } from 'src/payment/payment.module';
import { AiModule } from 'src/modules/ai/ai.module';
import {
  TempStudent,
  TempStudentSchema,
} from 'src/modules/schemas/temp-student.schema';
import {
  Transaction,
  TransactionSchema,
} from 'src/modules/schemas/transaction.schema';
import { ParentLearningActivitiesController } from '../controllers/learning-activities.controller';
import { ParentLearningActivitiesService } from '../services/learning-activities.service';
import { ParentResourcesController } from '../controllers/resources.controller';
import { ParentResourcesService } from '../services/resources.service';
import { ContentModule } from 'src/modules/content/content.module';
import { EmailModule } from 'src/common/utils/mailing/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: School.name, schema: SchoolSchema },
      { name: User.name, schema: UserSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: TempStudent.name, schema: TempStudentSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    LoggerModule,
    forwardRef(() => SubscriptionModule),
    forwardRef(() => PaymentModule),
    forwardRef(() => AiModule),
    ContentModule,
    EmailModule,
  ],
  controllers: [
    ParentDashboardController,
    ParentLearningActivitiesController,
    ParentResourcesController,
  ],
  providers: [
    ParentDashboardService,
    ParentLearningActivitiesService,
    ParentResourcesService,
  ],
  exports: [ParentDashboardService],
})
export class ParentDashboardModule {}
