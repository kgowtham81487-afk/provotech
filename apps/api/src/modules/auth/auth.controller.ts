import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from '@ees/shared';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setRefreshCookie(res: Response, token: string) {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('ees_refresh_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 409, description: 'Email or username already in use' })
  async register(@Body() body: any, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const input = RegisterSchema.parse(body);
    const ip = req.ip || req.socket.remoteAddress;
    const result = await this.authService.register(input, ip);

    this.setRefreshCookie(res, result.refreshToken);

    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and issue tokens' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or suspended account' })
  async login(@Body() body: any, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const input = LoginSchema.parse(body);
    const ip = req.ip || req.socket.remoteAddress;
    const result = await this.authService.login(input, ip);

    this.setRefreshCookie(res, result.refreshToken);

    return result;
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate password recovery' })
  @ApiResponse({ status: 200, description: 'Reset link dispatched' })
  async forgotPassword(@Body() body: any, @Req() req: Request) {
    const input = ForgotPasswordSchema.parse(body);
    const ip = req.ip || req.socket.remoteAddress;
    return this.authService.forgotPassword(input.email, ip);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with single-use token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Expired or invalid token' })
  async resetPassword(@Body() body: any, @Req() req: Request) {
    const input = ResetPasswordSchema.parse(body);
    const ip = req.ip || req.socket.remoteAddress;
    return this.authService.resetPassword(input, ip);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and retrieve new access token' })
  async refresh(
    @Req() req: Request,
    @Body() body: { refreshToken?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.ees_refresh_token || body?.refreshToken;
    const result = await this.authService.refreshToken(token);

    this.setRefreshCookie(res, result.refreshToken);

    return result;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invalidate active sessions and refresh tokens' })
  async logout(@CurrentUser('id') userId: string, @Res({ passthrough: true }) res: Response) {
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('ees_refresh_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    });
    return this.authService.logout(userId);
  }
}
