import { Module } from '@nestjs/common';
import { QuizDataService } from './quiz-data.service';

@Module({
  providers: [QuizDataService],
  exports: [QuizDataService]
})
export class AiModule {}