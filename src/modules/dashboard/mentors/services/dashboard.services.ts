import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { LoggerService } from 'src/common/logger/logger.service';
import { Mentor, User } from '../../../schemas/index';
import {
  uploadDocumentToAzure,
  uploadToAzureStorage,
} from 'src/common/utils/azure-upload.util';
import { UpdateMentorProfileDto } from 'src/common/interfaces';
import {
  MentorCredential,
  MentorCredentialDocument,
} from 'src/modules/schemas/mentor-credential.schema';

@Injectable()
export class MentorDashboardService {
  constructor(
    @InjectModel(Mentor.name)
    private readonly mentorModel: Model<Mentor>,
    @InjectModel(MentorCredential.name)
    private readonly credentialModel: Model<MentorCredentialDocument>,
    private readonly logger: LoggerService,
  ) {}

  // GET PROFILE
  async getMentorProfile(mentorId: string): Promise<Mentor> {
    try {
      this.logger.log(`Fetching mentor profile for mentor: ${mentorId}`);

      const mentor = await this.mentorModel
        .findById(mentorId)
        // .populate('createdBy')
        .lean();

      if (!mentor) {
        throw new BadRequestException('Mentor not found.');
      }

      return mentor;
    } catch (error) {
      this.logger.error(
        `Error fetching mentor profile for mentor: ${mentorId}`,
        error,
      );
      throw error;
    }
  }

  // UPDATE PROFILE
  async updateMentorProfile(
    mentorId: string,
    updateDto: UpdateMentorProfileDto,
    files?: { photo?: any; nationalId?: any },
  ): Promise<Mentor> {
    const session: ClientSession = await this.mentorModel.db.startSession();
    try {
      session.startTransaction();

      const mentor = await this.mentorModel.findById(mentorId).session(session);
      if (!mentor) {
        throw new Error('Mentor not found');
      }

      if (files?.photo) {
        const photoUrl = await uploadToAzureStorage(files.photo);
        mentor.image = photoUrl;
      }

      if (typeof updateDto.firstName !== 'undefined')
        mentor.firstName = updateDto.firstName;
      if (typeof updateDto.lastName !== 'undefined')
        mentor.lastName = updateDto.lastName;
      if (typeof updateDto.email !== 'undefined')
        mentor.email = updateDto.email;
      if (typeof updateDto.biography !== 'undefined') {
        mentor.biography = updateDto.biography as any;
      }
      if (typeof updateDto.linkedin !== 'undefined') {
        mentor.linkedin = updateDto.linkedin as any;
      }
      if (updateDto.specialty) {
        mentor.specialty = updateDto.specialty;
      }
      if (updateDto.areasOfExpertise) {
        mentor.areasOfExpertise = updateDto.areasOfExpertise;
      }
      if (updateDto.yearsOfExperience) {
        mentor.yearsOfExperience = updateDto.yearsOfExperience;
      }
      if (updateDto.education) {
        mentor.education = updateDto.education;
      }
      if (updateDto.languages) {
        mentor.languages = updateDto.languages;
      }

      await mentor.save({ session });
      await session.commitTransaction();
      return await this.mentorModel.findById(mentor._id).lean();
    } catch (error) {
      await session.abortTransaction();
      this.logger.error('Error updating mentor profile', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // UPLOAD CREDENTIALS
  async uploadCredentials(
    user: User,
    files: {
      governmentId?: Express.Multer.File[];
      professionalCredentials?: Express.Multer.File[];
    },
    description?: string,
  ) {
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
    const uploadedCredentials = [];

    // Validate files are provided
    if (!files.governmentId?.length && !files.professionalCredentials?.length) {
      throw new BadRequestException('At least one credential file must be uploaded');
    }

    // Handle Government ID
    if (files.governmentId?.length > 0) {
      const file = files.governmentId[0];
      
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new BadRequestException(`Government ID file size exceeds maximum allowed (5MB)`);
      }
      
      // Validate file type
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new BadRequestException(`Government ID must be a PDF, JPEG, or PNG file`);
      }

      const fileKey = `mentors/${user._id}/credentials/government-id/${file.originalname}`;

      // Upload to Azure
      const fileUrl = await uploadDocumentToAzure(file, fileKey);

      // Save to database
      const credential = await this.credentialModel.create({
        mentor: user._id,
        credentialType: 'government_id',
        fileUrl,
        fileName: file.originalname,
        description: description || 'Government ID Document',
        status: 'pending',
      });

      uploadedCredentials.push(credential);
    }

    // Handle Professional Credentials
    if (files.professionalCredentials?.length > 0) {
      const file = files.professionalCredentials[0];
      
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new BadRequestException(`Professional credentials file size exceeds maximum allowed (5MB)`);
      }
      
      // Validate file type
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new BadRequestException(`Professional credentials must be a PDF, JPEG, or PNG file`);
      }
      
      const fileKey = `mentors/${user._id}/credentials/professional/${file.originalname}`;

      // Upload to Azure
      const fileUrl = await uploadDocumentToAzure(file, fileKey);

      // Save to database
      const credential = await this.credentialModel.create({
        mentor: user._id,
        credentialType: 'professional_credentials',
        fileUrl,
        fileName: file.originalname,
        description: description || 'Professional Credentials',
        status: 'pending',
      });

      uploadedCredentials.push(credential);
    }

    // Return uploaded credentials
    return {
      message: 'Credentials uploaded successfully',
      credentials: uploadedCredentials,
    };
  }

  async getCredentials(user: User) {
    const credentials = await this.credentialModel
      .find({ mentor: user._id })
      .sort({ createdAt: -1 })
      .lean();

    return credentials;
  }
}
