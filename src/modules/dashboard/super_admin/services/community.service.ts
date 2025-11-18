import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LoggerService } from 'src/common/logger/logger.service';
import {
  Category,
  CategoryDocument,
  Community,
  CommunityDocument,
  User,
  UserDocument,
  CompletedChallenge,
  CompletedChallengeDocument,
  Challenge,
  ChallengeDocument,
} from 'src/modules/schemas';
import { CreateCommunityDto, FilterCommunityDto } from '../dto/community.dto';
import { UserRole } from 'src/common/interfaces';

@Injectable()
export class CommunityService {
  constructor(
    @InjectModel(Community.name)
    private communityModel: Model<CommunityDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Category.name)
    private challengeCategoryModel: Model<CategoryDocument>,
    @InjectModel(CompletedChallenge.name)
    private completedChallengeModel: Model<CompletedChallengeDocument>,
    @InjectModel(Challenge.name)
    private challengeModel: Model<ChallengeDocument>,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('CommunityService');
  }

  async createCommunity(
    createCommunityDto: CreateCommunityDto,
    userId: string,
  ) {
    try {
      // Check if user is a super admin
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException(
          'Only super admins can create communities',
        );
      }

      // If categoryId is provided, validate it exists
      if (createCommunityDto.categoryId) {
        const category = await this.challengeCategoryModel.findById(
          createCommunityDto.categoryId,
        );
        if (!category) {
          throw new BadRequestException(
            `Category with ID ${createCommunityDto.categoryId} not found`,
          );
        }

        this.logger.log(
          `Creating community with category: ${category.name} (${createCommunityDto.categoryId})`,
        );
      }

      const newCommunity = new this.communityModel({
        ...createCommunityDto,
        // Set the challengeCategory field if categoryId is provided
        ...(createCommunityDto.categoryId && {
          challengeCategory: new Types.ObjectId(createCommunityDto.categoryId),
        }),
        members: [],
        createdBy: new Types.ObjectId(userId),
      });

      const savedCommunity = await newCommunity.save();

      this.logger.log(
        `Created community: ${savedCommunity._id} with name ${savedCommunity.name}`,
      );

      return savedCommunity;
    } catch (error) {
      this.logger.error(
        `Error creating community: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getAllCommunities(filterDto: FilterCommunityDto) {
    try {
      // Build query based on filters
      const query: any = { isActive: true };

      if (filterDto.category) {
        query.category = filterDto.category;
      }

      if (filterDto.ageGroup) {
        query.ageGroup = filterDto.ageGroup;
      }

      if (filterDto.search) {
        query.$or = [
          { name: { $regex: filterDto.search, $options: 'i' } },
          { description: { $regex: filterDto.search, $options: 'i' } },
        ];
      }
      console.log('Community query:', query);
      const communities = await this.communityModel
        .find(query)
        .select('name description category ageGroup members createdAt')
        .populate('category', 'name icon description')
        .sort({ name: 1 })
        .exec();

      console.log('Found communities:', communities);

      return communities.map((community) => ({
        ...community.toObject(),
        memberCount: community.members.length,
      }));
    } catch (error) {
      this.logger.error(
        `Error getting communities: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getCommunityById(communityId: string) {
    try {
      const community = await this.communityModel
        .findById(communityId)
        .populate('members', 'firstName lastName image')
        .populate('category', 'name icon description')
        .exec();

      if (!community) {
        throw new NotFoundException('Community not found');
      }

      return {
        ...community.toObject(),
        memberCount: community.members.length,
      };
    } catch (error) {
      this.logger.error(
        `Error getting community by ID: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getUserCommunities(userId: string) {
    try {
      const communities = await this.communityModel
        .find({
          members: new Types.ObjectId(userId),
          isActive: true,
        })
        .select('name description category imageUrl members')
        .sort({ name: 1 })
        .exec();

      return communities.map((community) => ({
        ...community.toObject(),
        memberCount: community.members.length,
      }));
    } catch (error) {
      this.logger.error(
        `Error getting user communities: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async deactivateCommunity(communityId: string, userId: string) {
    try {
      // Check if user is a super admin
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException(
          'Only super admins can deactivate communities',
        );
      }

      const community = await this.communityModel.findById(communityId);
      if (!community) {
        throw new NotFoundException('Community not found');
      }

      community.isActive = false;
      await community.save();

      return { message: 'Community successfully deactivated' };
    } catch (error) {
      this.logger.error(
        `Error deactivating community: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getCommunityMemberCount(communityId: string) {
    try {
      const community = await this.communityModel
        .findById(communityId)
        .select('name members')
        .exec();

      if (!community) {
        throw new NotFoundException('Community not found');
      }

      const memberCount = community.members.length;

      // Get list of members with basic info
      const members = await this.userModel
        .find({ _id: { $in: community.members } })
        .select('firstName lastName email image')
        .exec();

      return {
        communityId: community._id,
        communityName: community.name,
        memberCount,
        members,
      };
    } catch (error) {
      this.logger.error(
        `Error getting community member count: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getChallengeSubmissionCount(challengeId: string) {
    try {
      // Verify challenge exists
      const challenge = await this.challengeModel
        .findById(challengeId)
        .select('title description')
        .exec();

      if (!challenge) {
        throw new NotFoundException('Challenge not found');
      }

      // Count submissions for this challenge
      const submissionCount = await this.completedChallengeModel
        .countDocuments({ challengeId: new Types.ObjectId(challengeId) })
        .exec();

      // Get list of users who submitted with their submission details
      const submissions = await this.completedChallengeModel
        .find({ challengeId: new Types.ObjectId(challengeId) })
        .populate('userId', 'firstName lastName email image')
        .select('userId completedAt completionNotes workFileUrl')
        .sort({ completedAt: -1 })
        .exec();

      return {
        challengeId: challenge._id,
        challengeTitle: challenge.title,
        submissionCount,
        submissions,
      };
    } catch (error) {
      this.logger.error(
        `Error getting challenge submission count: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getAllCommunitiesWithStats() {
    try {
      const communities = await this.communityModel
        .find({ isActive: true })
        .select('name description category ageGroup members createdAt')
        .populate('category', 'name icon description')
        .sort({ name: 1 })
        .exec();

      return communities.map((community) => ({
        _id: community._id,
        name: community.name,
        description: community.description,
        category: community.category,
        ageGroup: community.ageGroup,
        memberCount: community.members.length,
        createdAt: (community as any).createdAt,
      }));
    } catch (error) {
      this.logger.error(
        `Error getting communities with stats: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getAllChallengesWithStats() {
    try {
      const challenges = await this.challengeModel
        .find({ isActive: { $ne: false } })
        .select('title description type categoryId ageRange createdAt')
        .populate('categoryId', 'name icon description')
        .sort({ createdAt: -1 })
        .exec();

      // Get submission counts for all challenges
      const challengeIds = challenges.map((c) => c._id);
      const submissionCounts = await this.completedChallengeModel.aggregate([
        { $match: { challengeId: { $in: challengeIds } } },
        { $group: { _id: '$challengeId', count: { $sum: 1 } } },
      ]);

      // Create a map for quick lookup
      const countMap = new Map(
        submissionCounts.map((item) => [item._id.toString(), item.count]),
      );

      return challenges.map((challenge) => ({
        _id: challenge._id,
        title: challenge.title,
        description: challenge.description,
        type: challenge.type,
        category: challenge.categoryId,
        ageRange: challenge.ageRange,
        submissionCount: countMap.get(challenge._id.toString()) || 0,
        createdAt: (challenge as any).createdAt,
      }));
    } catch (error) {
      this.logger.error(
        `Error getting challenges with stats: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getSubmissionsWithFiles(challengeId?: string) {
    try {
      // Build query - if challengeId is provided, filter by it
      const query: any = { workFileUrl: { $exists: true, $ne: null } };
      
      if (challengeId) {
        query.challengeId = new Types.ObjectId(challengeId);
      }

      // Get submissions that have uploaded files
      const submissions = await this.completedChallengeModel
        .find(query)
        .populate('userId', 'firstName lastName email image')
        .populate('challengeId', 'title description type ageRange')
        .select('userId challengeId completedAt completionNotes workFileUrl')
        .sort({ completedAt: -1 })
        .exec();

      // Group by challenge if no specific challengeId provided
      if (!challengeId) {
        const groupedByChallenge = submissions.reduce((acc, submission) => {
          const challenge = submission.challengeId as any;
          const challengeKey = challenge._id.toString();
          
          if (!acc[challengeKey]) {
            acc[challengeKey] = {
              challengeId: challenge._id,
              challengeTitle: challenge.title,
              challengeType: challenge.type,
              submissionsWithFiles: [],
            };
          }
          
          acc[challengeKey].submissionsWithFiles.push({
            _id: submission._id,
            student: submission.userId,
            completedAt: submission.completedAt,
            completionNotes: submission.completionNotes,
            workFileUrl: submission.workFileUrl,
          });
          
          return acc;
        }, {});

        return {
          totalSubmissionsWithFiles: submissions.length,
          challenges: Object.values(groupedByChallenge),
        };
      }

      // For specific challenge, return submissions directly
      const challenge = await this.challengeModel
        .findById(challengeId)
        .select('title description type ageRange')
        .exec();

      if (!challenge) {
        throw new NotFoundException('Challenge not found');
      }

      return {
        challengeId: challenge._id,
        challengeTitle: challenge.title,
        challengeType: challenge.type,
        totalSubmissionsWithFiles: submissions.length,
        submissions: submissions.map((submission) => ({
          _id: submission._id,
          student: submission.userId,
          completedAt: submission.completedAt,
          completionNotes: submission.completionNotes,
          workFileUrl: submission.workFileUrl,
        })),
      };
    } catch (error) {
      this.logger.error(
        `Error getting submissions with files: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
