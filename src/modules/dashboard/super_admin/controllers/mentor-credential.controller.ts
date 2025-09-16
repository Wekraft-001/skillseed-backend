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
import { AuthGuard } from '@nestjs/passport';
import { 
  ApiConsumes,
  ApiOperation, 
  ApiParam, 
  ApiQuery, 
  ApiResponse, 
  ApiTags 
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from 'src/common/decorators';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole, VerifyCredentialDto } from 'src/common/interfaces';
import { LoggerService } from 'src/common/logger/logger.service';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { User } from 'src/modules/schemas';
import { MentorCredentialService } from '../services/mentor-credential.service';

@Controller('admin/mentor-credentials')
@ApiTags('MENTOR DASHBOARD')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class MentorCredentialController {
  constructor(
    private readonly mentorCredentialService: MentorCredentialService,
    private readonly logger: LoggerService,
  ) {}

  @Get()
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
  
  @Post('upload/:mentorId/:type')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload mentor credential',
    description: 'Upload a credential document for a mentor',
  })
  @ApiParam({
    name: 'mentorId',
    description: 'ID of the mentor',
    type: String,
  })
  @ApiParam({
    name: 'type',
    description: 'Type of credential (government_id or professional_credentials)',
    enum: ['government_id', 'professional_credentials'],
    type: String,
  })
  async uploadCredential(
    @Param('mentorId') mentorId: string,
    @Param('type') type: 'government_id' | 'professional_credentials',
    @UploadedFile() file: Express.Multer.File,
    @Body('description') description?: string,
  ) {
    try {
      return this.mentorCredentialService.uploadCredential(
        mentorId,
        type,
        file,
        description,
      );
    } catch (error) {
      this.logger.error(`Error uploading credential for mentor ${mentorId}`, error);
      throw error;
    }
  }

  @Get(':mentorId')
  @ApiOperation({
    summary: 'Get mentor credentials',
    description: 'Get all credentials for a specific mentor',
  })
  @ApiParam({
    name: 'mentorId',
    description: 'ID of the mentor',
    type: String,
  })
  async getCredentialsForMentor(@Param('mentorId') mentorId: string) {
    try {
      return this.mentorCredentialService.getCredentialsForMentor(mentorId);
    } catch (error) {
      this.logger.error(`Error fetching credentials for mentor ${mentorId}`, error);
      throw error;
    }
  }
}
