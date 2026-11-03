import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FallbackEngineService } from '../src/modules/ai/fallback-engine.service';
import { ContextService } from '../src/modules/ai/context.service';
import { AiService } from '../src/modules/ai/ai.service';
import { AdminService } from '../src/modules/admin/admin.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { PrismaService } from '../src/database/prisma.service';
import { GroqProvider } from '../src/modules/ai/providers/groq.provider';
import { GeminiProvider } from '../src/modules/ai/providers/gemini.provider';
import {
  AiAuthError,
  AiEmptyResponseError,
  AiQuotaError,
  AiRateLimitError,
  AiServerError,
  AiInsufficientBalanceError,
  AiModelNotFoundError,
  AiProvider,
} from '../src/modules/ai/providers/ai-provider.interface';
import { NotFoundException } from '@nestjs/common';

describe('AI Multi-Provider Fallback, Context & Admin Security Tests', () => {
  let fallbackEngine: FallbackEngineService;
  let contextService: ContextService;
  let aiService: AiService;
  let adminService: AdminService;
  let authService: AuthService;
  let mockPrisma: any;

  // Mock providers
  let mockGemini: AiProvider;
  let mockDeepSeek: AiProvider;
  let mockGroq: AiProvider;

  const defaultChain = [
    { provider: 'GEMINI', isEnabled: true, priority: 1, model: 'gemini-1.5-flash', timeoutMs: 30000, maxTokens: 2048, temperature: 0.7 },
    { provider: 'DEEPSEEK', isEnabled: true, priority: 2, model: 'deepseek-chat', timeoutMs: 30000, maxTokens: 2048, temperature: 0.7 },
    { provider: 'GROQ', isEnabled: true, priority: 3, model: 'llama-3.3-70b-versatile', timeoutMs: 30000, maxTokens: 2048, temperature: 0.7 },
  ];

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
      conversation: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      message: {
        create: vi.fn().mockImplementation(async ({ data }: any) => ({
          id: 'msg-' + Math.random().toString(36).substring(7),
          ...data,
          createdAt: new Date(),
        })),
        findMany: vi.fn().mockResolvedValue([]),
      },
      get aIConversation() {
        return this.conversation;
      },
      get aIMessage() {
        return this.message;
      },
      aIProviderConfiguration: {
        findMany: vi.fn().mockResolvedValue(defaultChain),
        findUnique: vi.fn(),
        upsert: vi.fn(),
        update: vi.fn(),
      },
      aIProviderHealth: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn(),
      },
      platformConfig: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn(),
      },
      skill: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn().mockResolvedValue(1),
      },
      userSkill: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      opportunity: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn().mockResolvedValue(1),
      },
      opportunityApplication: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      learningGoal: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      studySession: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      fieldOfMastery: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      contractAssignment: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      passwordResetToken: {
        create: vi.fn(),
        updateMany: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
      $transaction: vi.fn().mockImplementation(async (cb) => {
        if (Array.isArray(cb)) return Promise.all(cb);
        return cb(mockPrisma);
      }),
    };

    mockGemini = {
      name: 'gemini',
      isConfigured: vi.fn().mockReturnValue(true),
      getDefaultModel: vi.fn().mockReturnValue('gemini-1.5-flash'),
      generate: vi.fn(),
      testConnection: vi.fn().mockResolvedValue({ success: true, latencyMs: 120, provider: 'gemini', model: 'gemini-1.5-flash' }),
    };

    mockDeepSeek = {
      name: 'deepseek',
      isConfigured: vi.fn().mockReturnValue(true),
      getDefaultModel: vi.fn().mockReturnValue('deepseek-chat'),
      generate: vi.fn(),
      testConnection: vi.fn().mockResolvedValue({ success: true, latencyMs: 250, provider: 'deepseek', model: 'deepseek-chat' }),
    };

    mockGroq = {
      name: 'groq',
      isConfigured: vi.fn().mockReturnValue(true),
      getDefaultModel: vi.fn().mockReturnValue('llama-3.3-70b-versatile'),
      generate: vi.fn(),
      testConnection: vi.fn().mockResolvedValue({ success: true, latencyMs: 80, provider: 'groq', model: 'llama-3.3-70b-versatile' }),
    };

    fallbackEngine = new FallbackEngineService(
      mockPrisma as unknown as PrismaService,
      mockGemini as any,
      mockDeepSeek as any,
      mockGroq as any,
    );

    contextService = new ContextService(mockPrisma as unknown as PrismaService);
    aiService = new AiService(
      mockPrisma as unknown as PrismaService,
      fallbackEngine,
      contextService,
    );
    adminService = new AdminService(
      mockPrisma as unknown as PrismaService,
      fallbackEngine,
    );
    authService = new AuthService(mockPrisma as unknown as PrismaService);
  });

  describe('Scenario 1: Fallback Engine Cascade (Gemini -> DeepSeek -> Groq)', () => {
    it('should fall back to DeepSeek when Gemini hits rate limit (429)', async () => {
      vi.mocked(mockGemini.generate).mockRejectedValue(
        new AiRateLimitError('gemini', 429, 'Resource has been exhausted (e.g. check quota)'),
      );

      vi.mocked(mockDeepSeek.generate).mockResolvedValue({
        content: 'Response generated by DeepSeek fallback model.',
        provider: 'DEEPSEEK',
        model: 'deepseek-chat',
        totalTokens: 150,
        latencyMs: 320,
      });

      const res = await fallbackEngine.executeWithFallback([
        { role: 'user', content: 'What skills should I learn?' },
      ]);

      expect(res.fallbackOccurred).toBe(true);
      expect(res.result.provider).toBe('DEEPSEEK');
      expect(res.result.content).toBe('Response generated by DeepSeek fallback model.');
      expect(mockGemini.generate).toHaveBeenCalledTimes(1);
      expect(mockDeepSeek.generate).toHaveBeenCalledTimes(1);
      expect(mockGroq.generate).not.toHaveBeenCalled();
    });

    it('should cascade to Groq when both Gemini and DeepSeek fail with quota exhaustion', async () => {
      vi.mocked(mockGemini.generate).mockRejectedValue(
        new AiQuotaError('gemini', 'Gemini project monthly quota exhausted'),
      );

      vi.mocked(mockDeepSeek.generate).mockRejectedValue(
        new AiQuotaError('deepseek', 'DeepSeek billing insufficient balance'),
      );

      vi.mocked(mockGroq.generate).mockResolvedValue({
        content: 'Response delivered by ultra-fast Groq Llama-3.3.',
        provider: 'GROQ',
        model: 'llama-3.3-70b-versatile',
        totalTokens: 120,
        latencyMs: 95,
      });

      const res = await fallbackEngine.executeWithFallback([
        { role: 'user', content: 'Recommend high-paying contracts.' },
      ]);

      expect(res.fallbackOccurred).toBe(true);
      expect(res.result.provider).toBe('GROQ');
      expect(res.result.content).toContain('Response delivered by ultra-fast Groq');
      expect(mockGemini.generate).toHaveBeenCalled();
      expect(mockDeepSeek.generate).toHaveBeenCalled();
      expect(mockGroq.generate).toHaveBeenCalled();
    });

    it('should return a graceful emergency response when all 3 providers fail', async () => {
      vi.mocked(mockGemini.generate).mockRejectedValue(
        new AiServerError('gemini', 503, 'Service unavailable'),
      );
      vi.mocked(mockDeepSeek.generate).mockRejectedValue(
        new AiAuthError('deepseek', 401, 'Invalid API Key'),
      );
      vi.mocked(mockGroq.generate).mockRejectedValue(
        new AiEmptyResponseError('groq'),
      );

      const res = await fallbackEngine.executeWithFallback([
        { role: 'user', content: 'Hello assistant' },
      ]);

      expect(res.fallbackOccurred).toBe(true);
      expect(res.result.model).toBe('ees-resilient-fallback');
      expect(res.result.content).toContain('Service Notice');
    });

    it('should respect admin fallback order configuration', async () => {
      mockPrisma.aIProviderConfiguration.findMany.mockResolvedValue([
        { provider: 'GROQ', isEnabled: true, priority: 1, model: 'llama-3.3-70b-versatile', timeoutMs: 30000, maxTokens: 4096, temperature: 0.7 },
        { provider: 'DEEPSEEK', isEnabled: true, priority: 2, model: 'deepseek-chat', timeoutMs: 30000, maxTokens: 4096, temperature: 0.7 },
        { provider: 'GEMINI', isEnabled: true, priority: 3, model: 'gemini-1.5-flash', timeoutMs: 30000, maxTokens: 4096, temperature: 0.7 },
      ]);

      vi.mocked(mockGroq.generate).mockResolvedValue({
        content: 'Groq prioritized by admin.',
        provider: 'GROQ',
        model: 'llama-3.3-70b-versatile',
        totalTokens: 80,
        latencyMs: 70,
      });

      const res = await fallbackEngine.executeWithFallback([
        { role: 'user', content: 'Testing priority' },
      ]);

      expect(res.result.provider).toBe('GROQ');
      expect(mockGroq.generate).toHaveBeenCalledTimes(1);
      expect(mockDeepSeek.generate).not.toHaveBeenCalled();
      expect(mockGemini.generate).not.toHaveBeenCalled();
    });
  });

  describe('Scenario 2: Conversational Isolation & Multi-turn History', () => {
    it('should throw NotFoundException when a user attempts to access another user conversation', async () => {
      const userA = 'user-a-uuid';
      const conversationId = 'conv-123';

      mockPrisma.conversation.findFirst.mockResolvedValue(null);

      await expect(
        aiService.getConversation(conversationId, userA),
      ).rejects.toThrow(NotFoundException);
    });

    it('should maintain conversation history and persist new assistant messages', async () => {
      const userId = 'user-123';
      const conversationId = 'conv-123';

      mockPrisma.conversation.findFirst.mockResolvedValue({
        id: conversationId,
        userId,
        messages: [
          { id: 'm1', role: 'user', content: 'First question', createdAt: new Date() },
          { id: 'm2', role: 'assistant', content: 'First answer', createdAt: new Date() },
        ],
      });

      vi.mocked(mockGemini.generate).mockResolvedValue({
        content: 'Second answer with context.',
        provider: 'GEMINI',
        model: 'gemini-1.5-flash',
        totalTokens: 60,
        latencyMs: 110,
      });

      const response = await aiService.sendMessage(userId, {
        conversationId,
        message: 'Follow-up question',
        moduleContext: 'GENERAL',
      });

      expect(response.assistantMessage.content).toBe('Second answer with context.');
      expect(response.providerUsed).toBe('GEMINI');
      expect(mockPrisma.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            conversationId,
            role: 'assistant',
            content: 'Second answer with context.',
            provider: 'GEMINI',
          }),
        }),
      );
    });
  });

  describe('Scenario 3: Module Context Extraction & System Prompt Assembly', () => {
    it('should inject real Skills catalog into AI system prompt when module is SKILLS', async () => {
      mockPrisma.skill.findMany.mockResolvedValue([
        { id: 's1', name: 'TypeScript', category: { name: 'Engineering' } },
        { id: 's2', name: 'Next.js App Router', category: { name: 'Engineering' } },
      ]);

      const systemPrompt = await contextService.buildSystemPrompt('user-1', { module: 'SKILLS' });

      expect(systemPrompt).toContain('MODULE FOCUS: SKILLS DEVELOPMENT & CURRICULUM');
      expect(systemPrompt).toContain('TypeScript [Category: Engineering]');
      expect(systemPrompt).toContain('Next.js App Router [Category: Engineering]');
    });

    it('should inject real open Opportunities into AI system prompt when module is OPPORTUNITIES', async () => {
      mockPrisma.opportunity.findMany.mockResolvedValue([
        {
          id: 'opp-1',
          title: 'Full Stack Engineer Contract',
          type: 'FREELANCE',
          organization: 'Provolution Technologies',
          compensationAmount: 2500,
          currency: 'USD',
          status: 'OPEN',
          scope: 'Comprehensive full-stack development and architecture for EES platform.',
          requiredSkills: [{ skill: { name: 'TypeScript' } }],
          createdAt: new Date(),
        },
      ]);

      const systemPrompt = await contextService.buildSystemPrompt('user-1', { module: 'OPPORTUNITIES' });

      expect(systemPrompt).toContain('MODULE FOCUS: SCALE & OPPORTUNITY MARKETPLACE');
      expect(systemPrompt).toContain('Full Stack Engineer Contract');
      expect(systemPrompt).toContain('USD 2500');
      expect(systemPrompt).toContain('TypeScript');
    });
  });

  describe('Scenario 4: Admin Skills & Opportunities CRUD & Moderation', () => {
    it('should allow admin to list and toggle active state of skills', async () => {
      mockPrisma.skill.findMany.mockResolvedValue([
        { id: 'skill-1', name: 'PostgreSQL Architecture', isActive: true },
      ]);
      mockPrisma.skill.findUnique.mockResolvedValue({
        id: 'skill-1',
        name: 'PostgreSQL Architecture',
        isActive: true,
      });
      mockPrisma.skill.update.mockResolvedValue({
        id: 'skill-1',
        name: 'PostgreSQL Architecture',
        isActive: false,
      });

      const result = await adminService.listSkills();
      expect(result.items.length).toBe(1);

      const updated = await adminService.updateSkill('skill-1', { isActive: false });
      expect(updated.isActive).toBe(false);
      expect(mockPrisma.skill.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'skill-1' },
          data: { isActive: false },
        }),
      );
    });

    it('should allow admin to publish (OPEN) and unpublish (DRAFT) opportunities', async () => {
      mockPrisma.opportunity.findUnique.mockResolvedValue({
        id: 'opp-1',
        title: 'Backend API Developer',
        status: 'DRAFT',
      });
      mockPrisma.opportunity.update.mockResolvedValue({
        id: 'opp-1',
        title: 'Backend API Developer',
        status: 'OPEN',
      });

      const published = await adminService.updateOpportunity('opp-1', { status: 'OPEN' });
      expect(published.status).toBe('OPEN');
      expect(mockPrisma.opportunity.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'opp-1' },
          data: { status: 'OPEN' },
        }),
      );
    });
  });

  describe('Scenario 5: Password Reset Link Production URL Safety', () => {
    it('should construct password reset link using FRONTEND_URL or NEXT_PUBLIC_APP_URL', async () => {
      process.env.FRONTEND_URL = 'https://provotech.onrender.com';
      process.env.RESET_TOKEN_EXPIRY_MINUTES = '60';

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-reset-1',
        email: 'user@provolution.com',
        status: 'ACTIVE',
      });

      mockPrisma.passwordResetToken.create.mockResolvedValue({
        id: 'reset-record-1',
        userId: 'user-reset-1',
        tokenHash: 'hashed-token-value',
        expiresAt: new Date(Date.now() + 3600000),
      });

      const result = await authService.forgotPassword('user@provolution.com');

      expect(result.message).toContain('If an account exists');
      expect(result.debugResetLink).toBeDefined();
      expect(result.debugResetLink).toContain('https://provotech.onrender.com/reset-password?token=');
      expect(result.debugResetLink!.startsWith('http://localhost')).toBe(false);
    });
  });

  describe('Scenario 6: AI Provider Model Configuration, Error Classification & Connectivity Repair', () => {
    it('should fall back from Gemini 404 (model not found) and DeepSeek 402 (insufficient balance) to Groq', async () => {
      vi.mocked(mockGemini.generate).mockRejectedValue(
        new AiModelNotFoundError('gemini', 'gemini-1.5-flash', 'Model not found for API version v1beta or unsupported generateContent'),
      );

      vi.mocked(mockDeepSeek.generate).mockRejectedValue(
        new AiInsufficientBalanceError('deepseek', 'Insufficient Balance'),
      );

      vi.mocked(mockGroq.generate).mockResolvedValue({
        content: 'EES AI connection successful.',
        provider: 'GROQ',
        model: 'llama-3.1-8b-instant',
        totalTokens: 10,
        latencyMs: 140,
      });

      const res = await fallbackEngine.executeWithFallback([
        { role: 'user', content: 'Reply with exactly: EES AI connection successful.' },
      ]);

      expect(res.fallbackOccurred).toBe(true);
      expect(res.result.provider).toBe('GROQ');
      expect(res.result.content).toBe('EES AI connection successful.');
      expect(mockGemini.generate).toHaveBeenCalled();
      expect(mockDeepSeek.generate).toHaveBeenCalled();
      expect(mockGroq.generate).toHaveBeenCalled();
    });

    it('should not set a cooldown timer for permanent errors like 402 Insufficient Balance or 404 Model Not Found', async () => {
      vi.mocked(mockDeepSeek.testConnection).mockResolvedValue({
        success: false,
        provider: 'DEEPSEEK',
        model: 'deepseek-chat',
        httpStatus: 402,
        errorCategory: 'INSUFFICIENT_BALANCE',
        latencyMs: 110,
        message: 'Insufficient Balance',
      });

      const result = await fallbackEngine.testProvider('DEEPSEEK');

      expect(result.success).toBe(false);
      expect(result.httpStatus).toBe(402);
      expect(result.errorCategory).toBe('INSUFFICIENT_BALANCE');

      expect(mockPrisma.aIProviderHealth.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { provider: 'DEEPSEEK' },
          update: expect.objectContaining({
            isHealthy: false,
            cooldownUntil: null, // Zero cooldown for permanent billing failure!
            lastErrorMessage: expect.stringContaining('[INSUFFICIENT_BALANCE]'),
          }),
        }),
      );
    });

    it('should discover models and cache them in provider metadata', async () => {
      (mockGroq as any).discoverModels = vi.fn().mockResolvedValue([
        { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', isRecommended: true },
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile' },
      ]);

      mockPrisma.aIProviderConfiguration.findUnique.mockResolvedValue({
        provider: 'GROQ',
        metadata: {},
      });

      const models = await fallbackEngine.discoverModels('GROQ');

      expect(models.length).toBe(2);
      expect(models[0].id).toBe('llama-3.1-8b-instant');
      expect(mockPrisma.aIProviderConfiguration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { provider: 'GROQ' },
          data: expect.objectContaining({
            metadata: expect.objectContaining({
              discoveredModels: models,
            }),
          }),
        }),
      );
    });

    it('should compute all 8 distinct provider health states accurately', () => {
      // 1. DISABLED
      expect(fallbackEngine.computeHealthState(false, true, null)).toBe('DISABLED');

      // 2. AWAITING_API_KEY
      expect(fallbackEngine.computeHealthState(true, false, null)).toBe('AWAITING_API_KEY');

      // 3. COOLDOWN
      const futureDate = new Date(Date.now() + 60000);
      expect(
        fallbackEngine.computeHealthState(true, true, {
          cooldownUntil: futureDate,
        } as any),
      ).toBe('COOLDOWN');

      // 4. INSUFFICIENT_BALANCE
      expect(
        fallbackEngine.computeHealthState(true, true, {
          isHealthy: false,
          cooldownUntil: null,
          lastErrorMessage: '[INSUFFICIENT_BALANCE] Account balance is depleted',
        } as any),
      ).toBe('INSUFFICIENT_BALANCE');

      // 5. INVALID_CONFIGURATION (e.g. 404 MODEL_NOT_FOUND or 400 token error)
      expect(
        fallbackEngine.computeHealthState(true, true, {
          isHealthy: false,
          cooldownUntil: null,
          lastErrorMessage: '[MODEL_NOT_FOUND] Model not found',
        } as any),
      ).toBe('INVALID_CONFIGURATION');

      // 6. DEGRADED
      expect(
        fallbackEngine.computeHealthState(true, true, {
          isHealthy: false,
          cooldownUntil: null,
          lastErrorMessage: '[SERVER_OUTAGE] Service unavailable',
        } as any),
      ).toBe('DEGRADED');

      // 7. HEALTHY
      expect(
        fallbackEngine.computeHealthState(true, true, {
          isHealthy: true,
          successfulRequests: 5,
          lastSuccessAt: new Date(),
          cooldownUntil: null,
        } as any),
      ).toBe('HEALTHY');

      // 8. ACTIVE (no requests yet, healthy, enabled, configured)
      expect(
        fallbackEngine.computeHealthState(true, true, {
          isHealthy: true,
          successfulRequests: 0,
          lastSuccessAt: null,
          cooldownUntil: null,
        } as any),
      ).toBe('ACTIVE');
    });

    it('should reset cooldown and allow admin retry on a provider', async () => {
      mockPrisma.aIProviderHealth.upsert.mockResolvedValue({
        id: 'health-1',
        provider: 'GEMINI',
        isHealthy: true,
        cooldownUntil: null,
      });

      const resetRes = await fallbackEngine.resetCooldown('GEMINI');
      expect(mockPrisma.aIProviderHealth.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { provider: 'GEMINI' },
          update: expect.objectContaining({ cooldownUntil: null, isHealthy: true }),
        }),
      );

      const retryRes = await fallbackEngine.retryProvider('GEMINI');
      expect(retryRes.success).toBe(true);
      expect(mockGemini.testConnection).toHaveBeenCalled();
    });

    it('should clamp Groq 70B models to 512 max output tokens and allow 2048 on 8B models', () => {
      const groq = new GroqProvider();
      expect(groq.getEffectiveTokenLimit('llama-3.3-70b-versatile', 2048)).toBe(512);
      expect(groq.getEffectiveTokenLimit('llama3-70b-8192', 4096)).toBe(512);
      expect(groq.getEffectiveTokenLimit('llama-3.1-8b-instant', 2048)).toBe(2048);
      expect(groq.getEffectiveTokenLimit('mixtral-8x7b-32768', 2048)).toBe(1024);
    });
  });
});
