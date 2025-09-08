import {
  BadRequestException,
  NotFoundException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { LoggerService } from 'src/common/logger/logger.service';
import {
  CreateSubscriptionDto,
  CustomerDataDto,
  DashboardResponse,
  DashboardSummary,
  PaymentMethod,
  SubscriptionStatus,
  UserRole,
  PaymentStatus,
  transactionType,
} from 'src/common/interfaces';
import { School, User } from '../../../schemas/index';
import { CreateStudentDto, TempStudentDataDto } from 'src/modules/auth/dtos';
import { uploadToAzureStorage } from 'src/common/utils/azure-upload.util';
import { Subscription } from 'rxjs';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { SubscriptionDocument } from 'src/modules/schemas/subscription.schema';
import { v4 as uuidv4 } from 'uuid';
import { TempStudent } from 'src/modules/schemas/temp-student.schema';
import { Transaction } from 'src/modules/schemas/transaction.schema';

@Injectable()
export class ParentDashboardService {
  aiService: any;

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(School.name) private readonly schoolModel: Model<School>,
    private readonly logger: LoggerService,

    private readonly subscriptionService: SubscriptionService,
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(TempStudent.name) private tempStudentModel: Model<TempStudent>,
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
  ) {}

  async getDashboardData(user: User): Promise<{
    dashboardResponse: DashboardResponse;
    // summary?: DashboardSummary;
    // currentUser: User;
  }> {
    try {
      this.logger.log(
        `Fetching dashboard data for user: ${user._id} with role: ${user.role}`,
      );

      const dashboardResponse: DashboardResponse = {
        success: true,
        message: 'Dashboard data retrieved successfully',
        timestamp: new Date().toISOString(),
        userId: String(user._id),
        currentUser: user,
      };

      return {
        dashboardResponse,
        // currentUser: user,
      };
    } catch (error) {
      this.logger.error(
        `Error fetching dashboard data for user: ${user._id}`,
        error,
      );
      throw error;
    }
  }

  async initiateStudentRegistration(
    createStudentDto: CreateStudentDto,
    currentUser: User,
    image?: Express.Multer.File,
  ) {
    if (currentUser.role !== UserRole.PARENT) {
      throw new BadRequestException('Only parents can use this route.');
    }

    const childTempId = `student-${uuidv4()}`;
    const imageUrl = image ? await uploadToAzureStorage(image) : '';
    const hashedPassword = await bcrypt.hash(createStudentDto.password, 10);

    const tempStudentData = new this.tempStudentModel({
      ...createStudentDto,
      childTempId,
      imageUrl,
      password: hashedPassword,
      paymentUrl: `/parent/dashboard/complete-student-registration/${childTempId}`,
    });

    await tempStudentData.save();

    return {
      tempData: tempStudentData,
      message:
        'Student draft data collected. Complete payment to finish student registration.',
    };
  }

  async completeStudentRegistration(
    childTempId: string,
    subscriptionData: CreateSubscriptionDto,
    currentUser: User,
    paymentMethod: PaymentMethod,
  ) {
    const tempStudentData = await this.getTempStudentData(childTempId);
    if (!tempStudentData) {
      throw new NotFoundException('Temporary student data not found.');
    }

    // delete this.tempStudentsStorage[childTempId];
    this.logger.log(
      `First attempt to check  Student tempt data $$$$$$$--- ${tempStudentData}`,
    );

    const session = await this.userModel.db.startSession();
    session.startTransaction();

    try {
      let createChildPayment;

      if (paymentMethod === PaymentMethod.CREDIT_CARD) {
        createChildPayment =
          await this.subscriptionService.createSubscriptionWithCardPayment(
            currentUser._id.toString(),
            {
              amount: subscriptionData.amount,
              currency: subscriptionData.currency || 'RWF',
              redirect_url: subscriptionData.redirect_url,
              childTempId: tempStudentData.childTempId,
              payment_options: subscriptionData.payment_options,
            },
          );
      } else if (paymentMethod === PaymentMethod.MOBILE_MONEY) {
        createChildPayment =
          await this.subscriptionService.createSubscriptionWithMobileMoney(
            currentUser._id.toString(),
            {
              amount: subscriptionData.amount,
              currency: subscriptionData.currency || 'RWF',
              redirect_url: subscriptionData.redirect_url,
              childTempId: tempStudentData.childTempId,
              payment_options: subscriptionData.payment_options,
            },
          );
      } else {
        throw new BadRequestException('Unsupported payment method');
      }

      if (!createChildPayment.authorizationUrl) {
        throw new NotFoundException(
          'Payment link not found. Please try again.',
        );
      }

      // await this.subscriptionService.incrementChildrenCount(currentUser);

      await session.commitTransaction();
      session.endSession();

      return {
        message: `${paymentMethod} payment link generated successfully`,
        paymentLink: createChildPayment.authorizationUrl,
        childTempId: tempStudentData.childTempId,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async getTempStudentData(childTempId: string): Promise<TempStudent | null> {
    return await this.tempStudentModel.findOne({ childTempId });
  }

  // async registerFinalStudent(
  //   tempStudentData: TempStudentDataDto,
  //   user: User,
  //   // subscription: SubscriptionDocument,
  // ) {
  //   const subscription = await this.subscriptionModel.findOne({
  //     user: user._id.toString(),
  //     childTempId: tempStudentData.childTempId,
  //     status: SubscriptionStatus.ACTIVE,
  //     isActive: true,
  //     child: null,
  //   });

  //   if (!subscription) {
  //     throw new BadRequestException('Subscription not found or already linked');
  //   }

  //   if (subscription.endDate < new Date()) {
  //     this.logger.error(
  //       `Subscription ${subscription._id} has already expired. Cannot register student.`,
  //     );
  //   }

  //   const student = new this.userModel({
  //     firstName: tempStudentData.firstName,
  //     lastName: tempStudentData.lastName,
  //     grade: tempStudentData.grade,
  //     age: tempStudentData.age,
  //     password: tempStudentData.password,
  //     role: UserRole.STUDENT,
  //     imageUrl: tempStudentData.imageUrl,
  //     parent: user._id,
  //     subscription: subscription._id,
  //     createdBy: subscription.user,
  //   });

  //   subscription.child = new Types.ObjectId(student._id.toString());

  //   if (subscription.child) {
  //     this.logger.log(
  //       `Child ${student._id} linked to subscription >>>> ${subscription._id}`,
  //     );
  //   }

  //   // Generate initial career quiz for student
  //   try {
  //     const ageRange = this.calculateAgeRange(student.age);
  //     const quiz = await this.aiService.generateCareerQuizForUserId(student._id, ageRange);
  //     student.initialQuizId = quiz._id;
  //     this.logger.log(
  //       `Generated initial career quiz ${quiz._id} for student ${student._id}`,
  //     );
  //   } catch (error) {
  //     this.logger.error(
  //       `Failed to generate initial quiz for student ${student._id}: ${error.message}`,
  //     );
  //     // Don't fail registration if quiz generation fails
  //   }

  //   await student.save();
  //   this.logger.log(`Student registered successfully: >>> ${student}`);
  //   const populatedStudent = await this.userModel
  //     .findById(student._id)
  //     .populate('subscription')
  //     .lean();
  //   return populatedStudent;
  // }

  async registerFinalStudent(
    tempStudentData: TempStudentDataDto,
    user: User,
    // subscription: SubscriptionDocument,
  ) {
    this.logger.log(
      `Looking for subscription with childTempId: ${tempStudentData.childTempId} and user: ${user._id}`,
    );

    const subscription = await this.subscriptionModel
      .findOne({
        user: user._id,
        childTempId: tempStudentData.childTempId,
        child: null,
      })
      .exec();

    this.logger.log(
      `Found subscription: ${JSON.stringify({
        id: subscription?._id,
        status: subscription?.status,
        paymentStatus: subscription?.paymentStatus,
        isActive: subscription?.isActive,
      })}`,
    );

    // Check subscription status
    if (!subscription) {
      throw new BadRequestException(
        'No subscription found for this student registration',
      );
    }

    if (subscription.paymentStatus !== PaymentStatus.COMPLETED) {
      throw new BadRequestException(
        'Payment not completed. Please complete payment before finalizing registration',
      );
    }

    if (!subscription.isActive) {
      throw new BadRequestException(
        'Subscription is not active. Please contact support if you have completed payment',
      );
    }

    if (!subscription) {
      throw new BadRequestException('Subscription not found or already linked');
    }

    if (subscription.endDate < new Date()) {
      this.logger.error(
        `Subscription ${subscription._id} has already expired. Cannot register student.`,
      );
    }

    //Create permanent student record
    const student = new this.userModel({
      firstName: tempStudentData.firstName,
      lastName: tempStudentData.lastName,
      grade: tempStudentData.grade,
      age: tempStudentData.age,
      password: tempStudentData.password,
      role: UserRole.STUDENT,
      image: tempStudentData.imageUrl,
      parent: user._id,
      subscription: subscription._id,
      createdBy: subscription.user,
    });

    //Link student to subscription
    subscription.child = new Types.ObjectId(student._id.toString());

    if (subscription.child) {
      this.logger.log(
        `Child ${student._id} linked to subscription >>>> ${subscription._id}`,
      );
    }

    // Generate initial career quiz for student
    try {
      const ageRange = this.calculateAgeRange(student.age);
      const quiz = await this.aiService.generateCareerQuizForUserId(
        student._id,
        ageRange,
      );
      student.initialQuizId = quiz._id;
      this.logger.log(
        `Generated initial career quiz ${quiz._id} for student ${student._id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate initial quiz for student ${student._id}: ${error.message}`,
      );
      // Don't fail registration if quiz generation fails
    }

    await student.save();
    this.logger.log(`Student registered successfully: >>> ${student}`);

    // Check if a transaction already exists for this subscription
    const existingTransaction = await this.transactionModel.findOne({
      transactionType: transactionType.STUDENT_REGISTRATION,
      parent: user._id,
      student: student._id,
    });

    // Only create a transaction if one doesn't already exist
    if (!existingTransaction) {
      // Create a transaction record for the registration
      const transaction = new this.transactionModel({
        amount: subscription.amount,
        paymentMethod: PaymentMethod.MOBILE_MONEY, // Default to mobile money since it's most common
        transactionType: transactionType.STUDENT_REGISTRATION,
        transactionDate: new Date(),
        parent: user._id,
        student: student._id,
        notes: `Student registration for ${student.firstName} ${student.lastName}`,
        transactionRef: subscription.flutterwaveTransactionId || subscription.transactionRef,
      });
      await transaction.save();
      this.logger.log(`Created transaction record: ${transaction._id}`);
    } else {
      this.logger.log(`Transaction already exists for this registration: ${existingTransaction._id}`);
    }

    const populatedStudent = await this.userModel
      .findById(student._id)
      .populate('subscription')
      .lean();
    return populatedStudent;
  }

  async getStudentForUser(user: User) {
    const query: any = { role: UserRole.STUDENT };
    if (user.role === UserRole.PARENT) {
      query.createdBy = user._id;
    }

    return this.userModel
      .find(query, { password: 0, createdBy: 0, __v: 0 })
      .lean();
  }

  /**
   * Calculates the age range for a given age.
   * @param age number
   * @returns string
   */
  calculateAgeRange(age: number): string {
    if (age < 13) return 'under_13';
    if (age >= 13 && age < 16) return '13_15';
    if (age >= 16 && age < 19) return '16_18';
    return '19_plus';
  }
}
