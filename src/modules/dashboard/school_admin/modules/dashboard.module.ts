import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SchoolDashboardService } from '../services/index';
import { SchoolDashboardController } from '../controller/dashboard.controller';
import { School, SchoolSchema, User, UserSchema } from '../../../schemas/index';
import { LoggerModule } from 'src/common/logger/logger.module';
import { SchoolResourcesController } from '../controllers/resources.controller';
import { SchoolResourcesService } from '../services/resources.service';
import { SchoolChallengesController } from '../controllers/challenges.controller';
import { SchoolChallengesService } from '../services/challenges.service';
import { SchoolContentController } from '../controllers/content.controller';
import { SchoolContentService } from '../services/content.service';
import { ContentModule } from 'src/modules/content/content.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: School.name, schema: SchoolSchema },
      { name: User.name, schema: UserSchema },
    ]),
    LoggerModule,
    ContentModule,
  ],
  controllers: [
    SchoolDashboardController, 
    SchoolResourcesController, 
    SchoolChallengesController,
    SchoolContentController
  ],
  providers: [
    SchoolDashboardService, 
    SchoolResourcesService, 
    SchoolChallengesService,
    SchoolContentService
  ],
})
export class SchoolDashboardModule {}
