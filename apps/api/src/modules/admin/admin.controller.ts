import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  AdminCreateUserSchema,
  AdminChangeRoleSchema,
  AdminUpdateStatusSchema,
  AdminFeatureFlagUpdateSchema,
  CreateOpportunitySchema,
} from '@ees/shared';

@ApiTags('Super Admin & Platform Control')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Real platform analytics and operational overview' })
  async getStats() {
    return this.adminService.getPlatformStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Paginated, searchable user directory with filters' })
  async listUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.listUsers({ page, limit, search, role, status });
  }

  @Post('users')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Create user with assigned role (Super Admin only)' })
  async createUser(@Body() body: any, @CurrentUser('id') actorId: string, @Req() req: Request) {
    const input = AdminCreateUserSchema.parse(body);
    const ip = req.ip || req.socket.remoteAddress;
    return this.adminService.createUser(input, actorId, ip);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Suspend, reactivate or deactivate user account' })
  async updateUserStatus(
    @Param('id') userId: string,
    @Body() body: any,
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    const input = AdminUpdateStatusSchema.parse(body);
    const ip = req.ip || req.socket.remoteAddress;
    return this.adminService.updateUserStatus(userId, input, actorId, ip);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Assign or modify user role' })
  async changeUserRole(
    @Param('id') userId: string,
    @Body() body: { role: string },
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    return this.adminService.changeUserRole(userId, body.role, actorId, ip);
  }

  @Post('users/:id/reset-link')
  @ApiOperation({ summary: 'Generate single-use expiring password reset link for user' })
  async generateResetLink(
    @Param('id') userId: string,
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    return this.adminService.generateResetLink(userId, actorId, ip);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Soft delete user account' })
  async deleteUser(
    @Param('id') userId: string,
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    return this.adminService.deleteUser(userId, actorId, ip);
  }

  @Post('users/:id/restore')
  @ApiOperation({ summary: 'Restore soft deleted user account' })
  async restoreUser(
    @Param('id') userId: string,
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    return this.adminService.restoreUser(userId, actorId, ip);
  }

  @Get('feature-flags')
  @ApiOperation({ summary: 'List all database-backed feature flags' })
  async listFeatureFlags() {
    return this.adminService.listFeatureFlags();
  }

  @Patch('feature-flags/:key')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Toggle feature flag status (Super Admin only)' })
  async updateFeatureFlag(
    @Param('key') key: string,
    @Body() body: { isEnabled: boolean; metadata?: any },
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    const input = AdminFeatureFlagUpdateSchema.parse({ key, ...body });
    const ip = req.ip || req.socket.remoteAddress;
    return this.adminService.updateFeatureFlag(input, actorId, ip);
  }

  @Get('configs')
  @ApiOperation({ summary: 'List platform configurations with masked secrets' })
  async listConfigs() {
    return this.adminService.listConfigs();
  }

  @Patch('configs/:key')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Update platform configuration' })
  async updateConfig(
    @Param('key') key: string,
    @Body() body: { value: any },
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    return this.adminService.updateConfig(key, body.value, actorId, ip);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Query immutable platform audit logs' })
  async listAuditLogs(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.listAuditLogs({ page, limit });
  }

  @Get('database/stats')
  @ApiOperation({ summary: 'View database table statistics and health' })
  async getDatabaseStats() {
    return this.adminService.getDatabaseStats();
  }

  @Post('database/maintenance')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Trigger database cleanup tasks (expired tokens & sessions)' })
  async runDatabaseMaintenance(@CurrentUser('id') actorId: string, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    return this.adminService.runDatabaseMaintenance(actorId, ip);
  }

  @Post('opportunities')
  @Roles('SUPER_ADMIN', 'ADMIN', 'OPPORTUNITY_MANAGER')
  @ApiOperation({ summary: 'Create Provolution Technologies opportunity' })
  async createOpportunity(
    @Body() body: any,
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    const input = CreateOpportunitySchema.parse(body);
    const ip = req.ip || req.socket.remoteAddress;
    return this.adminService.createOpportunity(input, actorId, ip);
  }

  @Get('applications')
  @Roles('SUPER_ADMIN', 'ADMIN', 'OPPORTUNITY_MANAGER')
  @ApiOperation({ summary: 'List all candidate applications for review' })
  async listApplications(
    @Query('opportunityId') opportunityId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.listApplications({ opportunityId, status, page, limit });
  }

  @Patch('applications/:id/review')
  @Roles('SUPER_ADMIN', 'ADMIN', 'OPPORTUNITY_MANAGER')
  @ApiOperation({ summary: 'Review and update opportunity candidate application status' })
  async reviewApplication(
    @Param('id') applicationId: string,
    @Body() body: { status: 'SHORTLISTED' | 'SELECTED' | 'REJECTED'; notes: string },
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    return this.adminService.reviewApplication(applicationId, body.status, body.notes, actorId, ip);
  }

  // ==========================================
  // AI CONTROLS & MONITORING
  // ==========================================

  @Get('ai/config')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get AI provider configurations, health status, and fallback state' })
  async getAiConfig() {
    return this.adminService.getAiConfig();
  }

  @Patch('ai/config')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Update an AI provider configuration (model, priority, state)' })
  async updateAiConfig(
    @Body() body: { provider: any; updates: any },
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    return this.adminService.updateAiConfig(body.provider, body.updates, actorId, ip);
  }

  @Patch('ai/fallback')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Toggle automatic AI fallback ON/OFF' })
  async setAiFallback(
    @Body() body: { enabled: boolean },
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    return this.adminService.setAiFallbackEnabled(body.enabled, actorId, ip);
  }

  @Post('ai/test/:provider')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Test connectivity to an AI provider' })
  async testAiProvider(@Param('provider') provider: any) {
    return this.adminService.testAiProvider(provider);
  }

  @Post('ai/reset-defaults')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Restore default AI provider order (Gemini -> DeepSeek -> Groq)' })
  async resetAiDefaults(
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    return this.adminService.resetAiDefaults(actorId, ip);
  }

  // ==========================================
  // SKILLS MANAGEMENT (CRUD)
  // ==========================================

  @Get('skills')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'List skills with categories and usage metrics' })
  async listSkills(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.listSkills({ search, categoryId, page, limit });
  }

  @Get('skills/categories')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'List all skill categories' })
  async listSkillCategories() {
    return this.adminService.listSkillCategories();
  }

  @Get('skills/:id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get a specific skill by ID' })
  async getSkill(@Param('id') id: string) {
    return this.adminService.getSkill(id);
  }

  @Post('skills')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Create a new platform skill' })
  async createSkill(
    @Body() body: { name: string; slug?: string; categoryId: string; description?: string; isActive?: boolean },
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    return this.adminService.createSkill(body, actorId, ip);
  }

  @Patch('skills/:id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update a platform skill' })
  async updateSkill(
    @Param('id') id: string,
    @Body() body: { name?: string; slug?: string; categoryId?: string; description?: string; isActive?: boolean },
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    return this.adminService.updateSkill(id, body, actorId, ip);
  }

  @Delete('skills/:id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Delete a platform skill' })
  async deleteSkill(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    return this.adminService.deleteSkill(id, actorId, ip);
  }

  // ==========================================
  // OPPORTUNITIES MANAGEMENT (CRUD)
  // ==========================================

  @Get('opportunities')
  @Roles('SUPER_ADMIN', 'ADMIN', 'OPPORTUNITY_MANAGER')
  @ApiOperation({ summary: 'List opportunities (all statuses) with search and filters' })
  async listOpportunities(
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.listOpportunities({ search, type, status, page, limit });
  }

  @Get('opportunities/:id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'OPPORTUNITY_MANAGER')
  @ApiOperation({ summary: 'Get detailed opportunity by ID' })
  async getOpportunity(@Param('id') id: string) {
    return this.adminService.getOpportunity(id);
  }

  @Patch('opportunities/:id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'OPPORTUNITY_MANAGER')
  @ApiOperation({ summary: 'Update opportunity details and required skills' })
  async updateOpportunity(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    return this.adminService.updateOpportunity(id, body, actorId, ip);
  }

  @Delete('opportunities/:id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Delete an opportunity' })
  async deleteOpportunity(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    return this.adminService.deleteOpportunity(id, actorId, ip);
  }

  @Patch('opportunities/:id/status')
  @Roles('SUPER_ADMIN', 'ADMIN', 'OPPORTUNITY_MANAGER')
  @ApiOperation({ summary: 'Update opportunity status (e.g. publish OPEN, unpublish DRAFT)' })
  async updateOpportunityStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    return this.adminService.updateOpportunityStatus(id, body.status, actorId, ip);
  }
}
