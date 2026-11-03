import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';
import { REQUIRE_FEATURE_KEY } from '../decorators/require-feature.decorator';

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<string>(REQUIRE_FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Check Global Maintenance mode first
    const maintenanceFlag = await this.prisma.featureFlag.findUnique({
      where: { key: 'GLOBAL_MAINTENANCE' },
    });

    if (maintenanceFlag && maintenanceFlag.isEnabled) {
      // Allow super_admins through even in maintenance
      const req = context.switchToHttp().getRequest();
      if (!req.user || !req.user.roles || !req.user.roles.includes('SUPER_ADMIN')) {
        throw new ServiceUnavailableException(
          'EES Platform is currently undergoing scheduled maintenance. Please check back shortly.',
        );
      }
    }

    if (!requiredFeature) {
      return true;
    }

    const flag = await this.prisma.featureFlag.findUnique({
      where: { key: requiredFeature },
    });

    if (flag && !flag.isEnabled) {
      throw new ServiceUnavailableException(
        `Feature '${flag.name}' is currently disabled by platform administrators.`,
      );
    }

    return true;
  }
}
