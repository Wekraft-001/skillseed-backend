import { 
  Body, 
  Controller, 
  Get, 
  Param, 
  Post, 
  Query, 
  UseGuards 
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/interfaces';
import { CurrentUser } from 'src/common/decorators';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PostsService } from '../services/posts.service';
import { User } from 'src/modules/schemas';
import { CreatePostDto } from '../dto/create-post.dto';

@Controller('student/dashboard/communities/:communityId/posts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
@ApiTags('STUDENT DASHBOARD - COMMUNITY POSTS')
export class CommunityPostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new post in a community' })
  @ApiParam({ name: 'communityId', description: 'Community ID' })
  async createPost(
    @CurrentUser() user: User, 
    @Param('communityId') communityId: string,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postsService.createPost((user as any)._id, communityId, createPostDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get posts for a community' })
  @ApiParam({ name: 'communityId', description: 'Community ID' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of posts per page (default: 10)',
  })
  async getPosts(
    @Param('communityId') communityId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.postsService.getCommunityPosts(
      communityId, 
      page ? +page : 1, 
      limit ? +limit : 10
    );
  }

  @Post(':postId/like')
  @ApiOperation({ summary: 'Like a post' })
  @ApiParam({ name: 'communityId', description: 'Community ID' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  async likePost(
    @CurrentUser() user: User,
    @Param('postId') postId: string,
  ) {
    return this.postsService.likePost((user as any)._id, postId);
  }

  @Post(':postId/unlike')
  @ApiOperation({ summary: 'Unlike a post' })
  @ApiParam({ name: 'communityId', description: 'Community ID' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  async unlikePost(
    @CurrentUser() user: User,
    @Param('postId') postId: string,
  ) {
    return this.postsService.unlikePost((user as any)._id, postId);
  }
}