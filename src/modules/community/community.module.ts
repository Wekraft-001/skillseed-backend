import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from 'src/common/logger/logger.module';
import {
  Category,
  CategorySchema,
  Community,
  CommunitySchema,
  User,
  UserSchema,
} from '../schemas';
import { CommunityController } from './controllers/community.controller';
import { CommunityService } from './services/community.service';
import { SeedCommunitiesService } from './commands/seed-communities.command';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Community.name, schema: CommunitySchema },
      { name: User.name, schema: UserSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
    LoggerModule,
  ],
  controllers: [CommunityController],
  providers: [CommunityService, SeedCommunitiesService],
  exports: [CommunityService, SeedCommunitiesService],
})
export class CommunityModule {}
