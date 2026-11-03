-- Step 1: Extend Conversation model to support persistent AI & module-aware conversations
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT 'New Conversation';
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "module" TEXT NOT NULL DEFAULT 'GENERAL';
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- Create indexes for fast user isolation & module lookup
CREATE INDEX IF NOT EXISTS "Conversation_userId_updatedAt_idx" ON "Conversation"("userId", "updatedAt" DESC);
CREATE INDEX IF NOT EXISTS "Conversation_module_idx" ON "Conversation"("module");

-- Foreign key for Conversation -> User
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Conversation_userId_fkey'
    ) THEN
        ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Step 2: Extend Message model for multi-turn assistant / system / user roles & LLM telemetry
ALTER TABLE "Message" ALTER COLUMN "senderId" DROP NOT NULL;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'user';
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "provider" TEXT;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "model" TEXT;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "promptTokens" INTEGER;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "completionTokens" INTEGER;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "totalTokens" INTEGER;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "latencyMs" INTEGER;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- Create chronological message index
CREATE INDEX IF NOT EXISTS "Message_conversationId_createdAt_asc_idx" ON "Message"("conversationId", "createdAt" ASC);

-- Step 3: Enhance AI Provider Configuration & Health
ALTER TABLE "AIProviderConfiguration" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
ALTER TABLE "AIProviderConfiguration" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "AIProviderHealth" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
