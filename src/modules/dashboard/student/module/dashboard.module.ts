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
  CommunitySchema,
  CategorySchema,
  Category,
  CompletedChallenge,
  CompletedChallengeSchema,
  Post,
  PostSchema,
} from 'src/modules/schemas';
import { LoggerModule } from 'src/common/logger/logger.module';
import { AiGatewayModule } from 'src/modules/ai-gateway/ai-gateway.module';
import { StudentDashboardController } from '../controllers/dashboard.controllers';
import { StudentDashboardService } from '../services/dashboard.service';
import { StudentChallengesController } from '../controllers/challenges.controller';
import { StudentChallengesService } from '../services/challenges.service';
import { ContentModule } from 'src/modules/content/content.module';
import { StudentCommunitiesController } from '../controllers/communities.controller';
import { StudentCommunitiesService } from '../services/communities.service';
import { CompletedChallengesService } from '../services/completed-challenges.service';
import { CommunityPostsController } from '../controllers/community-posts.controller';
import { PostsService } from '../services/posts.service';
import { RewardsModule } from 'src/modules/rewards/rewards.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: CareerQuiz.name, schema: CareerQuizSchema },
      { name: EducationalContent.name, schema: EducationalContentSchema },
      { name: Challenge.name, schema: ChallengeSchema },
      { name: Community.name, schema: CommunitySchema },
      { name: Category.name, schema: CategorySchema },
      { name: CompletedChallenge.name, schema: CompletedChallengeSchema },
      { name: Post.name, schema: PostSchema },
    ]),
    LoggerModule,
    AiGatewayModule,
    ContentModule,
    RewardsModule,
  ],
  controllers: [
    StudentDashboardController,
    StudentChallengesController,
    StudentCommunitiesController,
    CommunityPostsController,
  ],
  providers: [
    StudentDashboardService,
    StudentChallengesService,
    StudentCommunitiesService,
    CompletedChallengesService,
    PostsService,
  ],
  exports: [StudentDashboardService],
})
export class StudentDashboardModule {}
