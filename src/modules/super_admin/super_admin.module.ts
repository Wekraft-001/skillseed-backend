import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from 'src/common/logger/logger.module';
import { User, UserSchema, ChallengeCategory, ChallengeCategorySchema } from '../schemas';
import { CategoryController } from './controllers/category.controller';
import { CategoryPublicController } from './controllers/category-public.controller';
import { CategoryService } from './services/category.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ChallengeCategory.name, schema: ChallengeCategorySchema },
    ]),
    LoggerModule,
  ],
  controllers: [CategoryController, CategoryPublicController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class SuperAdminModule {}
