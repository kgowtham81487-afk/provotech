import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { FieldsModule } from './modules/fields/fields.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EvolveModule } from './modules/evolve/evolve.module';
import { EngageModule } from './modules/engage/engage.module';
import { ScaleModule } from './modules/scale/scale.module';
import { AiModule } from './modules/ai/ai.module';
import { AdminModule } from './modules/admin/admin.module';
import { FitnessModule } from './modules/fitness/fitness.module';

@Module({
  imports: [
    DatabaseModule,
    HealthModule,
    FieldsModule,
    AuthModule,
    UsersModule,
    EvolveModule,
    EngageModule,
    ScaleModule,
    AiModule,
    AdminModule,
    FitnessModule,
  ],
})
export class AppModule {}
