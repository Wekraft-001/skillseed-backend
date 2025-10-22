import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AiGatewayService } from './ai-gateway.service';
import { AiGatewayController } from './ai-gateway.controller';
import { LoggerModule } from '../../common/logger/logger.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    AiModule,
    HttpModule.register({
      timeout: 30000, // 30 seconds timeout for AI service calls
      maxRedirects: 2,
    }),
  ],
  controllers: [AiGatewayController],
  providers: [AiGatewayService],
  exports: [AiGatewayService],
})
export class AiGatewayModule {}