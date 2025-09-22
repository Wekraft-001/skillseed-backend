import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CommunityService } from '../services/community.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators';
import { User } from '../../../schemas';
import { CreateCommunityDto, FilterCommunityDto } from '../dto/community.dto';
import { UserRole } from 'src/common/interfaces';
// import { SeedCommunitiesService } from '../commands/seed-communities.command';

@Controller('communities')
@ApiTags('SUPERADMIN DASHBOARD')
export class CommunityController {
  constructor(
    private readonly communityService: CommunityService,
    // private readonly seedService: SeedCommunitiesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create new community (Super Admin only)' })
  @ApiBody({
    type: CreateCommunityDto,
    description:
      'Create a new community with name, description, age group, and optional category ID',
  })
  @ApiResponse({ status: 201, description: 'Community successfully created' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid data or category not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - only super admins can create communities',
  })
  createCommunity(
    @CurrentUser() user: User,
    @Body() createCommunityDto: CreateCommunityDto,
  ) {
    return this.communityService.createCommunity(
      createCommunityDto,
      (user as any)._id,
    );
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all communities' })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by legacy category (deprecated)',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by category ID',
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
  getAllCommunities(@Query() filterDto: FilterCommunityDto) {
    return this.communityService.getAllCommunities(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get community details by ID' })
  @ApiParam({ name: 'id', description: 'Community ID' })
  getCommunityById(@Param('id') id: string) {
    return this.communityService.getCommunityById(id);
  }

  @Get('user/joined')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get communities the student has joined' })
  getUserCommunities(@CurrentUser() user: User) {
    return this.communityService.getUserCommunities((user as any)._id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Deactivate a community' })
  @ApiParam({ name: 'id', description: 'Community ID' })
  deactivateCommunity(@CurrentUser() user: User, @Param('id') id: string) {
    return this.communityService.deactivateCommunity(id, (user as any)._id);
  }

  // @Post('seed')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRole.SUPER_ADMIN)
  // @ApiOperation({ summary: 'Seed initial communities (Super Admin only)' })
  // async seedCommunities() {
  //   await this.seedService.seed();
  //   return { message: 'Communities seeded successfully' };
  // }
}
