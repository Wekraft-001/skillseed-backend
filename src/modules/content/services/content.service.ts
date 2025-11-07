import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { LoggerService } from 'src/common/logger/logger.service';
import {
  Content,
  ContentDocument,
  Challenge,
  ChallengeDocument,
  User,
  UserDocument,
  School,
  Mentor,
} from 'src/modules/schemas';
import {
  CreateContentDto,
  FilterContentDto,
  TargetAudience,
  CreateChallengeDto,
} from '../dtos';
import { UserRole } from 'src/common/interfaces';

@Injectable()
export class ContentService {
  constructor(
    @InjectModel(Content.name) private contentModel: Model<ContentDocument>,
    @InjectModel(Challenge.name)
    private challengeModel: Model<ChallengeDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(School.name) private schoolModel: Model<School>,
    @InjectModel(Mentor.name) private mentorModel: Model<Mentor>,
    @InjectConnection() private connection: Connection,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('ContentService');
  }

  async createContent(createContentDto: CreateContentDto, userId: string) {
    try {
      // Check if user is a super admin
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('Only super admins can create content');
      }

      const newContent = new this.contentModel({
        ...createContentDto,
        createdBy: new Types.ObjectId(userId),
      });

      return await newContent.save();
    } catch (error) {
      this.logger.error(
        `Error creating content: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async createChallenge(
    createChallengeDto: CreateChallengeDto,
    userId: string,
  ) {
    try {
      // Check if user is a super admin
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('Only super admins can create challenges');
      }

      // Validate if the category exists
      try {
        const categoryExists = await this.connection.models.Category.findById(
          createChallengeDto.categoryId,
        );
        if (!categoryExists) {
          throw new NotFoundException(
            `Challenge category with ID ${createChallengeDto.categoryId} not found`,
          );
        }
      } catch (error) {
        throw new BadRequestException(`Invalid category ID: ${error.message}`);
      }

      const newChallenge = new this.challengeModel({
        ...createChallengeDto,
        createdBy: new Types.ObjectId(userId),
      });

      return await newChallenge.save();
    } catch (error) {
      this.logger.error(
        `Error creating challenge: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getContentForUser(userId: string, filterDto: FilterContentDto) {
    try {
      const user = await this.userModel.findById(userId);
      let userRole: string | null = null;

      if (user) {
        userRole = user.role;
      } else {
        const school = await this.schoolModel.findById(userId);
        if (school) {
          userRole = UserRole.SCHOOL_ADMIN;
        } else {
          const mentor = await this.mentorModel.findById(userId);
          if (mentor) {
            userRole = UserRole.MENTOR;
          }
        }
      }

      if (!userRole) {
        throw new NotFoundException('User not found');
      }

      let targetAudience: string[] = [TargetAudience.ALL];

      // Add audience based on user role
      switch (userRole) {
        case UserRole.PARENT:
          targetAudience.push(TargetAudience.PARENT);
          break;
        case UserRole.SCHOOL_ADMIN:
          targetAudience.push(TargetAudience.SCHOOL);
          break;
        case UserRole.MENTOR:
          targetAudience.push(TargetAudience.MENTOR);
          break;
        case UserRole.SUPER_ADMIN:
          targetAudience = [
            TargetAudience.ALL,
            TargetAudience.PARENT,
            TargetAudience.SCHOOL,
            TargetAudience.MENTOR,
          ];
          break;
        default:
          break;
      }

      // Build query based on filters
      const query: any = { targetAudience: { $in: targetAudience } };

      if (filterDto.type) {
        query.type = filterDto.type;
      }

      if (filterDto.search) {
        query.$or = [
          { title: { $regex: filterDto.search, $options: 'i' } },
          { description: { $regex: filterDto.search, $options: 'i' } },
        ];
      }

      return await this.contentModel.find(query).sort({ createdAt: -1 }).exec();
    } catch (error) {
      this.logger.error(
        `Error getting content for user: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getContentById(contentId: string) {
    try {
      const content = await this.contentModel.findById(contentId);
      if (!content) {
        throw new NotFoundException('Content not found');
      }
      return content;
    } catch (error) {
      this.logger.error(
        `Error getting content by ID: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getChallengesForStudent(userId: string, filterDto: FilterContentDto) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.role !== UserRole.STUDENT) {
        throw new ForbiddenException('Only students can access challenges');
      }

      // Build query based on filters
      const query: any = {};

      if (filterDto.type) {
        query.type = filterDto.type;
      }

      if (filterDto.search) {
        query.$or = [
          { title: { $regex: filterDto.search, $options: 'i' } },
          { description: { $regex: filterDto.search, $options: 'i' } },
        ];
      }

      return await this.challengeModel
        .find(query)
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      this.logger.error(
        `Error getting challenges for student: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getChallengeById(challengeId: string) {
    try {
      const challenge = await this.challengeModel.findById(challengeId);
      if (!challenge) {
        throw new NotFoundException('Challenge not found');
      }
      return challenge;
    } catch (error) {
      this.logger.error(
        `Error getting challenge by ID: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getChallengesForAdmin(userId: string) {
    try {
      // Check if user is a super admin
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException(
          'Only super admins can access this endpoint',
        );
      }

      // Get challenges with interaction counts
      const challenges = await this.challengeModel
        .find()
        .populate('categoryId', 'name')
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      return challenges.map((challenge) => ({
        ...challenge,
        uniqueStudents: 0,
        totalSubmissions: 0,
      }));
    } catch (error) {
      this.logger.error(
        `Error getting challenges for admin: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getChallengeDetailsByIdForAdmin(challengeId: string, userId: string) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException(
          'Only super admins can access this endpoint',
        );
      }

      const challengeDetails = await this.challengeModel
        .findById(challengeId)
        .populate('categoryId', 'name')
        .populate('createdBy', 'name email')
        .lean()
        .exec();

      if (!challengeDetails) {
        throw new NotFoundException('Challenge not found');
      }

      return {
        ...challengeDetails,
        uniqueStudents: 0,
        totalSubmission: 0,
        studentList: [],
      };
    } catch (error) {
      this.logger.error(
        `Error getting challenge details for admin: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
