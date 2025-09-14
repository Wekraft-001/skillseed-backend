import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';

import {
  Badge,
  EducationalContent,
  User,
  School,
  ProjectShowcase,
  Mentor,
} from './modules/schemas';
import { LoggerModule } from './common/logger/logger.module';
import { UserModule } from './modules/users/user.module';
import { AiModule } from './modules/ai/ai.module';
import {
  DashboardModule,
  SchoolModule,
  TransactionModule,
  MentorModule,
  MentorCredentialModule,
} from './modules/dashboard/super_admin/modules/index';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionModule } from './subscription/subscription.module';
import { RedisModule } from './redis/redis.module';
import { PaymentModule } from './payment/payment.module';
import { SchoolDashboardModule } from './modules/dashboard/school_admin/modules/dashboard.module';
import { ParentDashboardModule } from './modules/dashboard/parents/module/dashboard.module';
import { MentorDashboardModule } from './modules/dashboard/mentors/module/dashboard.module';
import { StudentDashboardModule } from './modules/dashboard/student/module/dashboard.module';
import { ContentModule } from './modules/content/content.module';
import { CommunityModule } from './modules/community/community.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SuperAdminModule } from './modules/super_admin/super_admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: (config) => {
        if (!config.MONGO_URI) throw new Error('MONGO_URI is not defined');
        return config;
      },
      // envFilePath: process.env.NODE_ENV === 'production' ? '.env.development',
    }),
    LoggerModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (ConfigService: ConfigService) => ({
        uri: ConfigService.get<string>('MONGO_URI'),
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    AiModule,
    SchoolModule,
    MentorModule,
    SchoolDashboardModule,
    ParentDashboardModule,
    MentorDashboardModule,
    StudentDashboardModule,
    DashboardModule,
    MentorCredentialModule,
    SubscriptionModule,
    RedisModule,
    TransactionModule,
    PaymentModule,
    ContentModule,
    CommunityModule,
    RewardsModule,
    ReportsModule,
    SuperAdminModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
