import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { 
  CareerQuiz, 
  CareerQuizSchema, 
  EducationalContent, 
  EducationalContentSchema,
  User,
  UserSchema,
  Challenge,
  ChallengeSchema,
  Community,
  CommunitySchema
} from 'src/modules/schemas';
import { LoggerModule } from 'src/common/logger/logger.module';
import { AiModule } from 'src/modules/ai/ai.module';
import { StudentDashboardController } from '../controller/dashboard.controller';
import { StudentDashboardService } from '../services/dashboard.service';
import { StudentChallengesController } from '../controllers/challenges.controller';
import { StudentChallengesService } from '../services/challenges.service';
import { ContentModule } from 'src/modules/content/content.module';
import { StudentCommunitiesController } from '../controllers/communities.controller';
import { StudentCommunitiesService } from '../services/communities.service';
import { CommunityModule } from 'src/modules/community/community.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: CareerQuiz.name, schema: CareerQuizSchema },
      { name: EducationalContent.name, schema: EducationalContentSchema },
      { name: Challenge.name, schema: ChallengeSchema },
      { name: Community.name, schema: CommunitySchema },
    ]),
    LoggerModule,
    AiModule,
    ContentModule,
    CommunityModule,
  ],
  controllers: [
    StudentDashboardController, 
    StudentChallengesController,
    StudentCommunitiesController
  ],
  providers: [
    StudentDashboardService, 
    StudentChallengesService,
    StudentCommunitiesService
  ],
  exports: [StudentDashboardService],
})
export class StudentDashboardModule {}
