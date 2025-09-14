import { 
  Controller, 
  Get, 
  UseGuards 
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CategoryService } from '../services/category.service';

@Controller('super-admin/categories/public')
@ApiTags('Categories - Public')
export class CategoryPublicController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories (public)' })
  @ApiResponse({ status: 200, description: 'Return a list of all categories.' })
  findAll() {
    return this.categoryService.findAll();
  }
}
