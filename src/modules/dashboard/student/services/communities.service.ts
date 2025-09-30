import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LoggerService } from 'src/common/logger/logger.service';
import {
  Category,
  Community,
  CommunityDocument,
  User,
  UserDocument,
} from 'src/modules/schemas';
import { Model, Types } from 'mongoose';
import { UserRole } from 'src/common/interfaces';

@Injectable()
export class StudentCommunitiesService {
  constructor(
    @InjectModel(Community.name)
    private communityModel: Model<CommunityDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Category.name)
    private readonly logger: LoggerService,
  ) {
    // this.logger.setContext('CommunityService');
  }

  async getCommunities(userId?: string) {
    try {
      const communities = await this.communityModel
        .find()
        .select('name description category ageGroup members createdAt')
        .populate('category', 'name icon description')
        .sort({ name: 1 })
        .exec();

      console.log('Found communities:', communities);

      return communities.map((community) => ({
        ...community.toObject(),
        memberCount: community.members.length,
        hasJoined: userId ? community.members.some(memberId => 
          memberId.toString() === userId.toString()
        ) : false
      }));
    } catch (error) {
      this.logger.error(
        `Error getting communities: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getCommunityDetails(communityId: string, userId?: string) {
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
        hasJoined: userId ? community.members.some(memberId => 
          memberId.toString() === userId.toString()
        ) : false
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
}
