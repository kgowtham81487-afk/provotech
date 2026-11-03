import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { EngageService } from './engage.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreatePostSchema,
  CreateCommentSchema,
  CreateCommunitySchema,
  SendMessageSchema,
} from '@ees/shared';

@ApiTags('Engage — Social Network')
@Controller('engage')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class EngageController {
  constructor(private readonly engageService: EngageService) {}

  @Get('feed')
  @ApiOperation({ summary: 'Retrieve social feed (for-you, field, following, showcase)' })
  async getFeed(
    @CurrentUser('id') userId: string,
    @Query('type') type?: 'for-you' | 'field' | 'following' | 'showcase',
    @Query('fieldId') fieldId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.engageService.getFeed(userId, { type, fieldId, page, limit });
  }

  @Post('posts')
  @ApiOperation({ summary: 'Create a new post with text, media, tags' })
  async createPost(@CurrentUser('id') userId: string, @Body() body: any) {
    const input = CreatePostSchema.parse(body);
    return this.engageService.createPost(userId, input);
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: 'Delete post by author or moderator' })
  async deletePost(
    @CurrentUser('id') userId: string,
    @CurrentUser('roles') roles: string[],
    @Param('id') postId: string,
  ) {
    return this.engageService.deletePost(userId, postId, roles || []);
  }

  @Post('posts/:id/like')
  @ApiOperation({ summary: 'Toggle like on post' })
  async toggleLike(@CurrentUser('id') userId: string, @Param('id') postId: string) {
    return this.engageService.toggleLike(userId, postId);
  }

  @Post('posts/:id/comments')
  @ApiOperation({ summary: 'Add comment to post' })
  async addComment(
    @CurrentUser('id') userId: string,
    @Param('id') postId: string,
    @Body() body: any,
  ) {
    const input = CreateCommentSchema.parse(body);
    return this.engageService.addComment(userId, postId, input);
  }

  @Get('posts/:id/comments')
  @ApiOperation({ summary: 'List comments for post' })
  async listComments(@Param('id') postId: string) {
    return this.engageService.listComments(postId);
  }

  @Post('users/:id/follow')
  @ApiOperation({ summary: 'Toggle follow on a user' })
  async toggleFollow(@CurrentUser('id') followerId: string, @Param('id') targetUserId: string) {
    return this.engageService.toggleFollow(followerId, targetUserId);
  }

  @Get('communities')
  @ApiOperation({ summary: 'List communities' })
  async listCommunities(@Query('fieldId') fieldId?: string) {
    return this.engageService.listCommunities(fieldId);
  }

  @Post('communities')
  @ApiOperation({ summary: 'Create community' })
  async createCommunity(@CurrentUser('id') userId: string, @Body() body: any) {
    const input = CreateCommunitySchema.parse(body);
    return this.engageService.createCommunity(userId, input);
  }

  @Post('communities/:id/join')
  @ApiOperation({ summary: 'Join or leave community' })
  async joinCommunity(@CurrentUser('id') userId: string, @Param('id') communityId: string) {
    return this.engageService.joinCommunity(userId, communityId);
  }

  @Get('messages')
  @ApiOperation({ summary: 'List conversations and recent messages' })
  async listConversations(@CurrentUser('id') userId: string) {
    return this.engageService.listConversations(userId);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send direct message to another user' })
  async sendMessage(@CurrentUser('id') senderId: string, @Body() body: any) {
    const input = SendMessageSchema.parse(body);
    return this.engageService.sendMessage(senderId, input);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'List notifications for current user' })
  async listNotifications(@CurrentUser('id') userId: string) {
    return this.engageService.listNotifications(userId);
  }
}

