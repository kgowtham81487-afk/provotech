import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../database/prisma.service';

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  roles: string[];
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication token required.');
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'dev-ees-jwt-super-secret-key-32charsmin';

    let payload: any;
    try {
      payload = jwt.verify(token, jwtSecret);
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired authentication token.');
    }

    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Malformed token payload.');
    }

    // Verify user is active in database
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        profile: true,
        roles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User account no longer exists.');
    }

    if (user.status === 'SUSPENDED') {
      throw new ForbiddenException('Your account has been suspended by an administrator.');
    }

    if (user.status === 'DEACTIVATED' || user.deletedAt) {
      throw new ForbiddenException('This account has been deactivated.');
    }

    const roles = user.roles.map((r) => r.role.name);

    request.user = {
      id: user.id,
      email: user.email,
      username: user.profile?.username || user.email,
      displayName: user.profile?.displayName || 'User',
      roles,
    };

    return true;
  }
}

