import { Injectable, NotFoundException } from '@nestjs/common';
import { Transaction } from 'src/modules/schemas/transaction.schema';
import { ClientSession, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { LoggerService } from 'src/common/logger/logger.service';
import {
  CreateTransactionDto,
  CreateParentTransactionDto,
  PaymentStatus,
  transactionType,
} from 'src/common/interfaces';
import { School, User } from 'src/modules/schemas';
import { EmailService } from 'src/common/utils/mailing/email.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class TransactionService {
  constructor(
    private logger: LoggerService,
    @InjectModel(School.name) private schoolModel: Model<School>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
    private readonly redisService: RedisService,
    private emailService: EmailService,
  ) {}

  async createParentTransaction(
    createTransactionDto: CreateParentTransactionDto,
  ): Promise<{ transaction: Transaction }> {
    const session: ClientSession = await this.userModel.db.startSession();
    let committed = false;

    try {
      session.startTransaction();

      const [parent, student] = await Promise.all([
        this.userModel
          .findById(createTransactionDto.parentId)
          .session(session)
          .exec(),
        this.userModel
          .findById(createTransactionDto.studentId)
          .session(session)
          .exec(),
      ]);

      if (!parent) {
        throw new NotFoundException('Parent not found');
      }

      if (!student) {
        throw new NotFoundException('Student not found');
      }

      if (student.parentEmail !== parent.email) {
        throw new NotFoundException('Student not associated with this parent');
      }

      const newTransaction = new this.transactionModel({
        amount: createTransactionDto.amount,
        paymentMethod: createTransactionDto.paymentMethod,
        transactionType: createTransactionDto.transactionType,
        transactionDate: new Date(),
        notes: createTransactionDto.notes,
        parent: parent._id,
        student: student._id,
      });

      await newTransaction.save({ session });
      await session.commitTransaction();
      committed = true;

      this.logger.log(
        `Parent transaction created: Parent ${parent.firstName} ${parent.lastName} - Student ${student.firstName} ${student.lastName} - Amount: ${newTransaction.amount}`,
      );

      const populatedTransaction = await this.transactionModel
        .findById(newTransaction._id)
        .populate('parent student')
        .exec();

      return {
        transaction: populatedTransaction,
      };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error('Error creating parent transaction', error);
      throw error;
    } finally {
      if (!committed) {
        await session.abortTransaction();
      }
      session.endSession();
    }
  }

  async createTransaction(
    createTransactionDto: CreateTransactionDto,
  ): Promise<{ transaction: Transaction; school?: School }> {
    const session: ClientSession = await this.schoolModel.db.startSession();
    let committed = false;

    try {
      session.startTransaction();

      const school = await this.schoolModel
        .findOne({
          schoolName: createTransactionDto.schoolName,
          status: PaymentStatus.PENDING,
        })
        .session(session);

      if (!school) {
        throw new NotFoundException(
          'School not found or already completed payment',
        );
      }

      const newTransaction = new this.transactionModel({
        schoolName: createTransactionDto.schoolName,
        amount: createTransactionDto.amount,
        paymentMethod: createTransactionDto.paymentMethod,
        numberOfKids: createTransactionDto.numberOfKids,
        transactionType: createTransactionDto.transactionType,
        transactionDate: new Date(),
        Notes: createTransactionDto.notes,
        school: school._id,
      });

      await newTransaction.save({ session });

      school.status = PaymentStatus.COMPLETED;
      school.studentsLimit = newTransaction.numberOfKids;
      school.transactions.push(newTransaction._id);
      await school.save({ session });

      await session.commitTransaction();
      committed = true;

      const tempPassword = await this.getTemporaryPassword(
        school._id.toString(),
      );

      if (!tempPassword) {
        this.logger.error(
          `Temporary password not found for school: ${school._id}`,
        );
        throw new Error('Temporary password not found');
      }

      await this.emailService.sendSchoolOnboardingEmail(
        school.email,
        tempPassword,
      );

      await this.cleanupTemporaryPassword(school._id.toString());

      this.logger.log(
        `Transaction created and school activated: ${school.schoolName} - Amount: ${newTransaction.amount}`,
      );

      const populatedSchool = await this.schoolModel
        .findById(school._id)
        .populate('createdBy students transactions')
        .exec();

      return {
        transaction: newTransaction,
        school: populatedSchool,
      };
    } catch (error) {
      if (!committed) {
        await session.abortTransaction();
      }
      this.logger.error('Error creating transaction', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getAllTransaction() {
    try {
      return await this.transactionModel
        .find()
        .populate('school parent student')
        .exec();
    } catch (error) {
      this.logger.error('Failed to fetch all transactions');
      throw error;
    }
  }

  private async getTemporaryPassword(schoolId: string): Promise<string> {
    try {
      const key = `temp_password_${schoolId}`;
      const password = await this.redisService.get(key);

      if (!password) {
        this.logger.warn(
          `Temporary password not found or expired for school ${schoolId}`,
        );
        return null;
      }

      this.logger.log(`Temporary password retrieved for school ${schoolId}`);
      return password;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve temporary password for school ${schoolId}:`,
        error,
      );
      throw new Error('Failed to retrieve temporary password');
    }
  }

  private async cleanupTemporaryPassword(schoolId: string): Promise<void> {
    try {
      const key = `temp_password_${schoolId}`;
      const deleted = await this.redisService.del(key);

      if (deleted > 0) {
        this.logger.log(`Temporary password cleaned up for school ${schoolId}`);
      } else {
        this.logger.warn(
          `No temporary password found to cleanup for school ${schoolId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to cleanup temporary password for school ${schoolId}:`,
        error,
      );
    }
  }

  async getPendingSchools(): Promise<School[]> {
    return await this.schoolModel
      .find({ status: PaymentStatus.PENDING })
      .populate('createdBy superAdmin')
      .exec();
  }

  async renewSchoolTransaction(dto: {
    schoolId: string;
    amount: number;
    numberOfKids: number;
    paymentMethod: string;
    transactionType?: string;
    notes?: string;
  }) {
    const session: ClientSession = await this.schoolModel.db.startSession();
    try {
      session.startTransaction();
      const school = await this.schoolModel
        .findById(dto.schoolId)
        .session(session);
      if (!school) {
        throw new NotFoundException('School not found');
      }

      const newTransaction = new this.transactionModel({
        schoolName: school.schoolName,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        numberOfKids: dto.numberOfKids,
        transactionType: dto.transactionType || transactionType.SUBSCRIPTION,
        transactionDate: new Date(),
        notes: dto.notes,
        school: school._id,
      });

      await newTransaction.save({ session });

      school.status = PaymentStatus.COMPLETED;
      school.studentsLimit = dto.numberOfKids;
      school.transactions.push(newTransaction._id);
      await school.save({ session });

      await session.commitTransaction();
      return { transaction: newTransaction, school };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error('Error renewing school transaction', error);
      throw error;
    } finally {
      session.endSession();
    }
  }
}
