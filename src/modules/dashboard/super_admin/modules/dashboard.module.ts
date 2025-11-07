import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Category,
  CategorySchema,
  Challenge,
  ChallengeSchema,
  EducationalContent,
  EducationalContentSchema,
} from 'src/modules/schemas';
import { Badge, BadgeSchema } from 'src/modules/schemas';
import { ProjectShowcase, ProjectShowcaseSchema } from 'src/modules/schemas';
import { CareerQuiz, CareerQuizSchema } from 'src/modules/schemas';
import { User, UserSchema } from 'src/modules/schemas';
import { School, SchoolSchema } from 'src/modules/schemas';
import { DashboardService } from '../../super_admin/services';
import { DashboardController } from '../../super_admin/controllers';
import { LoggerModule } from 'src/common/logger/logger.module';
// import { AiModule } from 'src/modules/ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: EducationalContent.name, schema: EducationalContentSchema },
      { name: Badge.name, schema: BadgeSchema },
      { name: ProjectShowcase.name, schema: ProjectShowcaseSchema },
      { name: CareerQuiz.name, schema: CareerQuizSchema },
      { name: School.name, schema: SchoolSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Challenge.name, schema: ChallengeSchema },
    ]),
    LoggerModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
