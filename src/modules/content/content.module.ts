import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from 'src/common/logger/logger.module';
import {
  Content,
  ContentSchema,
  Challenge,
  ChallengeSchema,
  Category,
  CategorySchema,
  User,
  UserSchema,
} from '../schemas';
import { ContentController } from './controllers/content.controller';
import { ContentService } from './services/content.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Content.name, schema: ContentSchema },
      { name: Challenge.name, schema: ChallengeSchema },
      { name: Category.name, schema: CategorySchema },
      { name: User.name, schema: UserSchema },
    ]),
    LoggerModule,
  ],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
