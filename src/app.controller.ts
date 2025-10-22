import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  
  @Get('health')
  @ApiOperation({ summary: 'Health check for the API' })
  @ApiResponse({ 
    status: 200, 
    description: 'Service health information',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        version: { type: 'string' },
        timestamp: { type: 'string' },
        environment: { type: 'string' }
      }
    }
  })
  healthCheck() {
    return this.appService.healthCheck();
  }
}
