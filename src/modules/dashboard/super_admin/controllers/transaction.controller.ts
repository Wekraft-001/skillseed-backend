import {
  Controller,
  Post,
  Param,
  Body,
  Get,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import {
  CreateTransactionDto,
  CreateParentTransactionDto,
  RenewSchoolTransactionDto,
  UserRole,
} from 'src/common/interfaces';
import { School, User } from 'src/modules/schemas';
import { JwtAuthGuard } from 'src/modules/auth/guards';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { CurrentUser } from 'src/common/decorators';
import { SchoolOnboardingService } from '../services';
import { TransactionService } from '../services/transaction.service';
import { Transaction } from 'src/modules/schemas/transaction.schema';
import { LoggerService } from 'src/common/logger/logger.service';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';

@Controller('transactions')
@ApiTags('SUPERADMIN DASHBOARD')
export class TransactionController {
  constructor(
    private transactionService: TransactionService,
    private logger: LoggerService,
  ) {}

  @Post('add-transaction')
  @ApiOperation({ summary: 'Create transaction and activate school (admin)' })
  @ApiBody({
    description: 'Create a new transaction for a school',
    schema: {
      type: 'object',
      properties: {
        schoolName: {
          type: 'string',
          description: 'Name of the school to activate',
          example: 'St. Mary School',
        },
        amount: {
          type: 'number',
          description: 'Payment amount in RWF',
          example: 120000,
        },
        numberOfKids: {
          type: 'number',
          description: 'Number of students the school can enroll',
          example: 50,
        },
        paymentMethod: {
          type: 'string',
          enum: ['card', 'mobilemoneyrwanda'],
          description: 'Payment method used',
          example: 'mobilemoneyrwanda',
        },
        transactionType: {
          type: 'string',
          enum: ['subscription', 'tier-one', 'tier-two'],
          description: 'Type of transaction',
          example: 'subscription',
        },
        notes: {
          type: 'string',
          description: 'Additional notes about the transaction',
          example: 'Payment for Q1 2024',
        },
      },
      required: [
        'schoolName',
        'amount',
        'numberOfKids',
        'paymentMethod',
        'transactionType',
      ],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Transaction created and school activated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Transaction created successfully and school activated',
        },
        data: {
          type: 'object',
          properties: {
            transaction: { type: 'object' },
            school: { type: 'object' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({
    status: 404,
    description: 'School not found or already completed payment',
  })
  @Roles(UserRole.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async createTransaction(
    @Body() createTransactionDto: CreateTransactionDto,
    @CurrentUser() user: User,
  ): Promise<{
    success: boolean;
    message: string;
    data: { transaction: Transaction; school?: School };
  }> {
    try {
      const result =
        await this.transactionService.createTransaction(createTransactionDto);

      return {
        success: true,
        message: 'Transaction created successfully and school activated',
        data: result,
      };
    } catch (error) {
      this.logger.error('Failed to create transaction');
      throw error;
    }
  }

  @Get('all')
  @ApiOperation({ summary: 'List all transactions (both school and parent)' })
  @ApiResponse({
    status: 200,
    description: 'All transactions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        schoolName: { type: 'string' },
        amount: { type: 'number' },
        numberOfKids: { type: 'number' },
        paymentMethod: { type: 'string', enum: ['card', 'mobilemoneyrwanda'] },
        transactionType: {
          type: 'string',
          enum: [
            'subscription',
            'tier-one',
            'tier-two',
            'student-registration',
            'student-subscription',
          ],
        },
        transactionDate: { type: 'string', format: 'date-time' },
        notes: { type: 'string' },
        school: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            schoolName: { type: 'string' },
          },
        },
        parent: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
          },
        },
        student: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
          },
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async getAllTransactions() {
    try {
      return await this.transactionService.getAllTransaction();
    } catch (error) {
      this.logger.error('Failed to fetch all transactions');
      throw error;
    }
  }

  @Post('parent')
  @ApiOperation({
    summary:
      'Create a parent transaction for student registration or subscription',
  })
  @ApiBody({
    description: 'Create a new transaction for parent',
    schema: {
      type: 'object',
      properties: {
        parentId: {
          type: 'string',
          description: 'ID of the parent user',
          example: '66f1a2b3c4d5e6f7a8b9c0d1',
        },
        studentId: {
          type: 'string',
          description: 'ID of the student user',
          example: '66f1a2b3c4d5e6f7a8b9c0d2',
        },
        amount: {
          type: 'number',
          description: 'Payment amount in RWF',
          example: 50000,
        },
        paymentMethod: {
          type: 'string',
          enum: ['card', 'mobilemoneyrwanda'],
          description: 'Payment method used',
          example: 'mobilemoneyrwanda',
        },
        transactionType: {
          type: 'string',
          enum: ['student-registration', 'student-subscription'],
          description: 'Type of transaction',
          example: 'student-registration',
        },
        notes: {
          type: 'string',
          description: 'Additional notes about the transaction',
          example: 'Student registration fee for 2024',
        },
      },
      required: [
        'parentId',
        'studentId',
        'amount',
        'paymentMethod',
        'transactionType',
      ],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Parent transaction created successfully',
        },
        data: {
          type: 'object',
          properties: {
            transaction: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                amount: { type: 'number' },
                paymentMethod: { type: 'string' },
                transactionType: { type: 'string' },
                transactionDate: { type: 'string', format: 'date-time' },
                notes: { type: 'string' },
                parent: {
                  type: 'object',
                  properties: {
                    _id: { type: 'string' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    email: { type: 'string' },
                  },
                },
                student: {
                  type: 'object',
                  properties: {
                    _id: { type: 'string' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    email: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 404, description: 'Parent or student not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async createParentTransaction(
    @Body() createTransactionDto: CreateParentTransactionDto,
  ): Promise<{
    success: boolean;
    message: string;
    data: { transaction: Transaction };
  }> {
    try {
      const result =
        await this.transactionService.createParentTransaction(
          createTransactionDto,
        );

      return {
        success: true,
        message: 'Parent transaction created successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error('Failed to create parent transaction');
      throw error;
    }
  }

  @Get('pending-schools')
  @ApiOperation({ summary: 'List schools pending payment' })
  @ApiResponse({
    status: 200,
    description: 'Pending schools retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Pending Schools retrieved successfully',
        },
        data: { type: 'array', items: { type: 'object' } },
      },
    },
  })
  @Roles(UserRole.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getPendingSchools(): Promise<{
    success: boolean;
    message: string;
    data: School[];
  }> {
    try {
      const pendingSchools = await this.transactionService.getPendingSchools();

      return {
        success: true,
        message: 'Pending Schools retrieved successfully',
        data: pendingSchools,
      };
    } catch (error) {
      this.logger.error('Failed retrieving pending schools');
      throw error;
    }
  }

  @Put('renew')
  @ApiOperation({ summary: 'Renew payment for a school (admin)' })
  @ApiBody({
    description: 'Renew a school payment',
    schema: {
      type: 'object',
      properties: {
        schoolId: {
          type: 'string',
          description: 'ID of the school to renew',
          example: '66f1a2b3c4d5e6f7a8b9c0d1',
        },
        amount: {
          type: 'number',
          description: 'Payment amount in RWF',
          example: 120000,
        },
        numberOfKids: {
          type: 'number',
          description: 'Number of students the school can enroll',
          example: 50,
        },
        paymentMethod: {
          type: 'string',
          enum: ['card', 'mobilemoneyrwanda'],
          description: 'Payment method used',
          example: 'mobilemoneyrwanda',
        },
        transactionType: {
          type: 'string',
          enum: ['subscription', 'tier-one', 'tier-two'],
          description: 'Type of transaction',
          example: 'subscription',
        },
        notes: {
          type: 'string',
          description: 'Additional notes about the renewal',
          example: 'Renewed for Q2 2024',
        },
      },
      required: ['schoolId', 'amount', 'numberOfKids', 'paymentMethod'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'School payment renewed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'School payment renewed successfully',
        },
        data: {
          type: 'object',
          properties: {
            transaction: { type: 'object' },
            school: { type: 'object' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'School not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async renewSchool(@Body() dto: RenewSchoolTransactionDto): Promise<{
    success: boolean;
    message: string;
    data: { transaction: Transaction; school: School };
  }> {
    try {
      const result = await this.transactionService.renewSchoolTransaction({
        schoolId: dto.schoolId,
        amount: dto.amount,
        numberOfKids: dto.numberOfKids,
        paymentMethod: dto.paymentMethod,
        transactionType: dto.transactionType,
        notes: dto.notes,
      });
      return {
        success: true,
        message: 'School payment renewed successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error('Failed to renew school payment');
      throw error;
    }
  }
}
