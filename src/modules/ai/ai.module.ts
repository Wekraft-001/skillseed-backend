// src/modules/ai/ai.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { YouTubeService } from './youtube.service';
import { LoggerModule } from '../../common/logger/logger.module';
import { RedisModule } from 'src/redis/redis.module';
import { RewardsModule } from '../rewards/rewards.module';
import { CareerQuiz, CareerQuizSchema } from '../schemas/career-quiz.schema';
import {
  EducationalContent,
  EducationalContentSchema,
  User,
  UserSchema,
} from '../schemas';

@Module({
  imports: [
    LoggerModule, //  This provides LoggerService
    RedisModule,
    RewardsModule, // Add this to use RewardsService
    MongooseModule.forFeature([
      { name: CareerQuiz.name, schema: CareerQuizSchema },
      { name: EducationalContent.name, schema: EducationalContentSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AiController],
  providers: [AiService, YouTubeService],
  exports: [AiService],
})
export class AiModule {}
