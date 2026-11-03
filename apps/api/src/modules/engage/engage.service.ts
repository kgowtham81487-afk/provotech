import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePostInput, CreateCommentInput, CreateCommunityInput, SendMessageInput } from '@ees/shared';

@Injectable()
export class EngageService {
  constructor(private readonly prisma: PrismaService) {}

  async getFeed(
    userId: string,
    params: {
      type?: 'for-you' | 'field' | 'following' | 'showcase';
      fieldId?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.type === 'field' && params.fieldId) {
      where.fieldId = params.fieldId;
    } else if (params.type === 'following') {
      const followingRecords = await this.prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      const followingIds = followingRecords.map((f) => f.followingId);
      where.authorId = { in: [...followingIds, userId] };
    } else if (params.type === 'for-you') {
      // Find user fields
      const userFields = await this.prisma.userField.findMany({
        where: { userId },
        select: { fieldId: true },
      });
      if (userFields.length > 0) {
        where.OR = [
          { fieldId: { in: userFields.map((f) => f.fieldId) } },
          { fieldId: null },
        ];
      }
    }

    const [total, posts] = await Promise.all([
      this.prisma.post.count({ where }),
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          field: { select: { id: true, name: true, slug: true } },
          likes: {
            where: { userId },
            select: { id: true },
          },
          bookmarks: {
            where: { userId },
            select: { id: true },
          },
        },
      }),
    ]);

    return {
      data: posts.map((p) => ({
        id: p.id,
        content: p.content,
        mediaUrls: p.mediaUrls,
        hashtags: p.hashtags,
        field: p.field,
        author: {
          id: p.author.id,
          username: p.author.profile?.username,
          displayName: p.author.profile?.displayName,
          avatarUrl: p.author.profile?.avatarUrl,
        },
        likeCount: p.likeCount,
        commentCount: p.commentCount,
        repostCount: p.repostCount,
        isLiked: p.likes.length > 0,
        isBookmarked: p.bookmarks.length > 0,
        createdAt: p.createdAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createPost(userId: string, input: CreatePostInput) {
    const post = await this.prisma.$transaction(async (tx) => {
      const p = await tx.post.create({
        data: {
          authorId: userId,
          fieldId: input.fieldId || null,
          content: input.content.trim(),
          mediaUrls: input.mediaUrls,
          hashtags: input.hashtags,
        },
        include: {
          author: {
            select: {
              id: true,
              profile: { select: { username: true, displayName: true, avatarUrl: true } },
            },
          },
          field: true,
        },
      });

      // Award XP (+75 XP)
      await tx.xPTransaction.create({
        data: {
          userId,
          amount: 75,
          action: 'POST_PUBLISHED',
          refId: p.id,
        },
      });

      // Unlock Community Voice achievement
      const ach = await tx.achievement.findUnique({ where: { title: 'Community Voice' } });
      if (ach) {
        await tx.userAchievement.upsert({
          where: { userId_achievementId: { userId, achievementId: ach.id } },
          update: {},
          create: { userId, achievementId: ach.id },
        });
      }

      return p;
    });

    return post;
  }

  async deletePost(userId: string, postId: string, userRoles: string[]) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    const isAuthor = post.authorId === userId;
    const isAdmin = userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN') || userRoles.includes('MODERATOR');

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenException('You are not authorized to delete this post.');
    }

    await this.prisma.post.delete({ where: { id: postId } });
    return { message: 'Post successfully deleted.' };
  }

  async toggleLike(userId: string, postId: string) {
    const existingLike = await this.prisma.like.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existingLike) {
      await this.prisma.$transaction([
        this.prisma.like.delete({
          where: { id: existingLike.id },
        }),
        this.prisma.post.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
        }),
      ]);
      return { isLiked: false };
    } else {
      await this.prisma.$transaction([
        this.prisma.like.create({
          data: { postId, userId },
        }),
        this.prisma.post.update({
          where: { id: postId },
          data: { likeCount: { increment: 1 } },
        }),
      ]);
      return { isLiked: true };
    }
  }

  async addComment(userId: string, postId: string, input: CreateCommentInput) {
    const comment = await this.prisma.$transaction(async (tx) => {
      const c = await tx.comment.create({
        data: {
          postId,
          authorId: userId,
          content: input.content.trim(),
          parentId: input.parentId || null,
        },
        include: {
          author: {
            select: {
              id: true,
              profile: { select: { username: true, displayName: true, avatarUrl: true } },
            },
          },
        },
      });

      await tx.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      });

      return c;
    });

    return comment;
  }

  async listComments(postId: string) {
    return this.prisma.comment.findMany({
      where: { postId, parentId: null },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            profile: { select: { username: true, displayName: true, avatarUrl: true } },
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                profile: { select: { username: true, displayName: true, avatarUrl: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async toggleFollow(followerId: string, targetUserId: string) {
    if (followerId === targetUserId) {
      throw new BadRequestException('You cannot follow yourself.');
    }

    const existingFollow = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId: targetUserId } },
    });

    if (existingFollow) {
      await this.prisma.follow.delete({ where: { id: existingFollow.id } });
      return { isFollowing: false };
    } else {
      await this.prisma.follow.create({
        data: { followerId, followingId: targetUserId },
      });

      // Notification
      await this.prisma.notification.create({
        data: {
          userId: targetUserId,
          type: 'FOLLOW',
          title: 'New Follower',
          message: 'Someone started following your development journey.',
          link: `/profile/${followerId}`,
        },
      });

      return { isFollowing: true };
    }
  }

  async listCommunities(fieldId?: string) {
    const where: any = {};
    if (fieldId) where.fieldId = fieldId;

    return this.prisma.community.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        field: true,
        _count: { select: { members: true } },
      },
    });
  }

  async createCommunity(userId: string, input: CreateCommunityInput) {
    const existing = await this.prisma.community.findUnique({ where: { slug: input.slug } });
    if (existing) {
      throw new BadRequestException('Community slug is already taken.');
    }

    const community = await this.prisma.community.create({
      data: {
        name: input.name.trim(),
        slug: input.slug.trim().toLowerCase(),
        description: input.description.trim(),
        fieldId: input.fieldId,
        isPrivate: input.isPrivate,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
      include: {
        field: true,
      },
    });

    return community;
  }

  async joinCommunity(userId: string, communityId: string) {
    const existingMember = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });

    if (existingMember) {
      await this.prisma.communityMember.delete({ where: { id: existingMember.id } });
      return { isMember: false };
    } else {
      await this.prisma.communityMember.create({
        data: { communityId, userId, role: 'MEMBER' },
      });
      return { isMember: true };
    }
  }

  async listConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                profile: { select: { username: true, displayName: true, avatarUrl: true } },
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async sendMessage(senderId: string, input: SendMessageInput) {
    if (senderId === input.recipientId) {
      throw new BadRequestException('Cannot send message to yourself.');
    }

    // Find or create direct conversation
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId: senderId } } },
          { participants: { some: { userId: input.recipientId } } },
        ],
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          isGroup: false,
          participants: {
            create: [{ userId: senderId }, { userId: input.recipientId }],
          },
        },
      });
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId,
        content: input.content.trim(),
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    // Notify recipient
    await this.prisma.notification.create({
      data: {
        userId: input.recipientId,
        type: 'MESSAGE',
        title: 'New Direct Message',
        message: input.content.slice(0, 80),
        link: `/engage/messages?conversationId=${conversation.id}`,
      },
    });

    return message;
  }

  async listNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }
}

