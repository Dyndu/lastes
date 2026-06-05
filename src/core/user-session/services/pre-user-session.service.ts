import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { UserSessionService } from './user-session.service';
import { UserSessionEntity } from '../entities/user-session.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { IsNull } from 'typeorm';

@Injectable()
export class PreUserSessionService {
    /**
     * Service responsible for handling pre user session operations
     */

    constructor(
        @Inject(forwardRef(() => UserSessionService))
        readonly uSessionService: UserSessionService,
    ) {}

    /**
     * Validates that the user session has not been revoked.
     * Throws an unauthorized error if the session is revoked.
     */
    ensureSessionNotRevoked(session: UserSessionEntity) {
        if (session.revokedAt)
            this.uSessionService.errorHandlerService.unauthorized(
                `This session ${session.id} has been revoked`,
                `Unauthorized, session corrupted`,
            );
    }

    /**
     * Validates that the user session is still active and not expired.
     * Throws an unauthorized error if the session has expired.
     */
    ensureSessionIsValid(session: UserSessionEntity) {
        if (new Date() > session.expiredAt)
            this.uSessionService.errorHandlerService.unauthorized(
                `This session ${session.id} has expired`,
                `Unauthorized, session corrupted`,
            );
    }

    /**
     * Calculates the expiration date for a session by adding 90 days to the provided base date.
     * Returns the resulting expiration date.
     */
    calculateSessionExpirationDate(baseDate: Date, rememberMe?: boolean): Date {
        const days = rememberMe
            ? 30
            : Number.parseInt(
                  this.uSessionService.envConfigService.sessionMaxDurationDays.replaceAll(
                      /\D/g,
                      '',
                  ),
              );
        const expirationDate = new Date(baseDate);
        expirationDate.setDate(expirationDate.getDate() + days);
        return expirationDate;
    }

    /**
     * Generates an access token (JWT) for a user session using the session's user ID,
     * session ID, and token version. Signs the token with the access token secret
     * and sets its expiration based on the configured access token expiry.
     */
    generateToken(session: UserSessionEntity, role: string, userId: string) {
        return this.uSessionService.jwt.sign(
            {
                sub: userId,
                role,
                sid: session.id,
                ver: session.tokenVersion,
                type: 'access',
            },
            {
                secret: this.uSessionService.envConfigService.accessTokenSecret,
                expiresIn: this.uSessionService.envConfigService.accessTokenExpiry,
            },
        );
    }

    /**
     * Retrieves a user session based on the provided criteria and optional relations.
     * Logs the search criteria and throws a "not found" error if no matching session exists.
     * Returns the session if found.
     */
    async retrieveSessionByCriteria(criteria: Record<string, any>, relations?: string[]) {
        const entries = this.uSessionService.globalUtils.others.formatCriteria(criteria);
        this.uSessionService.logger.info(`Find a session by ${entries}`);

        const isSessionExist = await this.uSessionService.uSessionRepo.findActiveOne(
            this.uSessionService.uSessionRepo,
            criteria,
            relations,
        );

        if (!isSessionExist)
            this.uSessionService.errorHandlerService.notFound(
                `Data not found with ${entries}`,
                `Data not found`,
            );

        return isSessionExist;
    }

    /**
     * Builds and returns a new user session entities by combining required session attributes
     * with optional metadata such as revocation details and client information.
     */
    buildSessionEntity(
        required: {
            refreshTokenHash: string;
            deviceName: string;
            lastActivityAt: Date;
            expiredAt: Date;
            user: UserEntity;
        },
        optional?: {
            revokedAt?: Date;
            ipAddress?: string;
            userAgent?: string;
        },
    ) {
        const session = new UserSessionEntity();
        Object.assign(session, required, optional);
        return session;
    }

    /**
     * Initializes a new user session by generating all required session attributes
     * from the provided user and refresh token.
     */
    initializeSession(
        user: UserEntity,
        refreshToken: string,
        rememberMe?: boolean,
        userAgent?: string,
        ipAddress?: string,
    ) {
        const now = new Date();

        return this.buildSessionEntity(
            {
                refreshTokenHash: this.uSessionService.globalUtils.auth.hashToken(refreshToken),
                deviceName: this.uSessionService.globalUtils.auth.parseDeviceName(userAgent),
                lastActivityAt: now,
                expiredAt: this.calculateSessionExpirationDate(now, rememberMe),
                user,
            },
            { ipAddress, userAgent },
        );
    }

    /**
     * Updates an existing user session with a validated subset of provided changes.
     * The function selectively applies updates by trimming and persisting non-empty
     * string fields, while directly assigning supported non-string fields when defined.
     */
    async updateSession(
        session: UserSessionEntity,
        updates?: Partial<{
            refreshTokenHash: string;
            deviceName: string;
            ipAddress: string;
            userAgent: string;
            tokenVersion: number;
            lastActivityAt: Date;
            expiredAt: Date;
            revokedAt: Date;
        }>,
    ): Promise<UserSessionEntity | null> {
        if (!updates || Object.keys(updates).length === 0) return session;

        const stringFields = ['refreshTokenHash', 'deviceName', 'ipAddress', 'userAgent'] as const;
        const updatePayload: Partial<UserSessionEntity> = {};

        stringFields.forEach((field) => {
            if (updates[field]?.trim()) updatePayload[field] = updates[field].trim();
        });

        const otherFields = ['lastActivityAt', 'expiredAt', 'revokedAt', 'tokenVersion'] as const;

        otherFields.forEach((field) => {
            if (updates[field] !== undefined) updatePayload[field] = updates[field] as any;
        });

        return await this.uSessionService.uSessionRepo.update({ id: session.id }, updatePayload);
    }

    /**
     * Returns the number of active user sessions associated with the given user.
     */
    async userSessions(user: UserEntity): Promise<number> {
        return await this.uSessionService.uSessionRepo.count({
            where: {
                revokedAt: IsNull(),
                deleted: false,
                user: { id: user.id },
            },
        });
    }

    /**
     * Revokes the oldest active session for a user when the maximum allowed
     * number of concurrent sessions is reached.
     */
    async revokeOldSession(user: UserEntity) {
        const activeSessions = await this.userSessions(user);

        if (activeSessions >= this.uSessionService.envConfigService.maxUserSession) {
            const oldestSession = await this.uSessionService.uSessionRepo.findOne({
                where: {
                    user: { id: user.id },
                    revokedAt: IsNull(),
                    deleted: false,
                },
                order: { lastActivityAt: 'ASC' },
            });

            if (oldestSession) {
                this.uSessionService.logger.info(
                    `Revoking oldest session ${oldestSession.id} for user ${user.id}`,
                );

                await this.updateSession(oldestSession, {
                    revokedAt: new Date(),
                });
            }
        }
    }
}
