import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { UserSessionRepository } from '../user-session.repository';
import { EnvConfigService } from '../../../utils/services/config';
import { UserEntity } from '../../users/entities/user.entity';
import { PreUserSessionService } from './pre-user-session.service';
import { ErrorHandlerService } from '../../../common/response';
import { GlobalUtils } from '../../../utils/services/tools';
import { UserSessionEntity } from '../entities/user-session.entity';
import { IsNull, MoreThan } from 'typeorm';
import { CurrentUserInterface } from '../../../interface';

@Injectable()
export class UserSessionService {
    /**
     * Service responsible for handling user session operations
     */

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        readonly jwt: JwtService,
        readonly envConfigService: EnvConfigService,
        readonly errorHandlerService: ErrorHandlerService,
        readonly uSessionRepo: UserSessionRepository,
        readonly globalUtils: GlobalUtils,
        private readonly preUSessionService: PreUserSessionService,
    ) {}

    /**
     * Transforms a UserSessionEntity into a simplified session object.
     * Includes session ID, device name, IP address, last activity timestamp,
     * and a flag indicating if it is the current session.
     */
    transformUSession = (id: string, s: UserSessionEntity) => ({
        id: s.id,
        device: s.deviceName,
        ipAddress: s.ipAddress,
        lastActivityAt: s.lastActivityAt,
        isCurrent: s.id === id,
    });

    /**
     * Retrieves all active sessions for a specific user.
     * Active sessions are those that are not revoked and have not expired.
     * Returns an array of transformed session objects, ordered by most recent activity.
     */
    async getActiveSessionsForUser(data: CurrentUserInterface) {
        this.logger.info('Retrieve user connected active sessions');
        const activeSessions = await this.uSessionRepo.find({
            where: {
                user: { id: data.id },
                revokedAt: IsNull(),
                expiredAt: MoreThan(new Date()),
            },
            order: { lastActivityAt: 'DESC' },
        });

        return activeSessions.map((s) => this.transformUSession(data.sessionId, s));
    }

    /**
     * Generates a new user session by revoking old sessions, initializing a new session,
     * and returning access and refresh tokens for authentication.
     * Logs the creation of the session for tracking purposes.
     */
    async generateUserSession(
        user: UserEntity,
        rememberMe?: boolean,
        userAgent?: string,
        ipAddress?: string,
    ) {
        await this.preUSessionService.revokeOldSession(user);

        const refreshToken = this.globalUtils.auth.generateRefreshToken();

        const savedSession = await this.uSessionRepo.create(
            this.preUSessionService.initializeSession(
                user,
                refreshToken,
                rememberMe,
                userAgent,
                ipAddress,
            ),
        );
        this.logger.info(`Session created for user ${user.id}: ${savedSession.id}`);

        return {
            accessToken: this.preUSessionService.generateToken(
                savedSession,
                user.role.label,
                user.id,
            ),
            refreshToken,
        };
    }

    /**
     * Retrieves an active user session by hashing the provided refresh token
     * and validating the session's status (ensuring it is not revoked and is valid).
     * Returns the session if all checks pass.
     */
    async getActiveSession(rToken: string) {
        const hash = this.globalUtils.auth.hashToken(rToken);
        const session = await this.uSessionRepo.findOne({
            where: { refreshTokenHash: hash },
            relations: ['user', 'user.role'],
        });

        if (!session)
            this.errorHandlerService.unauthorized(
                `Session not found with token, ${rToken}. Session may be corrupted`,
                `Unauthorized, session corrupted`,
            );

        this.preUSessionService.ensureSessionNotRevoked(session);
        this.preUSessionService.ensureSessionIsValid(session);

        return session;
    }

    /**
     * Renews an existing user session by generating a new refresh token,
     * updating the session's token version, and setting a new expiration date.
     * Returns the updated session and the new refresh token.
     */
    async renewSession(session: UserSessionEntity, now: Date) {
        const refreshToken = this.globalUtils.auth.generateRefreshToken();

        const newSession = await this.preUSessionService.updateSession(session, {
            refreshTokenHash: this.globalUtils.auth.hashToken(refreshToken),
            tokenVersion: session.tokenVersion + 1,
            lastActivityAt: now,
        });

        return { newSession: newSession!, refreshToken };
    }

    /**
     * Revokes a user session if it has been inactive for more than two days.
     * Updates the session's revoked status and triggers an unauthorized error
     * with details about the inactivity duration.
     */
    async revokeInactiveSession(session: UserSessionEntity, now: Date) {
        const inactivityMs = now.getTime() - session.lastActivityAt.getTime();
        const twoDaysMs = 2 * 24 * 60 * 60 * 1000;

        if (inactivityMs > twoDaysMs) {
            await this.preUSessionService.updateSession(session, {
                revokedAt: now,
            });

            const inactivityDays = Math.floor(inactivityMs / (24 * 60 * 60 * 1000));
            this.errorHandlerService.unauthorized(
                `User has been inactive for too long ${inactivityDays} days, as to logging into your session`,
                `Unauthorized, session corrupted`,
            );
        }
    }

    /**
     * Renews the access token for a user session by validating the refresh token,
     * extending or renewing the session as needed, and generating a new access token.
     * Returns both the new access token and refresh token.
     */
    async renewAccessToken(rToken: string) {
        this.logger.info(`Renew access token by using the refresh token`);
        const session = await this.getActiveSession(rToken);
        const now = new Date();

        await this.revokeInactiveSession(session, now);

        const { newSession, refreshToken } = await this.renewSession(session, now);

        const accessToken = this.preUSessionService.generateToken(
            newSession,
            session.user.role.label,
            session.user.id,
        );

        return { accessToken, refreshToken };
    }

    /**
     * Revokes a specific active session for a user.
     * Validates that the session exists and is not already revoked,
     * then updates the session's revokedAt timestamp to the current date and time.
     */
    async revokeSession(data: CurrentUserInterface, sessionId: string) {
        const { id } = data;
        this.logger.info(`Revoke a particular session for user ${id}`);

        const isSessionExist = await this.preUSessionService.retrieveSessionByCriteria({
            user: { id },
            id: sessionId,
            revokedAt: IsNull(),
        });

        await this.preUSessionService.updateSession(isSessionExist, {
            revokedAt: new Date(),
        });

        return { message: `Session revoked successfully.` };
    }

    /**
     * Revokes all active sessions for a specific user.
     * Retrieves all non-revoked sessions for the user and updates each session's revokedAt timestamp.
     * Returns a success message if sessions are revoked, or a message if no sessions are found.
     */
    async revokeAllSessions(data: CurrentUserInterface) {
        const { id } = data;
        this.logger.info(`Revoke all sessions for user ${id}`);

        const sessions = await this.uSessionRepo.find({
            where: {
                user: { id },
                revokedAt: IsNull(),
            },
        });

        if (sessions.length === 0) return { message: 'No sessions found.' };

        for (const s of sessions) {
            await this.preUSessionService.updateSession(s, {
                revokedAt: new Date(),
            });
        }

        return { message: `All sessions revoked successfully.` };
    }
}
