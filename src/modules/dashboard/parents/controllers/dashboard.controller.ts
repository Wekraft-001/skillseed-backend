import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  Get,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ParentDashboardService } from '../services/dashboard.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateSubscriptionDto, UserRole } from 'src/common/interfaces';
import { CreateStudentDto, TempStudentDataDto } from 'src/modules/auth/dtos';
import { FileInterceptor } from '@nestjs/platform-express';
import { LoggerService } from 'src/common/logger/logger.service';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/modules/schemas';
import { Model } from 'mongoose';
import { CurrentUser } from 'src/common/decorators';
import {
  ApiBadRequestResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@Controller('parent/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PARENT)
export class ParentDashboardController {
  constructor(
    private readonly parentDashboardService: ParentDashboardService,
    private readonly logger: LoggerService,

    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  @Get()
  async getDashboard(@Request() req) {
    const currentUser = req.user;
    return this.parentDashboardService.getDashboardData(currentUser);
  }

  @ApiOperation({
    summary:
      'Initiate child registration (parent) - create draft and store securely',
  })
  @Post('students/initiate')
  @UseInterceptors(FileInterceptor('image'))
  async initiateStudent(
    @UploadedFile() image: Express.Multer.File,
    @Body() body: TempStudentDataDto,
    @CurrentUser() user: User,
  ) {
    return this.parentDashboardService.initiateStudentRegistration(
      body,
      user,
      image,
    );
  }

  @ApiOperation({
    summary: 'Generate payment link for child registration (parent)',
  })
  @Post('students/:childTempId/payment-link')
  async generatePaymentLink(
    @Param('childTempId') childTempId: string,
    @Body() subscriptionData: CreateSubscriptionDto,
    @CurrentUser() user: User,
  ) {
    return this.parentDashboardService.completeStudentRegistration(
      childTempId,
      subscriptionData,
      user,
      subscriptionData.payment_options,
    );
  }

  @ApiOperation({
    summary: 'Finalize child registration after payment (parent)',
  })
  @Post('students/:childTempId/finalize')
  async finalizeStudent(
    @Param('childTempId') childTempId: string,
    @CurrentUser() user: User,
  ) {
    const temp =
      await this.parentDashboardService.getTempStudentData(childTempId);
    if (!temp) {
      throw new Error('Temporary student data not found');
    }
    return this.parentDashboardService.registerFinalStudent(temp as any, user);
  }

  @Get('student')
  @HttpCode(HttpStatus.OK)
  async getStudent(@Request() req) {
    const user = req.user;
    try {
      this.logger.log(`Fetching student for user: ${user.email}`);
      return await this.parentDashboardService.getStudentForUser(user);
    } catch (error) {
      this.logger.error(`Error fetching student for user: ${user._id}`, error);
      throw error;
    }
  }
}
