import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards 
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/interfaces';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { CategoryService } from '../services/category.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dtos';
import { CurrentUser } from 'src/common/decorators';
import { User } from 'src/modules/schemas';

@Controller('super-admin/categories')
@ApiTags('SUPERADMIN DASHBOARD')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category (Super Admin only)' })
  @ApiBody({ 
    type: CreateCategoryDto,
    description: 'Create a new category with name, description, and icon'
  })
  @ApiResponse({ status: 201, description: 'The category has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad request, validation error or category already exists.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden resource, only super admins can access.' })
  create(@Body() createDto: CreateCategoryDto, @CurrentUser() user: User) {
    return this.categoryService.create(createDto, (user as any)._id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Return a list of all categories.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden resource, only super admins can access.' })
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific category by ID (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Return the requested category.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden resource, only super admins can access.' })
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category (Super Admin only)' })
  @ApiBody({ 
    type: UpdateCategoryDto,
    description: 'Update a category with name, description, and/or icon'
  })
  @ApiResponse({ status: 200, description: 'The category has been successfully updated.' })
  @ApiResponse({ status: 400, description: 'Bad request, validation error or category already exists.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden resource, only super admins can access.' })
  update(
    @Param('id') id: string, 
    @Body() updateDto: UpdateCategoryDto,
    @CurrentUser() user: User
  ) {
    return this.categoryService.update(id, updateDto, (user as any)._id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'The category has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden resource, only super admins can access.' })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.categoryService.remove(id, (user as any)._id);
  }
}
