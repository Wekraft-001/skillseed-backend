import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuizDataService } from './quiz-data.service';
import { InternalAiController } from './internal-ai.controller';
import { CareerQuiz, CareerQuizSchema } from '../schemas/career-quiz.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CareerQuiz.name, schema: CareerQuizSchema }
    ])
  ],
  controllers: [InternalAiController],
  providers: [QuizDataService],
  exports: [QuizDataService]
})
export class AiModule {}