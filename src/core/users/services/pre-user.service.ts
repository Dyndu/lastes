import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { UsersService } from './users.service';
import { RoleEntity } from '../../roles/entities/role.entity';
import { UserEntity } from '../entities/user.entity';
import { FileUsageEnum, SocketEventEnum, UserStatusEnum } from '../../../common/enum';
import { FileLinksEntity } from '../../files/entities/file-links.entity';
import { AdminUserUpdateBySDto, UserRegisterDto, UserUpdateDto } from '../dto';
import { GroupEntity } from '../../groups/entities/group.entity';
import { GoogleUserInterface } from '../../../interface';

@Injectable()
export class PreUserService {
    /**
     * Service responsible for handling user pre operations
     */

    constructor(
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,
    ) {}

    /**
     * Validates that the user account is active.
     * Throws a forbidden error if the user is not active.
     */
    checkUserIsActive(user: UserEntity) {
        if (user.status !== UserStatusEnum.ACTIVE)
            this.usersService.errorHandlerService.forbidden(
                `User with id: ${user.id} is not active`,
                `Forbidden, account unactive`,
            );
    }

    /**
     * Ensures that Google authentication is allowed for the user.
     * Throws a forbidden error if the user is already registered with a password and lacks a Google ID.
     */
    ensureGoogleAuthAllowed(user: UserEntity, email: string) {
        if (!user.googleId && user.password)
            this.usersService.errorHandlerService.forbidden(
                `User with email ${email} already registered with password`,
                `Please login with your password instead of Google.`,
            );
    }

    /**
     * Ensures the user has a password set.
     * Throws a forbidden error if the user has no password, suggesting a reset or Google login.
     */
    ensureUserHasPassword(user: UserEntity) {
        if (!user.password)
            this.usersService.errorHandlerService.forbidden(
                `User with email ${user.email} has no password, can't update password`,
                `Forbidden, either reset or login with google`,
            );
    }

    /**
     * Validates that the provided role label matches either the system admin or support
     * role, throwing a forbidden error if the role is neither of the allowed system roles.
     */
    ensureSysRoles(label: string) {
        if (
            ![
                this.usersService.envConfigService.supportRole,
                this.usersService.envConfigService.adminRole,
            ].includes(label)
        )
            this.usersService.errorHandlerService.forbidden(
                `Created user has to be either admin or support`,
                `Forbidden, unknow attribution`,
            );
    }

    /**
     * Builds a base query for users with optional filters for role labels, status, and
     * search term, excluding deleted users. Includes relationships for group, role, and
     * avatar with file details. The search term applies fuzzy matching across user fullname,
     * role label, and group label.
     */
    buildUserBaseQuery(filters: {
        labels?: string[];
        status?: UserStatusEnum;
        searchTerm?: string;
    }) {
        const { searchTerm, status, labels } = filters;

        const query = this.usersService.userRepo
            .getRepository()
            .createQueryBuilder('user')
            .andWhere('user.deleted = false')
            .leftJoinAndSelect('user.group', 'group')
            .leftJoinAndSelect('user.role', 'role')
            .leftJoinAndSelect('user.avatar', 'fileLinks')
            .leftJoinAndSelect('fileLinks.file', 'file');

        if (labels && labels.length > 0) query.andWhere('role.label IN (:...labels)', { labels });

        if (status) query.andWhere('user.status = :status', { status });

        if (searchTerm) {
            const likePattern = `%${searchTerm.split('').join('%')}%`;
            query.andWhere(
                `(user.fullname ILIKE :searchTerm
              OR role.label ILIKE :searchTerm
              OR group.label ILIKE :searchTerm)`,
                { searchTerm: likePattern },
            );
        }

        return query;
    }

    /**
     * Retrieves a paginated query for users with optional filters, ordered by most
     * recently updated. Applies offset and limit for pagination and returns the
     * configured query builder.
     */
    retrieveUsersQuery(
        offset: number,
        limit: number,
        filters: {
            labels?: string[];
            status?: UserStatusEnum;
            searchTerm?: string;
        },
    ) {
        const queryBuilder = this.buildUserBaseQuery(filters);

        queryBuilder.orderBy('user.updatedAt', 'DESC').skip(offset).take(limit);

        return queryBuilder;
    }

    /**
     * Constructs and returns a new UserEntity by merging required user properties
     * (email and role) with optional properties (password, fullname, Google ID, and Google avatar).
     */
    buildUserEntity(
        required: {
            email: string;
            role: RoleEntity;
        },
        optional: {
            password?: string;
            fullname?: string;
            googleId?: string;
            googleAvatar?: string;
            group?: GroupEntity;
            status?: UserStatusEnum;
        },
    ) {
        const user = new UserEntity();
        Object.assign(user, required, optional);
        return user;
    }

