import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users & Profiles')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current authenticated user profile, fields, and stats' })
  @ApiResponse({ status: 200, description: 'Authenticated user profile' })
  async getMe(@CurrentUser('id') userId: string) {
    return this.usersService.getMe(userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update profile details' })
  async updateMe(
    @CurrentUser('id') userId: string,
    @Body() body: { displayName?: string; bio?: string; location?: string; websiteUrl?: string; githubUrl?: string; linkedinUrl?: string; avatarUrl?: string },
  ) {
    return this.usersService.updateMe(userId, body);
  }

  @Get('profile/:username')
  @ApiOperation({ summary: 'Get public profile by username' })
  async getPublicProfile(@Param('username') username: string) {
    return this.usersService.getPublicProfile(username);
  }
}

