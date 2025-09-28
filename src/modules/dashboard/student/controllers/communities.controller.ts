import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/interfaces';
import { CurrentUser } from 'src/common/decorators';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { StudentCommunitiesService } from '../services/communities.service';
import { User } from 'src/modules/schemas';

@Controller('student/dashboard/communities')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
@ApiTags('STUDENT DASHBOARD')
export class StudentCommunitiesController {
  constructor(private readonly communitiesService: StudentCommunitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available communities for students' })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by legacy category (deprecated)',
  })
  @ApiQuery({
    name: 'challengeCategory',
    required: false,
    description: 'Filter by challenge category ID',
  })
  @ApiQuery({
    name: 'ageGroup',
    required: false,
    description: 'Filter by age group',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name or description',
  })
  async getAllCommunities(@CurrentUser() user: User) {
    return this.communitiesService.getCommunities((user as any)._id);
  }

  // @Get('joined')
  // @ApiOperation({ summary: 'Get communities the student has joined' })
  // async getUserCommunities(@CurrentUser() user: User) {
  //   return this.communitiesService.getUserCommunities((user as any)._id);
  // }

  @Get(':id')
  @ApiOperation({ summary: 'Get community details by ID' })
  @ApiParam({ name: 'id', description: 'Community ID' })
  async getCommunityDetails(@CurrentUser() user: User, @Param('id') id: string) {
    return this.communitiesService.getCommunityDetails(id, (user as any)._id);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join a community' })
  @ApiParam({ name: 'id', description: 'Community ID' })
  async joinCommunity(@CurrentUser() user: User, @Param('id') id: string) {
    return this.communitiesService.joinCommunity(id, (user as any)._id);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Leave a community' })
  @ApiParam({ name: 'id', description: 'Community ID' })
  async leaveCommunity(@CurrentUser() user: User, @Param('id') id: string) {
    return this.communitiesService.leaveCommunity(id, (user as any)._id);
  }
}
