import { 
  Body, 
  Controller, 
  Get, 
  Param, 
  Post, 
  Query, 
  UseGuards 
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ContentService } from '../services/content.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators';
import { User } from '../../schemas';
import { CreateContentDto, CreateChallengeDto, FilterContentDto, ContentType, ContentCategory } from '../dtos';
import { UserRole } from 'src/common/interfaces';

@Controller('content')
@ApiTags('Content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create new content (Super Admin only)' })
  @ApiBody({ type: CreateContentDto })
  createContent(
    @CurrentUser() user: User,
    @Body() createContentDto: CreateContentDto,
  ) {
    return this.contentService.createContent(createContentDto, (user as any)._id);
  }

  @Post('challenge')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create new student challenge (Super Admin only)' })
  @ApiBody({ type: CreateChallengeDto })
  createChallenge(
    @CurrentUser() user: User,
    @Body() createChallengeDto: CreateChallengeDto,
  ) {
    return this.contentService.createChallenge(createChallengeDto, (user as any)._id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT, UserRole.SCHOOL_ADMIN, UserRole.MENTOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get content for the current user based on their role' })
  @ApiQuery({ name: 'type', enum: ContentType, required: false })
  @ApiQuery({ name: 'category', enum: ContentCategory, required: false })
  @ApiQuery({ name: 'search', required: false })
  getContent(
    @CurrentUser() user: User,
    @Query() filterDto: FilterContentDto,
  ) {
    return this.contentService.getContentForUser((user as any)._id, filterDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT, UserRole.SCHOOL_ADMIN, UserRole.MENTOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get content by ID' })
  getContentById(
    @Param('id') id: string,
  ) {
    return this.contentService.getContentById(id);
  }

  @Get('challenges/student')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get challenges for students' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  getChallenges(
    @CurrentUser() user: User,
    @Query() filterDto: FilterContentDto,
  ) {
    return this.contentService.getChallengesForStudent((user as any)._id, filterDto);
  }

  @Get('challenges/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get challenge by ID' })
  getChallengeById(
    @Param('id') id: string,
  ) {
    return this.contentService.getChallengeById(id);
  }
}
