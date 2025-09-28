import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Param,
  Body,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/interfaces';
import { CurrentUser } from 'src/common/decorators';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { StudentChallengesService } from '../services/challenges.service';
import { CompletedChallengesService } from '../services/completed-challenges.service';
import { FilterContentDto, ChallengeType } from 'src/modules/content/dtos';
import { User } from 'src/modules/schemas';
import { RewardsService } from 'src/modules/rewards/rewards.service';

@Controller('student/dashboard/challenges')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
@ApiTags('STUDENT DASHBOARD')
export class StudentChallengesController {
  constructor(
    private readonly challengesService: StudentChallengesService,
    private readonly completedChallengesService: CompletedChallengesService,
    private readonly rewardsService: RewardsService,
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
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.challengesService.getChallengeById(id, (user as any)._id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark a challenge as completed and earn a badge' })
  async completeChallenge(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.completedChallengesService.completeChallenge((user as any)._id, id);
  }
}
