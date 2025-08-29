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
import { MentorResourcesService } from '../services/resources.service';
import { FilterContentDto, ContentType, ContentCategory } from 'src/modules/content/dtos';
import { User } from 'src/modules/schemas';

@Controller('mentor/dashboard/resources')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MENTOR)
@ApiTags('Mentor Dashboard')
export class MentorResourcesController {
  constructor(
    private readonly resourcesService: MentorResourcesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get resources for mentors (formerly learning activities)' })
  @ApiQuery({ name: 'type', enum: ContentType, required: false })
  @ApiQuery({ name: 'category', enum: ContentCategory, required: false })
  @ApiQuery({ name: 'search', required: false })
  async getResources(
    @CurrentUser() user: User,
    @Query() filterDto: FilterContentDto,
  ) {
    return this.resourcesService.getResources((user as any)._id, filterDto);
  }
}
