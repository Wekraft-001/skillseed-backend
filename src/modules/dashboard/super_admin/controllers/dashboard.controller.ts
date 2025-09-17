import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { DashboardData, UserRole } from 'src/common/interfaces';
import { DashboardService } from '../services/dashboard.service';
import { JwtAuthGuard } from '../../../auth/guards';
import { CurrentUser } from 'src/common/decorators';
import { LoggerService } from 'src/common/logger/logger.service';
import { User } from '../../../schemas';
import { ApiResponseDto } from 'src/common/interfaces/api-response.dto';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';

@Controller('dashboard')
@ApiTags('SUPERADMIN DASHBOARD')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly logger: LoggerService,
  ) {}

  @Get('get-data')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Get dashboard data',
    description:
      'Returns dashboard data based on user role(student, mentor, parent, shool_admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access, Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden access-User role not authorized for this operation',
  })
  @Roles(
    UserRole.STUDENT,
    UserRole.PARENT,
    UserRole.MENTOR,
    UserRole.SCHOOL_ADMIN,
    UserRole.SUPER_ADMIN,
  )
  async getDashboard(@CurrentUser() user: User) {
    this.logger.log(
      `Dashboard request from user: ${user._id} with role: ${user.role}`,
    );

    try {
      return await this.dashboardService.getDashboardData(user);
    } catch (error) {
      this.logger.error(
        `Error retrieving dashboard data for user: ${user._id}`,
        error,
      );
      throw error;
    }
  }


  @Post('create-category')
  @ApiOperation({ summary: 'Create a new category (Super Admin only)' })
  @ApiBody({
    type: CreateCategoryDto,
    description: 'Create a new category with name, description, and icon',
  })
  @ApiResponse({
    status: 201,
    description: 'The category has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request, validation error or category already exists.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden resource, only super admins can access.',
  })
  create(@Body() createDto: CreateCategoryDto, @CurrentUser() user: User) {
    return this.dashboardService.create(createDto, (user as any)._id);
  }

  @Get('all-categories')
  @ApiOperation({ summary: 'Get all categories (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Return a list of all categories.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden resource, only super admins can access.',
  })
  findAll() {
    return this.dashboardService.findAll();
  }

  @Get('category/:id')
  @ApiOperation({ summary: 'Get a specific category by ID (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Return the requested category.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden resource, only super admins can access.',
  })
  findOne(@Param('id') id: string) {
    return this.dashboardService.findOne(id);
  }

  @Patch('category/:id')
  @ApiOperation({ summary: 'Update a category (Super Admin only)' })
  @ApiBody({
    type: UpdateCategoryDto,
    description: 'Update a category with name, description, and/or icon',
  })
  @ApiResponse({
    status: 200,
    description: 'The category has been successfully updated.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request, validation error or category already exists.',
  })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden resource, only super admins can access.',
  })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCategoryDto,
    @CurrentUser() user: User,
  ) {
    return this.dashboardService.update(id, updateDto, (user as any)._id);
  }

  @Delete('category/:id')
  @ApiOperation({ summary: 'Delete a category (Super Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'The category has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden resource, only super admins can access.',
  })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.dashboardService.remove(id, (user as any)._id);
  }
}