    /**
     * Retrieves a user based on the provided criteria and optional relations.
     * Logs the search criteria and throws a "not found" error if no matching user exists.
     * Returns the user if found.
     */
    async retrieveUserByCriteria(
        criteria: Record<string, any>,
        relations?: string[],
    ): Promise<UserEntity> {
        const entries = this.usersService.otherUtils.formatCriteria(criteria);

        this.usersService.logger.info(`Find a user by ${entries}`);

        const isUserExist = await this.usersService.userRepo.findActiveOne(
            this.usersService.userRepo,
            criteria,
            relations,
        );

        if (!isUserExist)
            this.usersService.errorHandlerService.notFound(
                `Data not found with ${entries}`,
                `Data not found`,
            );

        return isUserExist;
    }

    /**
     * Retrieves a user by their email address, optionally including specified relations.
     * Returns the user if found, or null otherwise.
     */
    findUserByEmail(email: string, relations?: string[]) {
        return this.usersService.userRepo.findOne({
            where: { email },
            relations,
        });
    }

    /**
     * Validates that the provided email is unique among active users.
     * Adds an error to the validationErrors object if the email is already in use.
     */
    async assertEmailIsUnique(email: string, validationErrors: Record<string, string> = {}) {
        await this.usersService.userRepo.assertUniqueActive(
            this.usersService.userRepo,
            validationErrors,
            { email },
            'User',
        );
    }

    /**
     * Validates that the provided email is unique.
     * Throws a validation error if the email is already in use.
     */
    async validateUniqueFields(email: string) {
        const errors: Record<string, string> = {};
        await this.assertEmailIsUnique(email, errors);

        if (Object.keys(errors).length > 0)
            throw this.usersService.errorHandlerService.validation(errors);
    }

    /**
     * Updates the provided channel entities with the given partial data.
     * Trims string fields, applies other updates if defined, and persists changes to the repository.
     * Returns a message indicating success or if no updates were provided.
     */
    async updateUserDetails(
        user: UserEntity,
        updates?: Partial<{
            fullname: string;
            email: string;
            password: string;
            stripeCustomerId: string;
            googleAvatar: string;
            googleId: string;
            status: UserStatusEnum;
            avatar?: FileLinksEntity;
            role?: RoleEntity;
            group?: GroupEntity;
        }>,
    ) {
        if (!updates || Object.keys(updates).length === 0)
            return { message: 'No updates provided' };

        const stringFields = [
            'fullname',
            'email',
            'password',
            'googleAvatar',
            'googleId',
            'stripeCustomerId',
        ] as const;

        const updatePayload: Partial<UserEntity> = {};

        stringFields.forEach((field) => {
            if (updates[field]?.trim()) updatePayload[field] = updates[field].trim();
        });

        const otherFields = ['status'] as const;

        otherFields.forEach((field) => {
            if (updates[field] !== undefined) updatePayload[field] = updates[field] as any;
        });

        const entityFields = ['avatar', 'role', 'group'] as const;

        entityFields.forEach((field) => {
            if (updates[field] !== undefined) updatePayload[field] = updates[field] as any;
        });

        return await this.usersService.userRepo.update({ id: user.id }, updatePayload);
    }

    /**
     * Core registration logic shared between different user types.
     * Validates email uniqueness, hashes password, assigns role,
     * creates user entities and sends welcome email.
     */
    async registerUserCore(registerDto: UserRegisterDto, roleLabel: string): Promise<UserEntity> {
        const { email, password, fullname } = registerDto;

        await this.validateUniqueFields(email);
        const hashedPassword = await this.usersService.hashService.hashPassword(password);

        const role = await this.usersService.roleService.retrieveRoleByCriteria({
            label: roleLabel,
        });

        const user = await this.usersService.userRepo.create(
            this.buildUserEntity({ email, role }, { fullname, password: hashedPassword }),
        );

        this.usersService.uEmailSendingService.sendWelcomeEmail(user);

        return user;
    }

    /**
     * Synchronizes an existing user with their Google account by ensuring the user is active,
     * verifying Google authentication is allowed for the user, and updating the user's avatar
     * with the Google profile picture if available.
     */
    async syncExistingGoogleUser(user: UserEntity, googleUser: GoogleUserInterface) {
        this.checkUserIsActive(user);

        this.ensureGoogleAuthAllowed(user, googleUser.email);
        await this.syncGoogleAvatar(user, googleUser.picture);
        return user;
    }

    /**
     * Synchronizes the user's Google avatar by updating it with the provided picture URL,
     * if the user has a Google ID, a new picture is provided, and it differs from the current avatar.
     */
    async syncGoogleAvatar(user: UserEntity, picture?: string) {
        if (!user.googleId || !picture || user.googleAvatar === picture) return;
        await this.updateUserDetails(user, { googleAvatar: picture });
    }

