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
import { SchoolResourcesService } from '../services/resources.service';
import { FilterContentDto, ContentType, ContentCategory } from 'src/modules/content/dtos';
import { User } from 'src/modules/schemas';

@Controller('school/dashboard/resources')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SCHOOL_ADMIN)
@ApiTags('School Dashboard')
export class SchoolResourcesController {
  constructor(
    private readonly resourcesService: SchoolResourcesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get resources for school admins' })
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
