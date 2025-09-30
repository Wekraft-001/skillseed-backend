import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LoggerService } from 'src/common/logger/logger.service';
import {
  Community,
  CommunityDocument,
  Post,
  PostDocument,
  User,
  UserDocument,
} from 'src/modules/schemas';
import { Model, Types } from 'mongoose';
import { CreatePostDto } from '../dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name)
    private postModel: Model<PostDocument>,
    @InjectModel(Community.name)
    private communityModel: Model<CommunityDocument>,
    @InjectModel(User.name) 
    private userModel: Model<UserDocument>,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('PostsService');
  }

  async createPost(userId: string, communityId: string, createPostDto: CreatePostDto) {
    try {
      const community = await this.communityModel.findById(communityId);
      if (!community) {
        throw new NotFoundException('Community not found');
      }

      // Check if user is a member of the community
      if (!community.members.some(memberId => memberId.toString() === userId)) {
        throw new ForbiddenException('You must be a member of the community to post');
      }

      const post = new this.postModel({
        content: createPostDto.content,
        images: createPostDto.images || [],
        author: new Types.ObjectId(userId),
        community: new Types.ObjectId(communityId),
      });

      await post.save();

      return post;
    } catch (error) {
      this.logger.error(
        `Error creating post: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getCommunityPosts(communityId: string, page = 1, limit = 10) {
    try {
      const community = await this.communityModel.findById(communityId);
      if (!community) {
        throw new NotFoundException('Community not found');
      }

      const skip = (page - 1) * limit;
      
      const posts = await this.postModel.find({ community: new Types.ObjectId(communityId) })
        .populate('author', 'firstName lastName image')
        .sort({ createdAt: -1 }) // Newest first
        .skip(skip)
        .limit(limit)
        .exec();

      const total = await this.postModel.countDocuments({ community: new Types.ObjectId(communityId) });

      return {
        posts,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        }
      };
    } catch (error) {
      this.logger.error(
        `Error getting community posts: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async likePost(userId: string, postId: string) {
    try {
      const post = await this.postModel.findById(postId);
      if (!post) {
        throw new NotFoundException('Post not found');
      }

      // Check if user has already liked the post
      if (post.likes.some(likeId => likeId.toString() === userId)) {
        throw new BadRequestException('You have already liked this post');
      }

      post.likes.push(new Types.ObjectId(userId));
      await post.save();

      return { message: 'Post liked successfully', likesCount: post.likes.length };
    } catch (error) {
      this.logger.error(
        `Error liking post: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async unlikePost(userId: string, postId: string) {
    try {
      const post = await this.postModel.findById(postId);
      if (!post) {
        throw new NotFoundException('Post not found');
      }

      // Find user's like
      const likeIndex = post.likes.findIndex(
        likeId => likeId.toString() === userId,
      );

      if (likeIndex === -1) {
        throw new BadRequestException('You have not liked this post');
      }

      // Remove like
      post.likes.splice(likeIndex, 1);
      await post.save();

      return { message: 'Post unliked successfully', likesCount: post.likes.length };
    } catch (error) {
      this.logger.error(
        `Error unliking post: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}