    /**
     * Creates a new user from Google authentication data by retrieving the default user role,
     * building a user entities with the provided Google user details, and saving it.
     * Logs the creation of the new user.
     */
    async createGoogleUser(user: GoogleUserInterface) {
        this.usersService.logger.info(
            `Creating a new user from google with information ${JSON.stringify(user)}`,
        );
        const role = await this.usersService.roleService.retrieveRoleByCriteria({
            label: this.usersService.envConfigService.userRole,
        });

        const newUser = await this.usersService.userRepo.create(
            this.buildUserEntity(
                { email: user.email, role },
                {
                    fullname: `${user.firstName} ${user.lastName}`.trim(),
                    googleId: user.googleId,
                    googleAvatar: user.picture,
                },
            ),
        );

        this.usersService.logger.info(`New user created via Google: ${newUser.id}`);
        return newUser;
    }

    /**
     * Invalidates all cached user admin data by deleting cache entries with the
     * 'user-admins' base key prefix.
     */
    async scheduleUsersInvalidateCache() {
        await this.usersService.cacheService.deleteKeysByBase('user-admins');
    }

    /**
     * Validates that the provided password matches the user's stored password.
     * Throws a forbidden error if the passwords do not match.
     */
    async ensurePasswordMatch(user: UserEntity, password: string) {
        const match = await this.usersService.hashService.comparePassword(password, user.password!);
        if (!match)
            this.usersService.errorHandlerService.forbidden(
                `Provided password doesn't match the existing one`,
                `Password doesn't match`,
            );
    }

    /**
     * Prepares user update data from the provided DTO by processing the fullname
     * and avatar fields. If an avatar is provided, links the file to the user entities
     * with the USER_AVATAR usage type. Returns a partial object with the prepared updates.
     */
    async prepareUserUpdates(updateDto: UserUpdateDto): Promise<
        Partial<{
            fullname: string;
            avatar: FileLinksEntity;
        }>
    > {
        const { fullname, avatar } = updateDto;

        const userUpdates: Partial<{
            fullname: string;
            avatar: FileLinksEntity;
        }> = {};

        if (fullname) userUpdates.fullname = fullname;
        if (avatar)
            userUpdates.avatar = await this.usersService.fileLinksService.linkFileToEntity(
                avatar,
                FileUsageEnum.USER_AVATAR,
            );

        return userUpdates;
    }

    /**
     * Prepares administrative user update data from the provided DTO by processing
     * status, role, and group fields. Retrieves and validates role and group entities
     * if their IDs are provided. Returns a partial object with the prepared updates.
     */
    async prepareAdminUpdates(updateDto: AdminUserUpdateBySDto): Promise<
        Partial<{
            status: UserStatusEnum;
            group: GroupEntity;
            role: RoleEntity;
        }>
    > {
        const { roleId, groupId, status } = updateDto;

        const userUpdates: Partial<{
            status: UserStatusEnum;
            group: GroupEntity;
            role: RoleEntity;
        }> = {};

        if (status) userUpdates.status = status;
        if (roleId)
            userUpdates.role = await this.usersService.roleService.retrieveRoleByCriteria({
                label: roleId,
            });
        if (groupId)
            userUpdates.group = await this.usersService.groupService.retrieveGroupByCriteria({
                id: groupId,
            });

        return userUpdates;
    }

    /**
     * Broadcasts a WebSocket event for an admin user to clients subscribed to the
     * '/admin-users' route, sending the transformed admin user data as the payload.
     */
    wsAdminUser(user: UserEntity, event: SocketEventEnum) {
        this.usersService.sockerService.sendDataToRoute('/admin-users', event, {
            payload: [this.usersService.uETransformService.transformAdmin(user)],
        });
    }

    /**
     * Retrieves admin users by their permissions (label and action).
     * Returns a list of users with matching permissions, including their IDs and emails.
     */
    async adminByPermissions(label: string, action: string) {
        return await this.usersService.userRepo.find({
            where: { group: { permissions: { label, action } } },
            select: ['id', 'email'],
        });
    }

    /**
     * Retrieves user registration counts grouped by month within a specified date range.
     * Queries non-deleted users whose creation date falls between the from and to dates, groups results by month name using the 'Mon' format,
     * orders chronologically by month start date, and returns an array of objects with month name and registration count.
     */
    async getRegistersByPeriod(from: Date, to: Date): Promise<{ month: string; count: number }[]> {
        const rows = await this.usersService.userRepo
            .getRepository()
            .createQueryBuilder('user')
            .innerJoin('user.role', 'role')
            .select(`TO_CHAR(user.createdAt, 'Mon')`, 'month')
            .addSelect(`COUNT(user.id)`, 'count')
            .where('user.deleted = false')
            .andWhere('user.createdAt >= :from', { from })
            .andWhere('user.createdAt < :to', { to })
            .andWhere('role.label = :roleLabel', {
                roleLabel: this.usersService.envConfigService.userRole,
            })
            .groupBy(`TO_CHAR(user.createdAt, 'Mon')`)
            .addGroupBy(`DATE_TRUNC('month', user.createdAt)`)
            .orderBy(`DATE_TRUNC('month', user.createdAt)`, 'ASC')
            .getRawMany();

        return rows.map((r) => ({ month: r.month, count: Number(r.count) }));
    }
}
