import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { PrismaService } from '../database/prisma.service';

@ApiTags('Health & Probes')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('live')
  @ApiOperation({
    summary: 'Liveness probe',
    description: 'Ultra-lightweight HTTP 200 endpoint for UptimeRobot and load balancers.',
  })
  @ApiResponse({ status: 200, description: 'Application process is alive' })
  getLiveness(@Res() res: Response) {
    return res.status(HttpStatus.OK).json({
      status: 'ok',
      service: 'ees-api',
      organization: 'Provolution Technologies Pvt. Ltd.',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness probe',
    description: 'Verifies database connectivity and readiness to receive incoming production traffic.',
  })
  @ApiResponse({ status: 200, description: 'All dependencies operational' })
  @ApiResponse({ status: 503, description: 'One or more dependencies failing' })
  async getReadiness(@Res() res: Response) {
    try {
      // Fast query probe
      await this.prisma.$queryRaw`SELECT 1`;
      return res.status(HttpStatus.OK).json({
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'unready',
        database: 'disconnected',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
