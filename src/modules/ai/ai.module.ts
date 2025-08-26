// src/modules/ai/ai.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { LoggerModule } from '../../common/logger/logger.module';
import { RedisModule } from 'src/redis/redis.module';
import { CareerQuiz, CareerQuizSchema } from '../schemas/career-quiz.schema';
import {
  EducationalContent,
  EducationalContentSchema,
  User,
  UserSchema,
} from '../schemas';

@Module({
  imports: [
    LoggerModule, // 👈 This provides LoggerService
    RedisModule,
    MongooseModule.forFeature([
      { name: CareerQuiz.name, schema: CareerQuizSchema },
      { name: EducationalContent.name, schema: EducationalContentSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
