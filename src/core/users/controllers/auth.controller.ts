import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Req,
    Res,
    UseGuards,
    ValidationPipe,
    ApiBearerAuth,
} from '../../../common';
import type { Response } from 'express';
import { GoogleOAuthGuard, JwtAuthGuard } from '../../../common/guard';
import { UsersService } from '../services';
import {
    ApiOperationDecorator,
    ApiParamDecorator,
    ApiResponseDecorator,
    CurrentUser,
} from '../../../common/decorators';
import { type CurrentUserInterface } from '../../../interface';
import { FieldDto } from '../../../common/dto';
import { Delete } from '@nestjs/common';

@Controller('auth')
export class AuthController {
    constructor(private readonly usersService: UsersService) {}

    getClientIp(req: any): string | undefined {
        const forwarded = req.headers['x-forwarded-for'];
        if (Array.isArray(forwarded)) return forwarded[0];
        if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
        return req.ip;
    }

    @Get('google')
    @UseGuards(GoogleOAuthGuard)
    async googleAuth() {
        this.usersService.logger.info(`Starting google auth service`);
    }

    @Get('google/callback')
    @UseGuards(GoogleOAuthGuard)
    async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
        const googleUser = req.user;
        const userAgent = req.headers['user-agent'];
        const ipAddress = this.getClientIp(req);

        const { accessToken, refreshToken } = await this.usersService.authenticateWithGoogle(
            googleUser,
            userAgent,
            ipAddress,
        );

        const baseUrl = this.usersService.envConfigService.googleFrontEndpoint;
        const trustedBase = new URL(baseUrl);

        trustedBase.searchParams.set('accessToken', accessToken);
        trustedBase.searchParams.set('refreshToken', refreshToken);

        return res.redirect(trustedBase.toString());
    }

    @Post('refresh')
    @ApiOperationDecorator(
        'Refresh the access token',
        'Refresh the access token with the refresh token',
    )
    @ApiResponseDecorator(200, 'Token refreshed successfully')
    @ApiResponseDecorator(403, 'Forbidden, session compromised')
    async refreshToken(@Body(ValidationPipe) dto: FieldDto) {
        return this.usersService.authService.renewAccessToken(dto.field);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Get('sessions')
    @ApiOperationDecorator('All user sessions', 'Retrieve all user active sessions')
    @ApiResponseDecorator(200, 'Sessions retrieved successfully')
    async activeSessions(@CurrentUser() user: CurrentUserInterface) {
        return this.usersService.authService.getActiveSessionsForUser(user);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Delete('session/revoke/:id')
    @ApiParamDecorator('session')
    @ApiOperationDecorator('Revoke a session', 'Revoke a user active session')
    @ApiResponseDecorator(200, 'Session revoked successfully')
    @ApiResponseDecorator(404, 'Session not found')
    async revokeSession(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.usersService.authService.revokeSession(user, id);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Delete('sessions/revoke-all')
    @ApiOperationDecorator('Revoke sessions', 'Revoke user active sessions')
    @ApiResponseDecorator(200, 'Sessions revoked successfully')
    async revokeSessions(@CurrentUser() user: CurrentUserInterface) {
        return this.usersService.authService.revokeAllSessions(user);
    }
}
