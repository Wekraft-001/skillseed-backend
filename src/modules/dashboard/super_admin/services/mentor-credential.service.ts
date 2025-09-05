import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LoggerService } from 'src/common/logger/logger.service';
import { MentorCredential, MentorCredentialDocument } from 'src/modules/schemas/mentor-credential.schema';
import { User, Mentor } from 'src/modules/schemas';
import { VerifyCredentialDto } from 'src/common/interfaces/verify-credential.dto';
import { EmailService } from 'src/common/utils/mailing/email.service';
import { uploadToAzureStorage } from 'src/common/utils/azure-upload.util';

@Injectable()
export class MentorCredentialService {
  constructor(
    @InjectModel(MentorCredential.name)
    private readonly credentialModel: Model<MentorCredentialDocument>,
    
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    
    @InjectModel(Mentor.name)
    private readonly mentorModel: Model<Mentor>,
    
    private readonly logger: LoggerService,
    private readonly emailService: EmailService,
  ) {}

  async getPendingCredentials() {
    try {
      const pendingCredentials = await this.credentialModel
        .find({ status: 'pending' })
        .populate('mentor', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .lean();

      return pendingCredentials;
    } catch (error) {
      this.logger.error('Error fetching pending credentials', error);
      throw error;
    }
  }

  async getAllCredentials() {
    try {
      const credentials = await this.credentialModel
        .find()
        .populate('mentor', 'firstName lastName email')
        .populate('verifiedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .lean();

      return credentials;
    } catch (error) {
      this.logger.error('Error fetching all credentials', error);
      throw error;
    }
  }

  async getCredentialsByStatus(status: 'pending' | 'approved' | 'rejected') {
    try {
      const credentials = await this.credentialModel
        .find({ status })
        .populate('mentor', 'firstName lastName email')
        .populate('verifiedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .lean();

      return credentials;
    } catch (error) {
      this.logger.error(`Error fetching ${status} credentials`, error);
      throw error;
    }
  }

  async verifyCredential(
    credentialId: string,
    verifyDto: VerifyCredentialDto,
    admin: User,
  ) {
    try {
      const credential = await this.credentialModel.findById(credentialId);
      
      if (!credential) {
        throw new Error('Credential not found');
      }

      credential.status = verifyDto.status;
      credential.verifiedAt = new Date();
      credential.verifiedBy = admin._id as any;
      
      if (verifyDto.status === 'rejected' && verifyDto.rejectionReason) {
        credential.rejectionReason = verifyDto.rejectionReason;
      }

      await credential.save();

      // Get the mentor details to send notification
      const mentor = await this.userModel.findById(credential.mentor);
      
      if (mentor) {
        // Send an email notification to the mentor
        if (verifyDto.status === 'approved') {
          await this.emailService.sendCredentialApprovedEmail(
            mentor.email,
            mentor.firstName,
            credential.credentialType
          );
        } else {
          await this.emailService.sendCredentialRejectedEmail(
            mentor.email,
            mentor.firstName,
            credential.credentialType,
            verifyDto.rejectionReason || ''
          );
        }
      }

      return credential;
    } catch (error) {
      this.logger.error(`Error verifying credential: ${credentialId}`, error);
      throw error;
    }
  }

  async getCredentialById(credentialId: string) {
    try {
      const credential = await this.credentialModel
        .findById(credentialId)
        .populate('mentor', 'firstName lastName email')
        .populate('verifiedBy', 'firstName lastName email')
        .lean();

      if (!credential) {
        throw new Error('Credential not found');
      }

      return credential;
    } catch (error) {
      this.logger.error(`Error fetching credential: ${credentialId}`, error);
      throw error;
    }
  }
  
  async uploadCredential(
    mentorId: string,
    credentialType: 'government_id' | 'professional_credentials',
    file: Express.Multer.File,
    description?: string,
  ) {
    try {
      // Check if mentor exists
      const mentor = await this.mentorModel.findById(mentorId);
      if (!mentor) {
        throw new NotFoundException(`Mentor with ID ${mentorId} not found`);
      }

      // Upload file to Azure storage
      const fileUrl = await uploadToAzureStorage(file);

      // Create new credential document
      const newCredential = new this.credentialModel({
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
  
  async getCredentialsForMentor(mentorId: string) {
    try {
      const credentials = await this.credentialModel
        .find({ mentor: mentorId })
        .populate('verifiedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .lean();

      return credentials;
    } catch (error) {
      this.logger.error(
        `Error fetching credentials for mentor ${mentorId}`,
        error,
      );
      throw error;
    }
  }
}
