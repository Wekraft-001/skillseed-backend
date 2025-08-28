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
import { MentorLearningActivitiesService } from '../services/learning-activities.service';
import { FilterContentDto, ContentType, ContentCategory } from 'src/modules/content/dtos';
import { User } from 'src/modules/schemas';

@Controller('mentor/dashboard/learning-activities')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MENTOR)
@ApiTags('Mentor Dashboard')
export class MentorLearningActivitiesController {
  constructor(
    private readonly learningActivitiesService: MentorLearningActivitiesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get learning activities for mentors' })
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
