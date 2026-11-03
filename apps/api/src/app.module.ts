import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { FieldsModule } from './modules/fields/fields.module';

@Module({
  imports: [
    DatabaseModule,
    HealthModule,
    FieldsModule,
  ],
})
export class AppModule {}
