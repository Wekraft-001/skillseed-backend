import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'SkillSeed AI Backend Service';
  }
  
  healthCheck() {
    return {
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      apiInfo: {
        name: 'SkillSeed API',
        description: 'Backend API for SkillSeed application',
      }
    };
  }
}
