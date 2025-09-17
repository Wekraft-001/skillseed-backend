import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/interfaces';
import { CurrentUser } from 'src/common/decorators';
import { ApiOperation, ApiTags, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { RewardsService } from './rewards.service';
import { User, BadgeTier } from '../schemas';

@Controller('student/rewards')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
@ApiTags('STUDENT DASHBOARD')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all rewards for the current student' })
  async getRewards(@CurrentUser() user: User) {
    return this.rewardsService.getStudentRewardsSummary((user as any)._id);
  }

  @Get('stars')
  @ApiOperation({ summary: 'Get stars for the current student' })
  async getStars(@CurrentUser() user: User) {
    return this.rewardsService.getStarsForUser((user as any)._id);
  }

  @Get('badges')
  @ApiOperation({ summary: 'Get badges for the current student' })
  @ApiQuery({ 
    name: 'tier', 
    enum: BadgeTier, 
    required: false,
    description: 'Filter badges by tier (bronze, silver, gold, legendary, special)'
  })
  async getBadges(
    @CurrentUser() user: User,
    @Query('tier') tier?: BadgeTier
  ) {
    const badges = await this.rewardsService.getBadgesForUser((user as any)._id);
    
    if (tier) {
      return badges.filter(badge => badge.tier === tier);
    }
    
    return badges;
  }

  @Get('badges/tier/:tier')
  @ApiOperation({ summary: 'Get badges for the current student by tier' })
  @ApiParam({ 
    name: 'tier', 
    enum: BadgeTier,
    description: 'Badge tier (bronze, silver, gold, legendary, special)'
  })
  async getBadgesByTier(
    @CurrentUser() user: User,
    @Param('tier') tier: BadgeTier
  ) {
    const badges = await this.rewardsService.getBadgesForUser((user as any)._id);
    return badges.filter(badge => badge.tier === tier);
  }

  @Post('complete-content')
  @ApiOperation({ summary: 'Mark educational content as completed' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['educationalContentId', 'contentType', 'contentIndex'],
      properties: {
        educationalContentId: { type: 'string' },
        contentType: { type: 'string', enum: ['video', 'book', 'game'] },
        contentIndex: { type: 'number' }
      }
    }
  })
  async completeContent(
    @CurrentUser() user: User,
    @Body() payload: { educationalContentId: string; contentType: 'video' | 'book' | 'game'; contentIndex: number }
  ) {
    return this.rewardsService.completeEducationalContent(
      (user as any)._id,
      payload.educationalContentId,
      payload.contentType,
      payload.contentIndex
    );
  }

  @Post('complete-challenge/:challengeId')
  @ApiOperation({ summary: 'Mark a challenge as completed' })
  @ApiParam({ name: 'challengeId', type: 'string' })
  async completeChallenge(
    @CurrentUser() user: User,
    @Param('challengeId') challengeId: string
  ) {
    return this.rewardsService.completeChallenge((user as any)._id, challengeId);
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get student progress towards next tier badges' })
  async getProgressToNextTier(@CurrentUser() user: User) {
    const summary = await this.rewardsService.getStudentRewardsSummary((user as any)._id);
    
    // Calculate progress towards each tier
    const progress = {
      bronze: {
        requirement: 3,
        current: Math.min(summary.starsByType.video + summary.starsByType.book + summary.starsByType.game, 3),
        completed: summary.starsByType.video + summary.starsByType.book + summary.starsByType.game >= 3
      },
      silver: {
        requirement: 100,
        current: Math.min(summary.totalStars, 100),
        completed: summary.totalStars >= 100
      },
      gold: {
        requirement: 200,
        current: Math.min(summary.totalStars, 200),
        completed: summary.totalStars >= 200
      },
      legendary: {
        requirement: 300,
        current: Math.min(summary.totalStars, 300),
        completed: summary.totalStars >= 300
      },
      badges: summary.badges.filter(badge => 
        badge.tier === BadgeTier.BRONZE || 
        badge.tier === BadgeTier.SILVER || 
        badge.tier === BadgeTier.GOLD || 
        badge.tier === BadgeTier.LEGENDARY
      )
    };
    
    return progress;
  }
}
