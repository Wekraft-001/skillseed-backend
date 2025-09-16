import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { MentorCredentialService } from '../services/mentor-credential.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole, VerifyCredentialDto } from 'src/common/interfaces';
import { CurrentUser } from 'src/common/decorators';
import { User } from 'src/modules/schemas';
import { LoggerService } from 'src/common/logger/logger.service';
import { uploadToAzureStorage } from 'src/common/utils/azure-upload.util';

@Controller('mentor-credentials')
@ApiTags('MENTOR DASHBOARD')
export class MentorCredentialController {
  constructor(
    private readonly mentorCredentialService: MentorCredentialService,
    private readonly logger: LoggerService,
  ) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all mentor credentials' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'approved', 'rejected'],
    description: 'Filter credentials by status',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns all mentor credentials or filtered by status',
  })
  async getCredentials(@Query('status') status?: 'pending' | 'approved' | 'rejected') {
    try {
      if (status) {
        return this.mentorCredentialService.getCredentialsByStatus(status);
      }
      return this.mentorCredentialService.getAllCredentials();
    } catch (error) {
      this.logger.error('Error fetching mentor credentials', error);
      throw error;
    }
  }

  @Get('pending')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get pending mentor credentials' })
  @ApiResponse({
    status: 200,
    description: 'Returns pending mentor credentials',
  })
  async getPendingCredentials() {
    try {
      return this.mentorCredentialService.getPendingCredentials();
    } catch (error) {
      this.logger.error('Error fetching pending mentor credentials', error);
      throw error;
    }
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MENTOR)
  @ApiOperation({ summary: 'Get mentor credential by ID' })
  @ApiParam({ name: 'id', description: 'Credential ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the credential details',
  })
  @ApiResponse({
    status: 404,
    description: 'Credential not found',
  })
  async getCredentialById(@Param('id') id: string) {
    try {
      return this.mentorCredentialService.getCredentialById(id);
    } catch (error) {
      this.logger.error(`Error fetching mentor credential: ${id}`, error);
      throw error;
    }
  }

  @Patch(':id/verify')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Verify mentor credential (approve/reject)' })
  @ApiParam({ name: 'id', description: 'Credential ID' })
  @ApiResponse({
    status: 200,
    description: 'Credential verification updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Credential not found',
  })
  async verifyCredential(
    @Param('id') id: string,
    @Body() verifyDto: VerifyCredentialDto,
    @CurrentUser() admin: User,
  ) {
    try {
      this.logger.log(`Admin ${admin.email} is verifying credential ${id} with status: ${verifyDto.status}`);
      return this.mentorCredentialService.verifyCredential(id, verifyDto, admin);
    } catch (error) {
      this.logger.error(`Error verifying mentor credential: ${id}`, error);
      throw error;
    }
  }
}
