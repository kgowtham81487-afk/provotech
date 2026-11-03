import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ScaleService } from './scale.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApplyOpportunitySchema } from '@ees/shared';

@ApiTags('Scale — Opportunities & Value Ecosystem')
@Controller('scale')
export class ScaleController {
  constructor(private readonly scaleService: ScaleService) {}

  @Get('opportunities')
  @ApiOperation({ summary: 'Browse open Provolution opportunities' })
  async listOpportunities(
    @Query('type') type?: string,
    @Query('fieldId') fieldId?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.scaleService.listOpportunities({ type, fieldId, search, page, limit });
  }

  @Get('opportunities/:slug')
  @ApiOperation({ summary: 'Get opportunity details by slug' })
  async getOpportunityBySlug(@Param('slug') slug: string) {
    return this.scaleService.getOpportunityBySlug(slug);
  }

  @Post('opportunities/:id/apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Submit opportunity application with portfolio evidence' })
  async apply(
    @CurrentUser('id') userId: string,
    @Param('id') opportunityId: string,
    @Body() body: any,
  ) {
    const input = ApplyOpportunitySchema.parse(body);
    return this.scaleService.apply(userId, opportunityId, input);
  }

  @Get('my-applications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Track user application history and status' })
  async getMyApplications(@CurrentUser('id') userId: string) {
    return this.scaleService.getMyApplications(userId);
  }

  @Get('my-assignments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Track active contract assignments and milestones' })
  async getMyAssignments(@CurrentUser('id') userId: string) {
    return this.scaleService.getMyAssignments(userId);
  }

  @Post('assignments/:id/deliverables')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Submit assignment deliverable for review' })
  async submitDeliverable(
    @CurrentUser('id') userId: string,
    @Param('id') assignmentId: string,
    @Body() body: { title: string; description?: string; pullRequestUrl?: string; fileUrl?: string },
  ) {
    return this.scaleService.submitDeliverable(userId, assignmentId, body);
  }

  @Get('ledger')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'View verified compensation records and payouts' })
  async getLedger(@CurrentUser('id') userId: string) {
    return this.scaleService.getLedger(userId);
  }
}
