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
import { ChallengeCategoryService } from '../services/challenge-category.service';
import { CreateChallengeCategoryDto, UpdateChallengeCategoryDto } from '../dtos';
import { CurrentUser } from 'src/common/decorators';
import { User } from 'src/modules/schemas';

@Controller('challenge-categories')
@ApiTags('Challenge Categories')
export class ChallengeCategoryController {
  constructor(private readonly challengeCategoryService: ChallengeCategoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new challenge category (Super Admin only)' })
  @ApiBody({ 
    type: CreateChallengeCategoryDto,
    description: 'Create a new challenge category with name, description, icon, and color theme'
  })
  @ApiResponse({ status: 201, description: 'The challenge category has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad request, validation error or category already exists.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden resource, only super admins can access.' })
  create(@Body() createDto: CreateChallengeCategoryDto, @CurrentUser() user: User) {
    return this.challengeCategoryService.create(createDto, (user as any)._id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all challenge categories' })
  @ApiResponse({ status: 200, description: 'Return a list of all challenge categories.' })
  findAll() {
    return this.challengeCategoryService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific challenge category by ID' })
  @ApiResponse({ status: 200, description: 'Return the challenge category.' })
  @ApiResponse({ status: 404, description: 'Challenge category not found.' })
  findOne(@Param('id') id: string) {
    return this.challengeCategoryService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a challenge category (Super Admin only)' })
  @ApiBody({ 
    type: UpdateChallengeCategoryDto,
    description: 'Update a challenge category with name, description, icon, and color theme'
  })
  @ApiResponse({ status: 200, description: 'The challenge category has been successfully updated.' })
  @ApiResponse({ status: 400, description: 'Bad request, validation error or category name already exists.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden resource, only super admins can access.' })
  @ApiResponse({ status: 404, description: 'Challenge category not found.' })
  update(
    @Param('id') id: string, 
    @Body() updateDto: UpdateChallengeCategoryDto,
    @CurrentUser() user: User
  ) {
    return this.challengeCategoryService.update(id, updateDto, (user as any)._id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a challenge category (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'The challenge category has been successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden resource, only super admins can access.' })
  @ApiResponse({ status: 404, description: 'Challenge category not found.' })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.challengeCategoryService.remove(id, (user as any)._id);
  }
}
