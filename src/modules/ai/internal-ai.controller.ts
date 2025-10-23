import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InjectModel } from '@nestjs/mongoose';
import { CareerQuiz } from '../schemas/career-quiz.schema';
import { Model } from 'mongoose';

@ApiTags('internal-ai')
@Controller('internal/ai')
export class InternalAiController {
  constructor(
    @InjectModel(CareerQuiz.name) private careerQuizModel: Model<CareerQuiz>,
  ) {}

  @Post('quiz/sync')
  @UseGuards(JwtAuthGuard)
  async syncQuiz(@Body() quizData: any) {
    try {
      // Use upsert to either update an existing quiz or create a new one
      const result = await this.careerQuizModel.findOneAndUpdate(
        { _id: quizData._id },
        { $set: quizData },
        { upsert: true, new: true }
      );
      
      return {
        success: true,
        message: 'Quiz synchronized successfully',
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to synchronize quiz',
        error: error.message
      };
    }
  }
}