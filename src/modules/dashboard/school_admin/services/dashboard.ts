import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { LoggerService } from 'src/common/logger/logger.service';
import {
  DashboardResponse,
  DashboardSummary,
  UserRole,
} from 'src/common/interfaces';
import { School, User } from '../../../schemas/index';
import { CreateStudentDto } from 'src/modules/auth/dtos';
import { uploadToAzureStorage } from 'src/common/utils/azure-upload.util';
import { ContentService } from 'src/modules/content/services/content.service';
import {
  FilterContentDto,
  FilterContentWithoutCategoryDto,
} from 'src/modules/content/dtos';
import { EmailService } from 'src/common/utils/mailing/email.service';

@Injectable()
export class SchoolDashboardService {
  constructor(
    @InjectModel(School.name)
    private readonly schoolModel: Model<School>,

    @InjectModel(User.name)
    private readonly userModel: Model<User>,

    private readonly contentService: ContentService,

    private readonly logger: LoggerService,

    private emailService: EmailService,
  ) {}

  async getSchoolProfile(schoolId: string): Promise<School> {
    try {
      this.logger.log(`Fetching school profile for school: ${schoolId}`);

      const school = await this.schoolModel
        .findById(schoolId)
        // .populate('createdBy')
        .lean();

      if (!school) {
        throw new BadRequestException('School not found.');
      }

      return school;
    } catch (error) {
      this.logger.error(
        `Error fetching school profile for school: ${schoolId}`,
        error,
      );
      throw error;
    }
  }

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

  async registerStudentBySchoolAdmin(
    createStudentDto: CreateStudentDto,
    currentUser: User,
    image?: Express.Multer.File,
  ) {
    if (currentUser.role !== UserRole.SCHOOL_ADMIN) {
      throw new BadRequestException('Only School Admin can register students.');
    }

    const school = await this.schoolModel.findOne({ _id: currentUser.school });
    if (!school) {
      throw new BadRequestException('School not found.');
    }

    const session = await this.userModel.db.startSession();
    let committed = false;

    try {
      session.startTransaction();
      const hashedPassword = await bcrypt.hash(createStudentDto.password, 10);

      let imageUrl = '';
      if (image) {
        imageUrl = await uploadToAzureStorage(image);
      }

      const currentStudentCount = await this.userModel.countDocuments({
        school: school._id,
        role: UserRole.STUDENT,
        deletedAt: null,
      });

      if (
        school.studentsLimit !== null &&
        school.studentsLimit !== undefined &&
        currentStudentCount >= school.studentsLimit
      ) {
        throw new BadRequestException(
          `Cannot add more students. School has reached its limit of ${school.studentsLimit} students.`,
        );
      }

      const newStudent = new this.userModel({
        ...createStudentDto,
        role: UserRole.STUDENT,
        password: hashedPassword,
        image: imageUrl,
        school: school._id,
        createdBy: currentUser._id,
      });

      console.log('Creating student with createdBy:', currentUser._id);

      await newStudent.save({ session });

      await this.schoolModel.findByIdAndUpdate(
        school._id,
        { $push: { students: newStudent._id } },
        { session },
      );

      await session.commitTransaction();
      committed = true;

      const dashboardUrl = 'https://student.wekraft.co';

      try {
        // Send both emails in parallel for better performance
        (await this.emailService.sendStudentOnboardingEmailSchool(
          createStudentDto.parentEmail,
          currentUser.email,
          createStudentDto.firstName,
          createStudentDto.firstName,
          createStudentDto.plainPassword,
          dashboardUrl,
        ),
          this.logger.log(
            `Emails sent successfully for student registration: ${newStudent._id}`,
          ));
      } catch (emailError) {
        // Log email error but don't fail the registration
        this.logger.error('Failed to send registration emails:', emailError);
      }

      return await this.userModel
        .findById(newStudent._id)
        .populate('createdBy');
    } catch (error) {
      if (!committed) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getStudentForUser(user: User) {
    const query: any = { role: UserRole.STUDENT };
    if (user.role === UserRole.SCHOOL_ADMIN) {
      query.createdBy = user._id;
    }

    return this.userModel.find(query).populate('createdBy').lean();
  }

  // Update a child's details
  async updateStudent(
    studentId: string,
    updateData: Partial<CreateStudentDto>,
    currentUser: User,
    image?: Express.Multer.File,
  ) {
    if (currentUser.role !== UserRole.SCHOOL_ADMIN) {
      throw new BadRequestException('Only School Admin can update students.');
    }

    const student = await this.userModel.findById(studentId);
    if (!student || student.role !== UserRole.STUDENT) {
      throw new BadRequestException('Student not found.');
    }

    if (student.createdBy.toString() !== currentUser._id.toString()) {
      throw new BadRequestException('You cannot update this student.');
    }

    if (image) {
      const imageUrl = await uploadToAzureStorage(image);
      student.image = imageUrl;
    }

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        (student as any)[key] = updateData[key];
      }
    });

    if (updateData.password) {
      student.password = await bcrypt.hash(updateData.password, 10);
    }
    await student.save();

    return student;
  }

  async deleteStudent(studentId: string, currentUser: User) {
    if (currentUser.role !== UserRole.SCHOOL_ADMIN) {
      throw new BadRequestException('Only School Admin can delete students.');
    }

    const student = await this.userModel.findById(studentId);
    if (!student || student.role !== UserRole.STUDENT) {
      throw new BadRequestException('Student not found.');
    }

    if (student.createdBy.toString() !== currentUser._id.toString()) {
      throw new BadRequestException('You cannot delete this student.');
    }

    // Remove student from school's students array
    await this.schoolModel.findByIdAndUpdate(student.school, {
      $pull: { students: student._id },
    });

    // Delete the student completely
    await this.userModel.deleteOne({ _id: student._id });

    return { success: true, message: 'Student deleted successfully' };
  }
}
