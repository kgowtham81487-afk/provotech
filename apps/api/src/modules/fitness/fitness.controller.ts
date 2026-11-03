import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FitnessService } from './fitness.service';
import {
  UpdateFitnessProfileDto,
  OnboardingFitnessDto,
} from './dto/fitness-profile.dto';
import {
  LogWorkoutDto,
  CreateWorkoutPlanDto,
  UpdateWorkoutPlanDto,
} from './dto/workout.dto';
import {
  LogFoodDiaryEntryDto,
  LogWaterDto,
  CreateCustomFoodDto,
} from './dto/nutrition.dto';
import {
  LogBodyMeasurementDto,
  LogActivityDto,
  CreateFitnessGoalDto,
  UpdateFitnessGoalDto,
} from './dto/body-measurement.dto';

@ApiTags('Fitness & Wellness')
@Controller('fitness')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class FitnessController {
  constructor(private readonly fitnessService: FitnessService) {}

  // ==========================================
  // DASHBOARD & ONBOARDING
  // ==========================================

  @Get('dashboard')
  @ApiOperation({ summary: 'Personalized daily & weekly fitness & nutrition dashboard' })
  async getDashboard(@CurrentUser('id') userId: string) {
    return this.fitnessService.getDashboard(userId);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get user fitness profile and targets' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.fitnessService.getProfile(userId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update fitness targets and preferences' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() body: UpdateFitnessProfileDto,
  ) {
    return this.fitnessService.updateProfile(userId, body);
  }

  @Post('onboarding')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete guided fitness onboarding and compute TDEE/macros' })
  async completeOnboarding(
    @CurrentUser('id') userId: string,
    @Body() body: OnboardingFitnessDto,
  ) {
    return this.fitnessService.completeOnboarding(userId, body);
  }

  // ==========================================
  // EXERCISES LIBRARY
  // ==========================================

  @Get('exercises')
  @ApiOperation({ summary: 'Search and browse exercises library' })
  async listExercises(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('equipment') equipment?: string,
    @Query('difficulty') difficulty?: string,
  ) {
    return this.fitnessService.listExercises({ search, category, equipment, difficulty });
  }

  @Get('exercises/:id')
  @ApiOperation({ summary: 'Get exercise details with personal history and PRs' })
  async getExercise(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.fitnessService.getExercise(id, userId);
  }

  // ==========================================
  // WORKOUT LOGGING & SESSIONS (HEVY-INSPIRED)
  // ==========================================

  @Post('workouts')
  @ApiOperation({ summary: 'Log a completed workout session with volume and PR detection' })
  async logWorkout(@CurrentUser('id') userId: string, @Body() body: LogWorkoutDto) {
    return this.fitnessService.logWorkout(userId, body);
  }

  @Get('workouts')
  @ApiOperation({ summary: 'List user workout history with pagination' })
  async listWorkouts(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.fitnessService.listWorkouts(userId, { page, limit });
  }

  @Get('workouts/:id')
  @ApiOperation({ summary: 'Get single workout session details' })
  async getWorkout(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.fitnessService.getWorkout(userId, id);
  }

  @Delete('workouts/:id')
  @ApiOperation({ summary: 'Delete a workout session' })
  async deleteWorkout(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.fitnessService.deleteWorkout(userId, id);
  }

  // ==========================================
  // WORKOUT PLANS & ROUTINES
  // ==========================================

  @Post('plans')
  @ApiOperation({ summary: 'Create a custom workout plan or split' })
  async createWorkoutPlan(
    @CurrentUser('id') userId: string,
    @Body() body: CreateWorkoutPlanDto,
  ) {
    return this.fitnessService.createWorkoutPlan(userId, body);
  }

  @Get('plans')
  @ApiOperation({ summary: 'List user saved workout plans' })
  async listWorkoutPlans(@CurrentUser('id') userId: string) {
    return this.fitnessService.listWorkoutPlans(userId);
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Get workout plan details with exercises' })
  async getWorkoutPlan(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.fitnessService.getWorkoutPlan(userId, id);
  }

  @Put('plans/:id')
  @ApiOperation({ summary: 'Update a workout plan' })
  async updateWorkoutPlan(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: UpdateWorkoutPlanDto,
  ) {
    return this.fitnessService.updateWorkoutPlan(userId, id, body);
  }

  @Delete('plans/:id')
  @ApiOperation({ summary: 'Delete a workout plan' })
  async deleteWorkoutPlan(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.fitnessService.deleteWorkoutPlan(userId, id);
  }

  // ==========================================
  // NUTRITION & FOOD DIARY (HEALTHIFYME-INSPIRED)
  // ==========================================

  @Get('nutrition/search')
  @ApiOperation({ summary: 'Search food database (with Tamil Nadu & Indian staple support)' })
  async searchFoods(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('indianOnly') indianOnly?: string,
  ) {
    return this.fitnessService.searchFoods({
      search,
      category,
      indianOnly: indianOnly === 'true',
    });
  }

  @Get('nutrition/diary')
  @ApiOperation({ summary: 'Get food diary entries, macros and water for a specific date' })
  async listFoodDiary(
    @CurrentUser('id') userId: string,
    @Query('date') date?: string,
  ) {
    return this.fitnessService.listFoodDiary(userId, date);
  }

  @Post('nutrition/diary')
  @ApiOperation({ summary: 'Log a food item into a meal (Breakfast, Lunch, Dinner, Snacks)' })
  async logFoodDiary(
    @CurrentUser('id') userId: string,
    @Body() body: LogFoodDiaryEntryDto,
  ) {
    return this.fitnessService.logFoodDiary(userId, body);
  }

  @Delete('nutrition/diary/:id')
  @ApiOperation({ summary: 'Delete a food diary entry' })
  async deleteFoodDiaryEntry(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.fitnessService.deleteFoodDiaryEntry(userId, id);
  }

  @Post('nutrition/water')
  @ApiOperation({ summary: 'Log hydration intake (amount in ml)' })
  async logWater(@CurrentUser('id') userId: string, @Body() body: LogWaterDto) {
    return this.fitnessService.logWater(userId, body);
  }

  @Post('nutrition/custom-food')
  @ApiOperation({ summary: 'Create a custom verified food entry' })
  async createCustomFood(
    @CurrentUser('id') userId: string,
    @Body() body: CreateCustomFoodDto,
  ) {
    return this.fitnessService.createCustomFood(userId, body);
  }

  // ==========================================
  // BODY MEASUREMENTS & PROGRESS
  // ==========================================

  @Post('body')
  @ApiOperation({ summary: 'Log body weight and circumferences' })
  async logBodyMeasurement(
    @CurrentUser('id') userId: string,
    @Body() body: LogBodyMeasurementDto,
  ) {
    return this.fitnessService.logBodyMeasurement(userId, body);
  }

  @Get('body')
  @ApiOperation({ summary: 'Get historical body measurements and weight progression' })
  async listBodyMeasurements(@CurrentUser('id') userId: string) {
    return this.fitnessService.listBodyMeasurements(userId);
  }

  // ==========================================
  // ACTIVITY & WELLNESS
  // ==========================================

  @Post('activity')
  @ApiOperation({ summary: 'Log manual cardio, step count, sleep, or rest day' })
  async logActivity(
    @CurrentUser('id') userId: string,
    @Body() body: LogActivityDto,
  ) {
    return this.fitnessService.logActivity(userId, body);
  }

  @Get('activity')
  @ApiOperation({ summary: 'List recent activity and wellness logs' })
  async listActivities(
    @CurrentUser('id') userId: string,
    @Query('date') date?: string,
  ) {
    return this.fitnessService.listActivities(userId, date);
  }

  // ==========================================
  // FITNESS GOALS
  // ==========================================

  @Post('goals')
  @ApiOperation({ summary: 'Create a fitness milestone or goal' })
  async createGoal(
    @CurrentUser('id') userId: string,
    @Body() body: CreateFitnessGoalDto,
  ) {
    return this.fitnessService.createGoal(userId, body);
  }

  @Get('goals')
  @ApiOperation({ summary: 'List all user fitness goals' })
  async listGoals(@CurrentUser('id') userId: string) {
    return this.fitnessService.listGoals(userId);
  }

  @Patch('goals/:id')
  @ApiOperation({ summary: 'Update fitness goal progress or status' })
  async updateGoal(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: UpdateFitnessGoalDto,
  ) {
    return this.fitnessService.updateGoal(userId, id, body);
  }

  @Delete('goals/:id')
  @ApiOperation({ summary: 'Delete a fitness goal' })
  async deleteGoal(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.fitnessService.deleteGoal(userId, id);
  }

  // ==========================================
  // ADMIN CATALOG MANAGEMENT
  // ==========================================

  @Post('admin/exercises')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Admin create exercise in official library' })
  async adminCreateExercise(@Body() body: any) {
    return this.fitnessService.adminCreateExercise(body);
  }

  @Patch('admin/exercises/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Admin update exercise' })
  async adminUpdateExercise(@Param('id') id: string, @Body() body: any) {
    return this.fitnessService.adminUpdateExercise(id, body);
  }

  @Delete('admin/exercises/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Admin delete exercise' })
  async adminDeleteExercise(@Param('id') id: string) {
    return this.fitnessService.adminDeleteExercise(id);
  }

  @Post('admin/foods')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Admin add food to database' })
  async adminCreateFood(@Body() body: any) {
    return this.fitnessService.adminCreateFood(body);
  }

  @Patch('admin/foods/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Admin update food' })
  async adminUpdateFood(@Param('id') id: string, @Body() body: any) {
    return this.fitnessService.adminUpdateFood(id, body);
  }

  @Delete('admin/foods/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Admin delete food' })
  async adminDeleteFood(@Param('id') id: string) {
    return this.fitnessService.adminDeleteFood(id);
  }
}
