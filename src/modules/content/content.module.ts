import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from 'src/common/logger/logger.module';
import { 
  Content, 
  ContentSchema, 
  Challenge, 
  ChallengeSchema, 
  ChallengeCategory,
  ChallengeCategorySchema,
  User, 
  UserSchema 
} from '../schemas';
import { ContentController } from './controllers/content.controller';
import { ChallengeCategoryController } from './controllers/challenge-category.controller';
import { ContentService } from './services/content.service';
import { ChallengeCategoryService } from './services/challenge-category.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Content.name, schema: ContentSchema },
      { name: Challenge.name, schema: ChallengeSchema },
      { name: ChallengeCategory.name, schema: ChallengeCategorySchema },
      { name: User.name, schema: UserSchema },
    ]),
    LoggerModule,
  ],
  controllers: [ContentController, ChallengeCategoryController],
  providers: [ContentService, ChallengeCategoryService],
  exports: [ContentService, ChallengeCategoryService],
})
export class ContentModule {}
