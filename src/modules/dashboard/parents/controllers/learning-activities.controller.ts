import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/interfaces';
import { CurrentUser } from 'src/common/decorators';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ParentLearningActivitiesService } from '../services/learning-activities.service';
import { FilterContentDto, ContentType, ContentCategory } from 'src/modules/content/dtos';
import { User } from 'src/modules/schemas';

@Controller('parent/dashboard/learning-activities')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PARENT)
@ApiTags('Parent Dashboard')
export class ParentLearningActivitiesController {
  constructor(
    private readonly learningActivitiesService: ParentLearningActivitiesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get learning activities for parents' })
  @ApiQuery({ name: 'type', enum: ContentType, required: false })
  @ApiQuery({ name: 'category', enum: ContentCategory, required: false })
  @ApiQuery({ name: 'search', required: false })
  async getLearningActivities(
    @CurrentUser() user: User,
    @Query() filterDto: FilterContentDto,
  ) {
    return this.learningActivitiesService.getLearningActivities((user as any)._id, filterDto);
  }
}
