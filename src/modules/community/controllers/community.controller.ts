import { 
  Body, 
  Controller, 
  Delete,
  Get, 
  Param, 
  Post, 
  Query, 
  UseGuards 
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommunityService } from '../services/community.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators';
import { User } from '../../schemas';
import { CreateCommunityDto, FilterCommunityDto } from '../dtos';
import { UserRole } from 'src/common/interfaces';
import { AgeGroup, CommunityCategory } from '../../schemas/community.schema';
import { SeedCommunitiesService } from '../commands/seed-communities.command';

@Controller('communities')
@ApiTags('Communities')
export class CommunityController {
  constructor(
    private readonly communityService: CommunityService,
    private readonly seedService: SeedCommunitiesService
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create new community (Super Admin only)' })
  @ApiBody({ type: CreateCommunityDto })
  @ApiResponse({ status: 201, description: 'Community successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data or challenge category not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - only super admins can create communities' })
  createCommunity(
    @CurrentUser() user: User,
    @Body() createCommunityDto: CreateCommunityDto,
  ) {
    return this.communityService.createCommunity(createCommunityDto, (user as any)._id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all communities (public)' })
  @ApiQuery({ name: 'category', enum: CommunityCategory, required: false, description: 'Filter by legacy category (deprecated)' })
  @ApiQuery({ name: 'challengeCategory', required: false, description: 'Filter by challenge category ID' })
  @ApiQuery({ name: 'ageGroup', enum: AgeGroup, required: false, description: 'Filter by age group' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or description' })
  getAllCommunities(
    @Query() filterDto: FilterCommunityDto,
  ) {
    return this.communityService.getAllCommunities(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get community details by ID (public)' })
  @ApiParam({ name: 'id', description: 'Community ID' })
  getCommunityById(
    @Param('id') id: string,
  ) {
    return this.communityService.getCommunityById(id);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Join a community (Students only)' })
  @ApiParam({ name: 'id', description: 'Community ID' })
  joinCommunity(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.communityService.joinCommunity(id, (user as any)._id);
  }

  @Post(':id/leave')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Leave a community (Students only)' })
  @ApiParam({ name: 'id', description: 'Community ID' })
  leaveCommunity(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.communityService.leaveCommunity(id, (user as any)._id);
  }

  @Get('user/joined')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get communities the student has joined' })
  getUserCommunities(
    @CurrentUser() user: User,
  ) {
    return this.communityService.getUserCommunities((user as any)._id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Deactivate a community (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Community ID' })
  deactivateCommunity(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.communityService.deactivateCommunity(id, (user as any)._id);
  }

  @Post('seed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Seed initial communities (Super Admin only)' })
  async seedCommunities() {
    await this.seedService.seed();
    return { message: 'Communities seeded successfully' };
  }
}
