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
import { FilterContentWithoutCategoryDto, ContentType } from 'src/modules/content/dtos';
import { User } from 'src/modules/schemas';

@Controller('parent/dashboard/learning-activities')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PARENT)
@ApiTags('PARENT DASHBOARD')
export class ParentLearningActivitiesController {
  constructor(
    private readonly learningActivitiesService: ParentLearningActivitiesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get learning activities for parents' })
  @ApiQuery({ name: 'type', enum: ContentType, required: false })
  @ApiQuery({ name: 'search', required: false })
  async getLearningActivities(
    @CurrentUser() user: User,
    @Query() filterDto: FilterContentWithoutCategoryDto,
  ) {
    return this.learningActivitiesService.getLearningActivities((user as any)._id, filterDto);
  }
}
