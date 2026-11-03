import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { FallbackEngineService } from './fallback-engine.service';
import { ContextService, ModuleContextPayload } from './context.service';
import { AiMessageInput } from './providers/ai-provider.interface';

export interface SendMessageDto {
  conversationId?: string;
  message: string;
  module?: string;
  context?: ModuleContextPayload;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fallbackEngine: FallbackEngineService,
    private readonly contextService: ContextService,
  ) {}

  /**
   * Retrieves all active conversations for the authenticated user (isolated strictly by userId).
   */
  async listConversations(userId: string) {
    const conversations = await this.prisma.aIConversation.findMany({
      where: { userId, isArchived: false },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { content: true, role: true, createdAt: true },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    return conversations.map((c) => ({
      id: c.id,
      title: c.title,
      module: c.module,
      messageCount: c._count.messages,
      lastMessage: c.messages[0]?.content?.slice(0, 80) || null,
      updatedAt: c.updatedAt,
      createdAt: c.createdAt,
    }));
  }

  /**
   * Retrieves a specific conversation with all its messages, guaranteeing user isolation.
   */
  async getConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.aIConversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found or access denied.');
    }

    return conversation;
  }

  /**
   * Creates a new conversation for the authenticated user.
   */
  async createConversation(userId: string, title?: string, module?: string) {
    return this.prisma.aIConversation.create({
      data: {
        userId,
        title: title?.trim() || 'New Conversation',
        module: module?.trim().toUpperCase() || 'GENERAL',
      },
    });
  }

  /**
   * Renames a conversation, verifying ownership.
   */
  async renameConversation(userId: string, conversationId: string, newTitle: string) {
    const conversation = await this.prisma.aIConversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found or access denied.');
    }

    return this.prisma.aIConversation.update({
      where: { id: conversationId },
      data: { title: newTitle.trim().slice(0, 100) || 'Untitled' },
    });
  }

  /**
   * Deletes a conversation and all its messages.
   */
  async deleteConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.aIConversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found or access denied.');
    }

    await this.prisma.aIConversation.delete({
      where: { id: conversationId },
    });

    return { message: 'Conversation deleted successfully.' };
  }

  /**
   * Sends a message into a conversation, executes AI generation with fallback, and records messages.
   */
  async sendMessage(userId: string, input: SendMessageDto) {
    const cleanContent = input.message?.trim();
    if (!cleanContent) {
      throw new BadRequestException('Message content cannot be empty.');
    }

    let conversation: any = null;

    // 1. Resolve or create conversation
    if (input.conversationId && input.conversationId !== 'new') {
      conversation = await this.prisma.aIConversation.findFirst({
        where: { id: input.conversationId, userId },
      });
      if (!conversation) {
        throw new NotFoundException('Conversation not found or access denied.');
      }
    } else {
      const generatedTitle = this.generateTitleFromPrompt(cleanContent);
      conversation = await this.prisma.aIConversation.create({
        data: {
          userId,
          title: generatedTitle,
          module: input.module?.toUpperCase() || 'GENERAL',
        },
      });
    }

    // 2. Persist user message
    const userMessage = await this.prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: cleanContent,
      },
    });

    // 3. Fetch rolling historical conversation messages (last 10 for context window)
    const history = await this.prisma.aIMessage.findMany({
      where: { conversationId: conversation.id, id: { not: userMessage.id } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    history.reverse();

    // 4. Build tailored module system prompt
    const systemPrompt = await this.contextService.buildSystemPrompt(userId, {
      module: input.module || conversation.module,
      route: input.context?.route,
      recordId: input.context?.recordId,
      fieldId: input.context?.fieldId,
      extraInfo: input.context?.extraInfo,
    });

    // 5. Construct payload for provider
    const formattedMessages: AiMessageInput[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user', content: cleanContent },
    ];

    // 6. Execute through Fallback Engine
    const { result, fallbackOccurred, attempts } = await this.fallbackEngine.executeWithFallback(formattedMessages);

    // 7. Persist assistant response
    const assistantMessage = await this.prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: result.content,
        provider: result.provider,
        model: result.model,
        promptTokens: result.promptTokens || null,
        completionTokens: result.completionTokens || null,
        totalTokens: result.totalTokens || null,
        latencyMs: result.latencyMs,
        metadata: {
          fallbackOccurred,
          attempts: attempts.map((a) => ({ provider: a.provider, error: a.error })),
        },
      },
    });

    // 8. Auto-update title if initial conversation had default title
    if (conversation.title === 'New Conversation') {
      const newTitle = this.generateTitleFromPrompt(cleanContent);
      await this.prisma.aIConversation.update({
        where: { id: conversation.id },
        data: { title: newTitle, updatedAt: new Date() },
      });
      conversation.title = newTitle;
    } else {
      await this.prisma.aIConversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });
    }

    return {
      conversationId: conversation.id,
      title: conversation.title,
      module: conversation.module,
      userMessage,
      assistantMessage,
      providerUsed: result.provider,
      modelUsed: result.model,
      fallbackOccurred,
      latencyMs: result.latencyMs,
    };
  }

  /**
   * Helper to derive a clean conversational title from the first prompt.
   */
  private generateTitleFromPrompt(prompt: string): string {
    const cleaned = prompt.replace(/[#*`_]/g, '').trim();
    const words = cleaned.split(/\s+/).slice(0, 6).join(' ');
    return words.length > 40 ? `${words.slice(0, 37)}...` : words || 'New Conversation';
  }

  /**
   * Backward-compatible structured roadmap endpoint using the resilient fallback engine.
   */
  async generateRoadmap(field: string, targetRole: string, currentLevel: string) {
    const prompt = `Generate a rigorous, 3-phase curriculum roadmap for becoming a ${targetRole} in ${field}. The learner's current proficiency is ${currentLevel}. Structure your output clearly into Phase 1 (Core Foundations), Phase 2 (Production Architecture & Testing), and Phase 3 (Commercial Capstone & Scale). Include concrete lab milestones and portfolio suggestions.`;

    try {
      const { result } = await this.fallbackEngine.executeWithFallback([
        { role: 'system', content: 'You are the Provolution Technologies EES Curriculum Architect.' },
        { role: 'user', content: prompt },
      ]);

      return {
        field,
        targetRole,
        currentLevel,
        content: result.content,
        provider: result.provider,
        model: result.model,
        notice:
          'AI suggestions serve as learning guidance only. All skill verifications and opportunity selections require human evaluation and verifiable portfolio evidence.',
      };
    } catch {
      // Deterministic baseline if offline
      return {
        field,
        targetRole,
        currentLevel,
        phases: [
          {
            phase: 1,
            title: 'Core Foundations & Mental Models',
            duration: 'Weeks 1-4',
            milestones: [`Master foundational patterns of ${field}`, 'Build 3 targeted lab exercises', 'Publish clean Git repositories'],
          },
          {
            phase: 2,
            title: 'Production Architecture & Tooling',
            duration: 'Weeks 5-8',
            milestones: [`Implement high-throughput design patterns for ${targetRole}`, 'Integrate CI/CD validation', 'Participate in peer code reviews'],
          },
          {
            phase: 3,
            title: 'Commercial Capstone & Scale Readiness',
            duration: 'Weeks 9-12',
            milestones: ['Deploy production capstone with live demo', 'Submit evidence to EES Portfolio', 'Apply for Provolution contract assignments'],
          },
        ],
        provider: 'EES Curriculum Engine (Resilient Mode)',
        notice:
          'AI suggestions serve as learning guidance only. All skill verifications and opportunity selections require human evaluation and verifiable portfolio evidence.',
      };
    }
  }

  /**
   * Backward-compatible project brainstormer.
   */
  async brainstormProjects(field: string, skills: string[]) {
    const prompt = `Brainstorm 2 distinct, enterprise-grade project portfolio briefs for a specialist in ${field} with skills in ${skills.join(', ')}. Include titles, architectural scopes, estimated hours, and recommended portfolio evidence.`;

    try {
      const { result } = await this.fallbackEngine.executeWithFallback([
        { role: 'system', content: 'You are the Provolution Technologies EES Project Architect.' },
        { role: 'user', content: prompt },
      ]);

      return {
        field,
        skills,
        brainstormContent: result.content,
        provider: result.provider,
        model: result.model,
      };
    } catch {
      return {
        field,
        recommendedProjects: [
          {
            title: `Full-Stack ${field} Collaborative Platform`,
            description: `Architect a modern application utilizing ${skills.join(', ')} with end-to-end type safety, automated migrations, and responsive UI.`,
            evidenceRecommendation: 'GitHub repository with clean README, architecture diagram, and deployed demo link.',
            estimatedHours: 40,
          },
        ],
      };
    }
  }
}
