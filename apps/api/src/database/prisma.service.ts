import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✓ PostgreSQL connected via Prisma');
    } catch (err) {
      console.warn('Database connection warning (check DATABASE_URL):', (err as Error).message);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Interoperability aliases for AI conversations and provider delegates
  get aIConversation() {
    return this.conversation;
  }

  get aIMessage() {
    return this.message;
  }

  get aiProviderConfiguration() {
    return this.aIProviderConfiguration;
  }

  get aiProviderHealth() {
    return this.aIProviderHealth;
  }
}
