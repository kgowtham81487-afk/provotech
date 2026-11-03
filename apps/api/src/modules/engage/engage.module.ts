import { Module } from '@nestjs/common';
import { EngageController } from './engage.controller';
import { EngageService } from './engage.service';

@Module({
  controllers: [EngageController],
  providers: [EngageService],
  exports: [EngageService],
})
export class EngageModule {}

