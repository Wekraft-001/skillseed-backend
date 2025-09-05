import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MentorCredential } from 'src/modules/schemas/mentor-credential.schema';
import { Mentor, User } from 'src/modules/schemas';
import { uploadToAzureStorage } from 'src/common/utils/azure-upload.util';
import { EmailService } from 'src/common/utils/mailing/email.service';

@Injectable()
export class MentorCredentialsService {
  private readonly logger = new Logger(MentorCredentialsService.name);

  constructor(
    @InjectModel(MentorCredential.name)
    private readonly mentorCredentialModel: Model<MentorCredential>,
    @InjectModel(Mentor.name)
    private readonly mentorModel: Model<Mentor>,
    private readonly emailService: EmailService,
  ) {}

  async uploadCredential(
    mentorId: string,
    credentialType: 'government_id' | 'professional_credentials',
    file: Express.Multer.File,
    description?: string,
  ): Promise<MentorCredential> {
    try {
      // Check if mentor exists
      const mentor = await this.mentorModel.findById(mentorId);
      if (!mentor) {
        throw new NotFoundException(`Mentor with ID ${mentorId} not found`);
      }

      // Upload file to Azure storage
      const fileUrl = await uploadToAzureStorage(file);

      // Create new credential document
      const newCredential = new this.mentorCredentialModel({
        mentor: mentorId,
        credentialType,
        fileUrl,
        fileName: file.originalname,
        description,
        status: 'pending',
      });

      await newCredential.save();

      this.logger.log(
        `Credential uploaded for mentor ${mentorId}, type: ${credentialType}`,
      );

      return newCredential;
    } catch (error) {
      this.logger.error(
        `Error uploading credential for mentor ${mentorId}`,
        error,
      );
      throw error;
    }
  }

  async getCredentialsForMentor(mentorId: string): Promise<MentorCredential[]> {
    try {
      return this.mentorCredentialModel
        .find({ mentor: mentorId })
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      this.logger.error(
        `Error fetching credentials for mentor ${mentorId}`,
        error,
      );
      throw error;
    }
  }

  async getPendingCredentials(): Promise<MentorCredential[]> {
    try {
      return this.mentorCredentialModel
        .find({ status: 'pending' })
        .populate('mentor', 'firstName lastName email')
        .sort({ createdAt: 1 })
        .exec();
    } catch (error) {
      this.logger.error('Error fetching pending credentials', error);
      throw error;
    }
  }

  async approveCredential(
    credentialId: string,
    adminId: string,
  ): Promise<MentorCredential> {
    try {
      const credential = await this.mentorCredentialModel
        .findById(credentialId)
        .populate('mentor', 'firstName lastName email');

      if (!credential) {
        throw new NotFoundException(
          `Credential with ID ${credentialId} not found`,
        );
      }

      credential.status = 'approved';
      credential.verifiedAt = new Date();
      credential.verifiedBy = adminId as any;
      await credential.save();

      // Get mentor details for email notification
      const mentor = credential.mentor as any;

      // Send approval email notification
      await this.emailService.sendCredentialApprovedEmail(
        mentor.email,
        mentor.firstName,
        credential.credentialType,
      );

      this.logger.log(
        `Credential ${credentialId} approved by admin ${adminId}`,
      );

      return credential;
    } catch (error) {
      this.logger.error(
        `Error approving credential ${credentialId}`,
        error,
      );
      throw error;
    }
  }

  async rejectCredential(
    credentialId: string,
    adminId: string,
    rejectionReason: string,
  ): Promise<MentorCredential> {
    try {
      const credential = await this.mentorCredentialModel
        .findById(credentialId)
        .populate('mentor', 'firstName lastName email');

      if (!credential) {
        throw new NotFoundException(
          `Credential with ID ${credentialId} not found`,
        );
      }

      credential.status = 'rejected';
      credential.rejectionReason = rejectionReason;
      credential.verifiedAt = new Date();
      credential.verifiedBy = adminId as any;
      await credential.save();

      // Get mentor details for email notification
      const mentor = credential.mentor as any;

      // Send rejection email notification
      await this.emailService.sendCredentialRejectedEmail(
        mentor.email,
        mentor.firstName,
        credential.credentialType,
        rejectionReason,
      );

      this.logger.log(
        `Credential ${credentialId} rejected by admin ${adminId}`,
      );

      return credential;
    } catch (error) {
      this.logger.error(
        `Error rejecting credential ${credentialId}`,
        error,
      );
      throw error;
    }
  }
}
