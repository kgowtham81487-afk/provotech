import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { FallbackEngineService } from './fallback-engine.service';
import { ContextService } from './context.service';
import { GeminiProvider } from './providers/gemini.provider';
import { DeepSeekProvider } from './providers/deepseek.provider';
import { GroqProvider } from './providers/groq.provider';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AiController],
  providers: [
    AiService,
    FallbackEngineService,
    ContextService,
    GeminiProvider,
    DeepSeekProvider,
    GroqProvider,
  ],
  exports: [AiService, FallbackEngineService, ContextService],
})
export class AiModule {}
