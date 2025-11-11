import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CommunityService } from '../services/community.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/interfaces';

@Controller('challenges')
@ApiTags('SUPERADMIN DASHBOARD - Challenges')
export class ChallengeController {
  constructor(
    private readonly communityService: CommunityService,
  ) {}

  @Get(':id/submissions/count')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get submission count and list for a specific challenge' })
  @ApiParam({ name: 'id', description: 'Challenge ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns challenge submission count and submission list',
    schema: {
      example: {
        challengeId: '507f1f77bcf86cd799439011',
        challengeTitle: 'Build a Robot',
        submissionCount: 15,
        submissions: [
          {
            _id: '507f1f77bcf86cd799439013',
            userId: {
              _id: '507f1f77bcf86cd799439012',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com',
              image: 'https://...'
            },
            completedAt: '2025-11-10T12:00:00.000Z',
            completionNotes: 'Built a line-following robot',
            workFileUrl: 'https://...'
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Challenge not found' })
  getChallengeSubmissionCount(@Param('id') id: string) {
    return this.communityService.getChallengeSubmissionCount(id);
  }

  @Get('stats/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get all challenges with submission counts' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns all challenges with their submission counts' 
  })
  getAllChallengesWithStats() {
    return this.communityService.getAllChallengesWithStats();
  }
}
