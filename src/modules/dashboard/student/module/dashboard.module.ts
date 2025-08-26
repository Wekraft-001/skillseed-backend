import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { 
  CareerQuiz, 
  CareerQuizSchema, 
  EducationalContent, 
  EducationalContentSchema,
  User,
  UserSchema
} from 'src/modules/schemas';
import { LoggerModule } from 'src/common/logger/logger.module';
import { AiModule } from 'src/modules/ai/ai.module';
import { StudentDashboardController } from '../controller/dashboard.controller';
import { StudentDashboardService } from '../services/dashboard.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: CareerQuiz.name, schema: CareerQuizSchema },
      { name: EducationalContent.name, schema: EducationalContentSchema },
    ]),
    LoggerModule,
    AiModule,
  ],
  controllers: [StudentDashboardController],
  providers: [StudentDashboardService],
  exports: [StudentDashboardService],
})
export class StudentDashboardModule {}
