import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService, SendMessageDto } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('AI Hub & Chat')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'List all active conversations for the authenticated user' })
  async listConversations(@CurrentUser('id') userId: string) {
    return this.aiService.listConversations(userId);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Create a new AI conversation' })
  async createConversation(
    @CurrentUser('id') userId: string,
    @Body() body: { title?: string; module?: string },
  ) {
    return this.aiService.createConversation(userId, body?.title, body?.module);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Retrieve conversation messages and details' })
  async getConversation(
    @CurrentUser('id') userId: string,
    @Param('id') conversationId: string,
  ) {
    return this.aiService.getConversation(userId, conversationId);
  }

  @Patch('conversations/:id')
  @ApiOperation({ summary: 'Rename a conversation' })
  async renameConversation(
    @CurrentUser('id') userId: string,
    @Param('id') conversationId: string,
    @Body() body: { title: string },
  ) {
    return this.aiService.renameConversation(userId, conversationId, body.title);
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Delete a conversation' })
  async deleteConversation(
    @CurrentUser('id') userId: string,
    @Param('id') conversationId: string,
  ) {
    return this.aiService.deleteConversation(userId, conversationId);
  }

  @Post('chat')
  @ApiOperation({ summary: 'Send message with conversational context and automatic provider fallback' })
  async chat(
    @CurrentUser('id') userId: string,
    @Body() body: SendMessageDto,
  ) {
    return this.aiService.sendMessage(userId, body);
  }

  @Post('roadmap')
  @ApiOperation({ summary: 'Generate structured learning roadmap' })
  async generateRoadmap(
    @Body() body: { field: string; targetRole: string; currentLevel: string },
  ) {
    return this.aiService.generateRoadmap(body.field, body.targetRole, body.currentLevel);
  }

  @Post('brainstorm')
  @ApiOperation({ summary: 'Brainstorm project architectures for portfolio' })
  async brainstormProjects(@Body() body: { field: string; skills: string[] }) {
    return this.aiService.brainstormProjects(body.field, body.skills || []);
  }
}
