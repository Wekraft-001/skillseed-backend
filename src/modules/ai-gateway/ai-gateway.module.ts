import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AiGatewayService } from './ai-gateway.service';
import { AiGatewayController } from './ai-gateway.controller';
import { InternalAiController } from './internal-ai.controller';
import { LoggerModule } from '../../common/logger/logger.module';
import { AiModule } from '../ai/ai.module';
import { CareerQuiz, CareerQuizSchema } from '../schemas/career-quiz.schema';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    AiModule,
    HttpModule.register({
      timeout: 30000, // 30 seconds timeout for AI service calls
      maxRedirects: 2,
    }),
    MongooseModule.forFeature([
      { name: CareerQuiz.name, schema: CareerQuizSchema },
    ]),
  ],
  controllers: [AiGatewayController, InternalAiController],
  providers: [AiGatewayService],
  exports: [AiGatewayService],
})
export class AiGatewayModule {}