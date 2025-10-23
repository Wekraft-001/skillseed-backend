import { Controller, Post, Body, Logger, Headers, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CareerQuiz } from '../schemas/career-quiz.schema';

@Controller('api/internal/ai')
@ApiTags('AI Gateway - Internal')
export class InternalAiController {
  private readonly logger = new Logger(InternalAiController.name);

  constructor(
    @InjectModel(CareerQuiz.name)
    private readonly quizModel: Model<CareerQuiz>,
  ) {}

  @Post('quiz/upsert')
  @ApiOperation({ summary: 'Upsert a quiz document from AI microservice (internal use)' })
  async upsertQuiz(@Body() body: any, @Headers('authorization') authorization: string) {
    try {
      if (!body || !body._id) {
        throw new BadRequestException('Missing quiz _id in payload');
      }

      // Normalize user id to ObjectId if present
      if (body.user) {
        try {
          body.user = new Types.ObjectId(body.user);
        } catch (e) {
          this.logger.warn(`Failed to convert user to ObjectId: ${body.user}`);
        }
      }

      // Attempt upsert by _id
      const quizId = body._id;
      const update = { $set: { ...body } };
      const options = { upsert: true, new: true, setDefaultsOnInsert: true } as any;

      const result = await this.quizModel.findOneAndUpdate({ _id: quizId }, update, options).exec();

      this.logger.log(`Upserted quiz ${quizId} into backend database`);
      return { success: true, quizId: quizId.toString() };
    } catch (error) {
      this.logger.error('Failed to upsert quiz', error.stack || error.message);
      throw error;
    }
  }
}