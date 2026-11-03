import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('AI Hub')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AiController {
  constructor(private readonly aiService: AiService) {}

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

