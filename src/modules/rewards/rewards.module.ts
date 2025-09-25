import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Badge,
  BadgeSchema,
  Star,
  StarSchema,
  Challenge,
  ChallengeSchema,
  EducationalContent,
  EducationalContentSchema,
  User,
  UserSchema,
  Category,
  CategorySchema,
} from '../schemas';
import { RewardsService } from './rewards.service';
import { RewardsController } from './rewards.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Badge.name, schema: BadgeSchema },
      { name: Star.name, schema: StarSchema },
      { name: Challenge.name, schema: ChallengeSchema },
      { name: Category.name, schema: CategorySchema },
      { name: EducationalContent.name, schema: EducationalContentSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [RewardsService],
  controllers: [RewardsController],
  exports: [RewardsService],
})
export class RewardsModule {}
