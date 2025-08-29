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
import { SchoolContentService } from '../services/content.service';
import { FilterContentDto, ContentType, ContentCategory } from 'src/modules/content/dtos';
import { User } from 'src/modules/schemas';

@Controller('school/dashboard/content')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SCHOOL_ADMIN)
@ApiTags('School Dashboard')
export class SchoolContentController {
  constructor(
    private readonly contentService: SchoolContentService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get content uploaded by admin for schools' })
  @ApiQuery({ name: 'type', enum: ContentType, required: false })
  @ApiQuery({ name: 'category', enum: ContentCategory, required: false })
  @ApiQuery({ name: 'search', required: false })
  async getContent(
    @CurrentUser() user: User,
    @Query() filterDto: FilterContentDto,
  ) {
    return this.contentService.getContent((user as any)._id, filterDto);
  }
}
