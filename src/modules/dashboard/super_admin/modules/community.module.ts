import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from 'src/common/logger/logger.module';
import {
  Category,
  CategorySchema,
  Community,
  CommunitySchema,
  User,
  UserSchema,
  Challenge,
  ChallengeSchema,
  CompletedChallenge,
  CompletedChallengeSchema,
} from '../../../schemas';
import { CommunityController } from '../controllers/community.controller';
import { ChallengeController } from '../controllers/challenge.controller';
import { CommunityService } from '../services/community.service';
// import { SeedCommunitiesService } from './commands/seed-communities.command';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Community.name, schema: CommunitySchema },
      { name: User.name, schema: UserSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Challenge.name, schema: ChallengeSchema },
      { name: CompletedChallenge.name, schema: CompletedChallengeSchema },
    ]),
    LoggerModule,
  ],
  controllers: [CommunityController, ChallengeController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}
