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
import { ParentResourcesService } from '../services/resources.service';
import { FilterContentWithoutCategoryDto, ContentType } from 'src/modules/content/dtos';
import { User } from 'src/modules/schemas';

@Controller('parent/dashboard/parental-resources')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PARENT)
@ApiTags('Parent Dashboard')
export class ParentResourcesController {
  constructor(
    private readonly resourcesService: ParentResourcesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get parental resources for parents' })
  @ApiQuery({ name: 'type', enum: ContentType, required: false })
  @ApiQuery({ name: 'search', required: false })
  async getParentalResources(
    @CurrentUser() user: User,
    @Query() filterDto: FilterContentWithoutCategoryDto,
  ) {
    return this.resourcesService.getResources((user as any)._id, filterDto);
  }
}
