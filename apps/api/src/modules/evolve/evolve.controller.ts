import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { EvolveService } from './evolve.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  OnboardingFieldSelectSchema,
  CreateLearningSessionSchema,
  CreateWorkoutSchema,
  CreateContentIdeaSchema,
  CreateProjectSchema,
} from '@ees/shared';

@ApiTags('Evolve — Skill Development')
@Controller('evolve')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class EvolveController {
  constructor(private readonly evolveService: EvolveService) {}

  @Post('onboarding')
  @ApiOperation({ summary: 'Commit to primary and secondary fields during onboarding' })
  async completeOnboarding(@CurrentUser('id') userId: string, @Body() body: any) {
    const input = OnboardingFieldSelectSchema.parse(body);
    return this.evolveService.completeOnboarding(userId, input);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Retrieve full personalized Evolve workspace data' })
  async getDashboard(@CurrentUser('id') userId: string) {
    return this.evolveService.getDashboard(userId);
  }

  @Post('learning/sessions')
  @ApiOperation({ summary: 'Log a study session and earn server-side verified XP' })
  async logStudySession(@CurrentUser('id') userId: string, @Body() body: any) {
    const input = CreateLearningSessionSchema.parse(body);
    return this.evolveService.logStudySession(userId, input);
  }

  @Get('learning/sessions')
  @ApiOperation({ summary: 'List user learning history' })
  async listStudySessions(@CurrentUser('id') userId: string) {
    return this.evolveService.listStudySessions(userId);
  }

  @Post('fitness/workouts')
  @ApiOperation({ summary: 'Log a specialized fitness workout with exercises, sets, reps' })
  async logWorkout(@CurrentUser('id') userId: string, @Body() body: any) {
    const input = CreateWorkoutSchema.parse(body);
    return this.evolveService.logWorkout(userId, input);
  }

  @Get('fitness/workouts')
  @ApiOperation({ summary: 'List fitness workouts' })
  async listWorkouts(@CurrentUser('id') userId: string) {
    return this.evolveService.listWorkouts(userId);
  }

  @Post('content/ideas')
  @ApiOperation({ summary: 'Add a new idea to content creation pipeline' })
  async createContentIdea(@CurrentUser('id') userId: string, @Body() body: any) {
    const input = CreateContentIdeaSchema.parse(body);
    return this.evolveService.createContentIdea(userId, input);
  }

  @Get('content/ideas')
  @ApiOperation({ summary: 'List content creation ideas & status' })
  async listContentIdeas(@CurrentUser('id') userId: string) {
    return this.evolveService.listContentIdeas(userId);
  }

  @Post('projects')
  @ApiOperation({ summary: 'Publish project to personal portfolio with repo & demo links' })
  async createProject(@CurrentUser('id') userId: string, @Body() body: any) {
    const input = CreateProjectSchema.parse(body);
    return this.evolveService.createProject(userId, input);
  }

  @Get('projects')
  @ApiOperation({ summary: 'List personal portfolio projects' })
  async listProjects(@CurrentUser('id') userId: string) {
    return this.evolveService.listProjects(userId);
  }
}
