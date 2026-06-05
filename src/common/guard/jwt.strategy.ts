import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EnvConfigService } from '../../utils/services/config';
import { UserSessionRepository } from '../../core/user-session/user-session.repository';
import { CurrentUserInterface, JwtPayload } from '../../interface';
import { ErrorHandlerService } from '../response';
import { PermissionEntity } from '../../core/permissions/entities/permission.entity';
import { UserStatusEnum } from '../enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly envConfigService: EnvConfigService,
        private readonly errorHandler: ErrorHandlerService,
        private readonly jwtService: JwtService,
        private readonly userSessionRepo: UserSessionRepository,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: envConfigService.accessTokenSecret,
        });
    }

    /**
     * Transforms an array of PermissionEntity objects into a structured object,
     * grouping permission actions by their UI category.
     * Ensures each action is unique within its UI group.
     * Returns an empty object if the input is empty or invalid.
     */
    transformPermissions(permissions: PermissionEntity[]): Record<string, string[]> {
        if (!permissions || permissions.length === 0) return {};

        return permissions.reduce(
            (acc, perm) => {
                if (!acc[perm.ui]) acc[perm.ui] = [];
                if (!acc[perm.ui].includes(perm.action)) acc[perm.ui].push(perm.action);
                return acc;
            },
            {} as Record<string, string[]>,
        );
    }

    /**
     * Validates a JWT payload for access tokens by checking the token type, session existence,
     * revocation status, and token version. Updates the session's last activity timestamp.
     * Returns the user and session details if validation succeeds; throws an UnauthorizedException otherwise.
     */
    async validate(payload: JwtPayload): Promise<CurrentUserInterface> {
        if (payload.type !== 'access') throw new UnauthorizedException('Invalid token type');

        const { role } = payload;

        const session = await this.userSessionRepo.findOne({
            where: { id: payload.sid },
            relations: ['user', 'user.subscription', 'user.group', 'user.group.permissions'],
        });

        if (!session) this.errorHandler.unauthorized('Session not found', 'Session not found');
        if (session.revokedAt) this.errorHandler.unauthorized('Session revoked', 'Session revoked');
        if (session.tokenVersion !== payload.ver)
            this.errorHandler.unauthorized('Token version mismatch', 'Token version mismatch');

        if (session?.user.status !== UserStatusEnum.ACTIVE)
            this.errorHandler.unauthorized(`User not authorized`, `User not authorized`);

        await this.userSessionRepo.update({ id: payload.sid }, { lastActivityAt: new Date() });

        let permissions: Record<string, string[]> = {};

        if (![this.envConfigService.sAdminRole, this.envConfigService.userRole].includes(role)) {
            const perms = session?.user?.group?.permissions || [];
            permissions = this.transformPermissions(perms);
        }

        return {
            id: payload.sub,
            role: payload.role,
            status: session.user.status,
            sessionId: payload.sid,
            subId: session.user.subscription?.id ?? null,
            subStatus: session.user.subscription?.status ?? null,
            permissions,
        };
    }

    /**
     * Validates a raw JWT token string (for WebSocket connections)
     * Verifies and decodes the token, then validates the session
     */
    async validateToken(token: string): Promise<CurrentUserInterface> {
        const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
            secret: this.envConfigService.accessTokenSecret,
        });
        return await this.validate(payload);
    }
}
