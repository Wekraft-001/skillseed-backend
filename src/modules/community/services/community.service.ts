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
} from 'src/modules/schemas';
import { CreateCommunityDto, FilterCommunityDto } from '../dtos';
import { UserRole } from 'src/common/interfaces';

@Injectable()
export class CommunityService {
  constructor(
    @InjectModel(Community.name)
    private communityModel: Model<CommunityDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Category.name)
    private challengeCategoryModel: Model<CategoryDocument>,
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

  async joinCommunity(communityId: string, userId: string) {
    try {
      const community = await this.communityModel.findById(communityId);
      if (!community) {
        throw new NotFoundException('Community not found');
      }

      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.role !== UserRole.STUDENT) {
        throw new ForbiddenException('Only students can join communities');
      }

      // Check if user is already a member
      if (community.members.includes(new Types.ObjectId(userId))) {
        throw new BadRequestException(
          'User is already a member of this community',
        );
      }

      // Add user to community members
      community.members.push(new Types.ObjectId(userId));
      await community.save();

      return {
        message: 'Successfully joined the community',
        communityId: community._id,
        memberCount: community.members.length,
      };
    } catch (error) {
      this.logger.error(
        `Error joining community: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async leaveCommunity(communityId: string, userId: string) {
    try {
      const community = await this.communityModel.findById(communityId);
      if (!community) {
        throw new NotFoundException('Community not found');
      }

      // Check if user is a member
      const memberIndex = community.members.findIndex(
        (memberId) => memberId.toString() === userId,
      );

      if (memberIndex === -1) {
        throw new BadRequestException('User is not a member of this community');
      }

      // Remove user from community members
      community.members.splice(memberIndex, 1);
      await community.save();

      return {
        message: 'Successfully left the community',
        communityId: community._id,
        memberCount: community.members.length,
      };
    } catch (error) {
      this.logger.error(
        `Error leaving community: ${error.message}`,
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
}
