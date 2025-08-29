import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/interfaces';
import { CurrentUser } from 'src/common/decorators';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { StudentChallengesService } from '../services/challenges.service';
import { FilterContentDto, ChallengeType } from 'src/modules/content/dtos';
import { User } from 'src/modules/schemas';

@Controller('student/dashboard/challenges')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
@ApiTags('Student Dashboard')
export class StudentChallengesController {
  constructor(
    private readonly challengesService: StudentChallengesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get challenges for students' })
  @ApiQuery({ name: 'type', enum: ChallengeType, required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  async getChallenges(
    @CurrentUser() user: User,
    @Query() filterDto: FilterContentDto,
  ) {
    return this.challengesService.getChallenges((user as any)._id, filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get challenge details by ID' })
  async getChallengeById(
    @Param('id') id: string,
  ) {
    return this.challengesService.getChallengeById(id);
  }
}
