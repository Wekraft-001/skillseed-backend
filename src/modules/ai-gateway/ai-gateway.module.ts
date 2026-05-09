import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AiGatewayGuestService,
  AiGatewayService,
  QuizDataService,
} from './services';
import { AiGatewayController, AiGatewayGuestController } from './controllers';
import { LoggerModule } from '../../common/logger/logger.module';
import { CareerQuiz, CareerQuizSchema } from '../schemas/career-quiz.schema';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 2,
    }),
    MongooseModule.forFeature([
      { name: CareerQuiz.name, schema: CareerQuizSchema },
    ]),
  ],
  controllers: [AiGatewayController, AiGatewayGuestController],
  providers: [AiGatewayService, AiGatewayGuestService, QuizDataService],
  exports: [AiGatewayService, AiGatewayGuestService],
})
export class AiGatewayModule {}
