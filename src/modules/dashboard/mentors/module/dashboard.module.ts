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
import { MentorLearningActivitiesController } from '../controllers/learning-activities.controller';
import { MentorLearningActivitiesService } from '../services/learning-activities.service';
import { MentorResourcesController } from '../controllers/resources.controller';
import { MentorResourcesService } from '../services/resources.service';
import { ContentModule } from 'src/modules/content/content.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Mentor.name, schema: MentorSchema },
      { name: User.name, schema: UserSchema },
      { name: MentorCredential.name, schema: MentorCredentialSchema },
    ]),
    LoggerModule,
    ContentModule,
  ],
  controllers: [MentorDashboardController, MentorLearningActivitiesController, MentorResourcesController],
  providers: [MentorDashboardService, MentorLearningActivitiesService, MentorResourcesService],
})
export class MentorDashboardModule {}
