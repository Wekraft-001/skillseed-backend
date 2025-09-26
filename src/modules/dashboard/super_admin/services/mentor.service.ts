import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession, Types } from 'mongoose';
import { Mentor } from 'src/modules/schemas';
import { CreateMentorDto, UserRole } from 'src/common/interfaces';
import { User } from 'src/modules/schemas';
import { PasswordService } from './password-service.service';
import { uploadToAzureStorage } from 'src/common/utils/azure-upload.util';
import { EmailService } from 'src/common/utils/mailing/email.service';

@Injectable()
export class MentorOnboardingService {
  private readonly logger = new Logger(MentorOnboardingService.name);

  constructor(
    @InjectModel(Mentor.name)
    private readonly mentorModel: Model<Mentor>,
    private readonly passwordService: PasswordService,
    private readonly emailService: EmailService,
  ) {}

  async onboardMentor(
    createMentorDto: CreateMentorDto,
    superAdmin: User,
    imageFile?: Express.Multer.File,
  ): Promise<Mentor> {
    const session: ClientSession = await this.mentorModel.db.startSession();

    try {
      session.startTransaction();

      // Check if mentor with email already exists
      const exisitingMentor = await this.mentorModel
        .findOne({
          email: createMentorDto.email,
          deletedAt: null,
        })
        .session(session);

      if (exisitingMentor) {
        throw new ConflictException('A mentor with this email already exists');
      }

      // Generate and hash password
      const tempPassword = this.passwordService.generateRandomPassword();
      const hashedPassword =
        await this.passwordService.hashPassword(tempPassword);

      // Upload profile image to Azure
      let imageUrl = '';
      if (imageFile) {
        imageUrl = await uploadToAzureStorage(imageFile);
      }

      // Create mentor document with all available fields
      const mentorData = {
        firstName: createMentorDto.firstName,
        lastName: createMentorDto.lastName,
        email: createMentorDto.email,
        phoneNumber: createMentorDto.phoneNumber,
        specialty: createMentorDto.specialty,
        city: createMentorDto.city,
        country: createMentorDto.country,
        image: imageUrl,
        biography: createMentorDto.biography,
        linkedin: createMentorDto.linkedin,
        areasOfExpertise: createMentorDto.areasOfExpertise,
        languages: createMentorDto.languages,
        yearsOfExperience: createMentorDto.yearsOfExperience,
        education: createMentorDto.education,
        role: UserRole.MENTOR,
        password: hashedPassword,
        createdBy: superAdmin._id,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const newMentor = await new this.mentorModel(mentorData);
      const savedMentor = await newMentor.save({ session });

      const populatedMentor = await this.mentorModel
        .findById(savedMentor._id)
        .populate('createdBy superAdmin students')
        .session(session)
        .lean()
        .exec();

      await session.commitTransaction();

      // Send welcome email
      await this.emailService.sendMentorOnboardingEmail(
        savedMentor.firstName,
        savedMentor.email,
        tempPassword,
      );

      this.logger.log(
        `Mentor onboarded: ${savedMentor.firstName} ${savedMentor.lastName} by ${superAdmin.email}`,
      );

      if (!populatedMentor) {
        return savedMentor.toObject();
      }

      return populatedMentor;
    } catch (error) {
      await session.abortTransaction();
      this.logger.error('Error during mentor onboarding', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getAllMentors(): Promise<Mentor[]> {
    try {
      return await this.mentorModel
        .find({ role: UserRole.MENTOR, deletedAt: null })
        .populate('createdBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      this.logger.error('Error fetching mentors', error);
      throw error;
    }
  }

  async getMentorById(mentorId: string): Promise<Mentor> {
    try {
      const mentor = await this.mentorModel
        .findOne({ _id: mentorId, role: UserRole.MENTOR, deletedAt: null })
        .populate('createdBy', 'firstName lastName email')
        .exec();

      if (!mentor) {
        throw new Error('Mentor not found');
      }

      return mentor;
    } catch (error) {
      this.logger.error(`Error fetching mentor with ID: ${mentorId}`, error);
      throw error;
    }
  }

  async suspendMentor(mentorId: string, superAdmin: User): Promise<Mentor> {
    try {
      const mentor = await this.mentorModel.findOne({
        _id: mentorId,
        role: UserRole.MENTOR,
        deletedAt: null,
      });

      if (!mentor) {
        throw new Error('Mentor not found');
      }

      mentor.deletedAt = new Date();
      await mentor.save();

      this.logger.log(
        `Mentor suspended: ${mentor.firstName} ${mentor.lastName} by ${superAdmin.email}`,
      );

      // Optionally send an email to the mentor about account suspension
      await this.emailService.sendMentorSuspensionEmail(
        mentor.firstName,
        mentor.email,
      );

      return mentor;
    } catch (error) {
      this.logger.error(`Error suspending mentor with ID: ${mentorId}`, error);
      throw error;
    }
  }

  async reactivateMentor(mentorId: string, superAdmin: User): Promise<Mentor> {
    try {
      const mentor = await this.mentorModel.findOne({
        _id: mentorId,
        role: UserRole.MENTOR,
      });

      if (!mentor) {
        throw new Error('Mentor not found');
      }

      mentor.deletedAt = null;
      await mentor.save();

      this.logger.log(
        `Mentor reactivated: ${mentor.firstName} ${mentor.lastName} by ${superAdmin.email}`,
      );

      // Optionally send an email to the mentor about account reactivation
      await this.emailService.sendMentorReactivationEmail(
        mentor.firstName,
        mentor.email,
      );

      return mentor;
    } catch (error) {
      this.logger.error(
        `Error reactivating mentor with ID: ${mentorId}`,
        error,
      );
      throw error;
    }
  }
}
