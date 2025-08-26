import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { CreateSchoolDto, UserRole } from 'src/common/interfaces';
import { SchoolOnboardingService } from '../services';
import { School } from 'src/modules/schemas/school.schema';
import { User } from 'src/modules/schemas';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators';
import { LoggerService } from 'src/common/logger/logger.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('schools')
@ApiTags('School Management')
export class SchoolController {
  constructor(
    private readonly schoolOnboardingService: SchoolOnboardingService,
    private readonly logger: LoggerService,
  ) {}

  @Post('onboard')
  @UseInterceptors(FileInterceptor('logo'))
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Onboard a new school (admin only)',
    description: 'This endpoint allows the super admin to onboard a new school. The school will be created with PENDING payment status.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'School onboarding information with optional logo upload',
    schema: {
      type: 'object',
      properties: {
        schoolName: { 
          type: 'string', 
          description: 'Name of the school',
          example: 'St. Mary International School'
        },
        schoolType: { 
          type: 'string', 
          description: 'Type of school (e.g., Primary, Secondary, International)',
          example: 'International'
        },
        schoolContactPerson: { 
          type: 'string', 
          description: 'Name of the main contact person',
          example: 'John Doe'
        },
        email: { 
          type: 'string', 
          format: 'email',
          description: 'School email address',
          example: 'admin@stmaryschool.com'
        },
        address: { 
          type: 'string', 
          description: 'Physical address of the school',
          example: '123 Education Street'
        },
        city: { 
          type: 'string', 
          description: 'City where school is located',
          example: 'Kigali'
        },
        country: { 
          type: 'string', 
          description: 'Country where school is located',
          example: 'Rwanda'
        },
        phoneNumber: { 
          type: 'string', 
          description: 'School phone number',
          example: '+250788123456'
        },
        logo: { 
          type: 'string', 
          format: 'binary',
          description: 'School logo image file (optional)'
        },
        role: { 
          type: 'string', 
          enum: ['school_admin'],
          description: 'Role for the school (defaults to school_admin)',
          example: 'school_admin'
        },
        password: { 
          type: 'string', 
          description: 'Password for school admin (optional - will be auto-generated if not provided)'
        }
      },
      required: ['schoolName', 'schoolType', 'schoolContactPerson', 'email', 'address', 'city', 'country', 'phoneNumber']
    }
  })
  @ApiResponse({
    status: 201,
    description: 'School onboarded successfully with PENDING payment status',
    type: School,
    isArray: false,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data',
    type: CreateSchoolDto,
    isArray: false,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - School with this email already exists',
    type: CreateSchoolDto,
    isArray: false,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: CreateSchoolDto,
    isArray: false,
  })
  async onboardSchool(
    @UploadedFile() logo: Express.Multer.File,
    @Body() createSchoolDto: CreateSchoolDto,
    @CurrentUser() superAdmin: User,
  ): Promise<School> {

    return this.schoolOnboardingService.onboardSchool(
      createSchoolDto,
      superAdmin,
      logo,
    );
  }

  @Get('/all')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get all schools',
    description: 'This endpoint retrieves all schools in the system.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all schools',
    type: School,
    isArray: true,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: CreateSchoolDto,
    isArray: false,
  })
  async getAllSchools(): Promise<School[]> {
    try {
      return await this.schoolOnboardingService.getAllSchools();
    } catch (error) {
      this.logger.error('Error fetching all schools', error);
      throw error;
    }
  }

  @Delete('/delete/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Delete a school',
    description: 'This endpoint allows the super admin to delete a school.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID of the school to delete',
  })
  @ApiResponse({
    status: 200,
    description: 'School deleted successfully',
    type: School,
    isArray: false,
  })
  @ApiResponse({
    status: 404,
    description: 'School not found',
    type: CreateSchoolDto,
    isArray: false,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: CreateSchoolDto,
    isArray: false,
  })
  async deleteSchool(
    @CurrentUser() superAdmin: User,
    @Param('id') schoolId: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `Deleting school with ID: ${schoolId} by super admin: ${superAdmin.email}`,
      );
      await this.schoolOnboardingService.deleteSchool(schoolId);
    } catch (error) {
      this.logger.error(
        `Error deleting school with ID: ${schoolId}`,
        error.stack,
      );
      throw error;
    }
  }
}
