import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
    ResetPasswordRequestRepository,
    UsersCodeRepository,
    UsersRepository,
} from '../repositories';
import { PasswordHasherService } from '../../../helpers/password-hasher/password-hasher.service';
import { UserSessionService } from '../../user-session/services/user-session.service';
import { ErrorHandlerService } from '../../../common/response';
import { EnvConfigService } from '../../../utils/services/config';
import {
    AdminRegisterDto,
    AdminUserUpdateBySDto,
    PasswordChangeDto,
    PasswordResetDto,
    UserLoginDto,
    UserRegisterDto,
    UserUpdateDto,
    VerifyUserCodeDto,
} from '../dto';
import { PreUserService } from './pre-user.service';
import { RolesService } from '../../roles/roles.service';
import { CurrentUserInterface, GoogleUserInterface } from '../../../interface';
import { UserEntity } from '../entities/user.entity';
import { OtherUtils } from '../../../utils/services/tools';
import { UserCodeService } from './user-code.service';
import { ResetPasswordRequestService } from './reset-password-request.service';
import { MailerService } from '../../../libs/mailer/services';
import { UsersRelationsService } from './users-relations.service';
import { UsersEntityTransformService } from './users-entity-transform.service';
import { SocketService } from '../../../helpers/socket/socket.service';
import { SocketEventEnum, UsagePeriod, UserStatusEnum } from '../../../common/enum';
import { FileLinksService } from '../../files/services/file-links.service';
import { GroupsService } from '../../groups/groups.service';
import { CacheService } from '../../../helpers/cache/cache.service';
import { PermissionsService } from '../../permissions/permissions.service';
import { UserEmailSendingService } from './user-email-sending.service';
import { GroupEntity } from '../../groups/entities/group.entity';

@Injectable()
export class UsersService {
    /**
     * Service responsible for handling users operation
     */

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        @Inject(forwardRef(() => PreUserService))
        readonly preUserService: PreUserService,
        @Inject(forwardRef(() => UserCodeService))
        readonly userCodeService: UserCodeService,
        @Inject(forwardRef(() => ResetPasswordRequestService))
        readonly rPRequestService: ResetPasswordRequestService,
        @Inject(forwardRef(() => UserEmailSendingService))
        readonly uEmailSendingService: UserEmailSendingService,
        readonly fileLinksService: FileLinksService,
        readonly uRelationService: UsersRelationsService,
        readonly uETransformService: UsersEntityTransformService,
        readonly errorHandlerService: ErrorHandlerService,
        readonly userRepo: UsersRepository,
        readonly userCodeRepo: UsersCodeRepository,
        readonly rPRequestRepo: ResetPasswordRequestRepository,
        readonly envConfigService: EnvConfigService,
        readonly hashService: PasswordHasherService,
        readonly otherUtils: OtherUtils,
        readonly roleService: RolesService,
        readonly cacheService: CacheService,
        readonly groupService: GroupsService,
        readonly authService: UserSessionService,
        readonly permsService: PermissionsService,
        readonly mailerService: MailerService,
        readonly sockerService: SocketService,
    ) {}

    /**
     * Checks if a super admin user exists in the system
     * and returns a boolean result.
     */
    async ensureSuperAdminExist() {
        const isSuperAdminExist = await this.userRepo.findOne({
            where: { role: { label: this.envConfigService.sAdminRole } },
        });

        return !!isSuperAdminExist;
    }

    /**
     * Retrieves a paginated list of admin and support users, with optional filters for
     * status and search term. Results are cached based on filter criteria. Returns
     * transformed admin user data from cache if available, otherwise queries the database,
     * caches, and returns the results.
     */
    async allAdminUsers(
        page: number,
        limit: number,
        filterItems: {
            status?: UserStatusEnum;
            searchTerm?: string;
        },
    ) {
        this.logger.info(`Retrieve all admins and support from cache or database.`);
        const baseKey = this.cacheService.generateRedisKey('user-admins', {
            ...(filterItems.status ? { status: filterItems.status } : {}),
            ...(filterItems.searchTerm ? { search: filterItems.searchTerm.toLowerCase() } : {}),
        });

        return await this.cacheService.retrieveGenericPaginated(
            baseKey,
            page,
            limit,
            {
                status: filterItems.status,
                searchTerm: filterItems.searchTerm,
            },
            (offset: number, limit: number) =>
                this.preUserService.retrieveUsersQuery(offset, limit, {
                    labels: [this.envConfigService.adminRole, this.envConfigService.supportRole],
                    status: filterItems.status,
                    searchTerm: filterItems.searchTerm,
                }),
            (items: UserEntity[]) => this.uETransformService.transformAdmins(items),
        );
    }

    /**
     * Registers the super admin. Ensures only one super admin exists.
     */
    async registerSuperAdmin(registerDto: UserRegisterDto) {
        this.logger.info('Registering the super admin...');

        const isSuperExist = await this.ensureSuperAdminExist();
        if (isSuperExist)
            this.errorHandlerService.forbidden(
                'Forbidden, super admin already exists, please login',
            );

        await this.preUserService.registerUserCore(registerDto, this.envConfigService.sAdminRole);

        return { message: 'Super admin registered successfully' };
    }

    /**
     * Registers a standard user with default user role.
     */
    async registerUser(registerDto: UserRegisterDto) {
        this.logger.info(`Registering a new user with information ${JSON.stringify(registerDto)}`);

        await this.preUserService.registerUserCore(registerDto, this.envConfigService.userRole);

        return { message: 'User registered successfully' };
    }

    /**
     * Asynchronously registers a new admin user by a super admin.
     * Validates the uniqueness of the email, retrieves the specified role,
     * and ensures the role is either admin or support.
     * Creates the user entities, notifies relevant clients via socket,
     * sends a welcome email, and returns a success message.
     */
    async registerAdmin(adminDto: AdminRegisterDto) {
        this.logger.info('Registering an admin by super admin...');

        const { email, role, isAuthorized, groupId } = adminDto;

        await this.preUserService.validateUniqueFields(email);

        const userRole = await this.roleService.retrieveRoleByCriteria({
            label: role,
        });

        let group: GroupEntity | undefined = undefined;

        this.preUserService.ensureSysRoles(userRole.label);
        let status = UserStatusEnum.ACTIVE;

        if (isAuthorized !== undefined) {
            if (isAuthorized) status = UserStatusEnum.ACTIVE;
            else status = UserStatusEnum.SUSPENDED;
        }

        if (groupId) {
            group = await this.groupService.retrieveGroupByCriteria({
                id: groupId,
            });
        }

        const user = await this.userRepo.create(
            this.preUserService.buildUserEntity({ email, role: userRole }, { status, group }),
        );

        this.preUserService.wsAdminUser(user, SocketEventEnum.ADMIN_USER_CREATED);

        const request = await this.rPRequestService.handleResetPasswordRequest(user);

        this.uEmailSendingService.sendWelcomeEmailToAdmin(user, request.id);

        setImmediate(async () => {
            await this.preUserService.scheduleUsersInvalidateCache();
        });

        return { message: 'Admin registered successfully' };
    }

    /**
     * Authenticates a user via Google by checking for an existing user with the provided email.
     * If the user exists, synchronizes their Google data; otherwise, creates a new user.
     * Generates and returns a new user session with access and refresh tokens.
     * Logs the authentication attempt for tracking.
     */
    async authenticateWithGoogle(
        user: GoogleUserInterface,
        userAgent?: string,
        ipAddress?: string,
    ) {
        this.logger.info(`Authenticating user from google with data ${JSON.stringify(user)}`);

        const existingUser = await this.preUserService.findUserByEmail(user.email, ['role']);

        const authenticatedUser = existingUser
            ? await this.preUserService.syncExistingGoogleUser(existingUser, user)
            : await this.preUserService.createGoogleUser(user);

        return this.authService.generateUserSession(authenticatedUser, false, userAgent, ipAddress);
    }

    /**
     * Generates and sends a login OTP to the user's email.
     * Creates a user code for the provided user and logs the generated OTP code.
     * Sends a verification email containing the OTP to the user.
     * Returns an object with a message confirming the OTP has been sent.
     */
    async generateAndSendLoginOtp(user: UserEntity, rememberMe: boolean) {
        const { code } = await this.userCodeService.createUserCode(user, rememberMe);

        console.log(code, '===========');
        this.uEmailSendingService.sendUserOTP(user, code);
        return {
            message: `A one-time password (OTP) has been sent to your email address.`,
        };
    }

    /**
     * Authenticates a user by validating their email and password.
     * Ensures the user exists, has a password, and the password matches.
     * Generates and sends a login OTP (One-Time Password) to the user.
     */
    async loginUser(loginDto: UserLoginDto) {
        this.logger.info(`Login new user with data ${JSON.stringify(loginDto)}`);

        const { email, password, rememberMe } = loginDto;

        const isUserExist = await this.preUserService.retrieveUserByCriteria({
            email,
        });
        this.preUserService.checkUserIsActive(isUserExist);
        this.preUserService.ensureUserHasPassword(isUserExist);

        await this.preUserService.ensurePasswordMatch(isUserExist, password);
        return await this.generateAndSendLoginOtp(isUserExist, rememberMe ?? false);
    }

    /**
     * Verifies a user code based on the provided verification data.
     * Logs the verification process and retrieves the user by their email.
     * Verifies the user code and deletes it upon successful verification.
     * Returns an object with a success message indicating that the user was verified successfully.
     */
    async verifyUserCode(verifyDto: VerifyUserCodeDto, userAgent?: string, ipAddress?: string) {
        this.logger.info(`Verifying user code with data: ${JSON.stringify(verifyDto)}`);

        const user = await this.preUserService.retrieveUserByCriteria(
            {
                email: verifyDto.email,
            },
            ['role'],
        );

        const code = await this.userCodeService.verifyUserCode(verifyDto);
        await this.userCodeService.deleteUserCode(user.id);

        return this.authService.generateUserSession(user, code.rememberMe, userAgent, ipAddress);
    }

    /**
     * Resends a one-time password confirmation code to a user's email.
     * Logs the process and retrieves the user by their email.
     * Use the Cognito service to resend the confirmation code.
     * Returns an object with a success message indicating that the confirmation code was resented successfully.
     */
    async resendCode(email: string) {
        this.logger.info(`Resend a new one-time-password to the user with email: ${email}`);
        const isUserExist = await this.preUserService.retrieveUserByCriteria({
            email,
        });

        const { code } = await this.userCodeService.askNewCode(isUserExist);
        this.uEmailSendingService.sendUserOTP(isUserExist, code);
        return { message: 'Confirmation code resent successfully' };
    }

    /**
     * Creates a reset password request for a user with the specified email.
     * Logs the creation process and checks if the user exists and is verified.
     * Retrieves any existing password reset request and creates a new one if necessary.
     * Send the request email to the user
     * and return a message instructing the user to check their email for further instructions.
     */
    async createResetPasswordRequest(email: string): Promise<object> {
        this.logger.info(
            `Creating reset password request for email: ${email} and send email to user`,
        );

        const isUserExist = await this.preUserService.retrieveUserByCriteria(
            {
                email,
            },
            ['role'],
        );
        const request = await this.rPRequestService.handleResetPasswordRequest(isUserExist);

        this.uEmailSendingService.sendResetPasswordMail(isUserExist, request.id);

        return {
            message: `Reset password request sent. Please check your email for instructions.`,
        };
    }

    /**
     * Resets a user’s password by request ID,
     * updates the account with the new password,
     * and deletes the reset password request.
     */
    async resetPassword(id: string, resetPasswordDto: PasswordResetDto) {
        this.logger.info(`Reset password for request with id: ${id}`);

        const isUserExist = await this.rPRequestService.getResetPasswordRequestById(id);

        await this.preUserService.updateUserDetails(isUserExist, {
            password: await this.hashService.hashPassword(resetPasswordDto.newPassword),
        });

        await this.rPRequestService.deleteResetPasswordRequest(isUserExist.id);

        return {
            message: 'Password reset successfully',
        };
    }

    /**
     * Updates a user’s password after verifying the current one,
     * then saves the new password securely.
     */
    async updatePassword(id: string, dto: PasswordChangeDto) {
        this.logger.info(`Updating password for user with id: ${id}`);

        const isUserExist = await this.preUserService.retrieveUserByCriteria({
            id,
        });

        this.preUserService.ensureUserHasPassword(isUserExist);
        await this.preUserService.ensurePasswordMatch(isUserExist, dto.oldPassword);

        await this.preUserService.updateUserDetails(isUserExist, {
            password: await this.hashService.hashPassword(dto.newPassword),
        });

        return {
            message: 'Password updated successfully',
        };
    }

    /**
     * Retrieves detailed information about the currently authenticated user.
     * Fetches the user entities with role and avatar relations, then transforms
     * it into a format suitable for client consumption, including role label,
     * avatar details, and password existence status.
     */
    async userConnectedInfo(user: CurrentUserInterface) {
        this.logger.info(`Get user connected details`);
        const isUserExist = await this.preUserService.retrieveUserByCriteria(
            { id: user.id },
            this.uRelationService.getCurrentUserRelations(),
        );

        return this.uETransformService.toConnectedUserInfo(isUserExist);
    }

    /**
     * Updates user information for the authenticated user by retrieving the existing
     * user record with avatar relationships, preparing the update data, applying the
     * changes, and returning a success message.
     */
    async updateUserInfo(user: CurrentUserInterface, updateDto: UserUpdateDto) {
        this.logger.info(`Updating user information for user with id: ${user.id}`);

        const isUserExist = await this.preUserService.retrieveUserByCriteria({ id: user.id }, [
            'avatar',
            'avatar.file',
        ]);
        const userUpdates = await this.preUserService.prepareUserUpdates(updateDto);

        await this.preUserService.updateUserDetails(isUserExist, userUpdates);

        setImmediate(async () => {
            await this.cacheService.deleteKeysByBase('members');
            if (user.role !== this.envConfigService.userRole)
                await this.cacheService.deleteKeysByBase('user-admins');
        });

        return { message: 'Updated user information' };
    }

    /**
     * Updates an admin user's information by validating they have a system role (admin or support),
     * applying the provided updates, broadcasting the changes via WebSocket, and asynchronously
     * invalidating the admin users cache. Returns a success message upon completion.
     */
    async updateAdminUser(id: string, updateDto: AdminUserUpdateBySDto) {
        this.logger.info(`Updating admin user with id: ${id}`);

        const isAdminExist = await this.preUserService.retrieveUserByCriteria({ id }, [
            'role',
            'group',
        ]);

        this.preUserService.ensureSysRoles(isAdminExist.role.label);

        const updates = await this.preUserService.prepareAdminUpdates(updateDto);

        await this.preUserService.updateUserDetails(isAdminExist, updates);

        const updatedUser = await this.preUserService.retrieveUserByCriteria({ id }, [
            'role',
            'group',
        ]);

        this.preUserService.wsAdminUser(updatedUser, SocketEventEnum.ADMIN_USER_UPDATED);

        setImmediate(async () => {
            await this.preUserService.scheduleUsersInvalidateCache();
        });

        return { message: 'Updated admin user information' };
    }

    /**
     * Retrieves new user registration chart data comparing current period to the previous period.
     * Logs the request and resolved date ranges, resolves start date, previous start date, and end date for the specified period,
     * fetches registration counts grouped by month for both periods in parallel,
     * logs the number of entries retrieved, and returns an object containing current and previous period data.
     */
    async getNewRegistersChart(period: UsagePeriod): Promise<{
        current: { month: string; count: number }[];
        previous: { month: string; count: number }[];
    }> {
        this.logger.info(`Fetching new registers chart for period: ${period}`);

        const { startDate, previousStartDate, endDate } =
            this.otherUtils.resolvePeriodDates(period);

        this.logger.info(
            `Resolved dates — current: [${startDate.toISOString()} → ${endDate.toISOString()}], previous: [${previousStartDate.toISOString()} → ${startDate.toISOString()}]`,
        );

        const [current, previous] = await Promise.all([
            this.preUserService.getRegistersByPeriod(startDate, endDate),
            this.preUserService.getRegistersByPeriod(previousStartDate, startDate),
        ]);

        this.logger.info(
            `Registers chart fetched — current: ${current.length} entries, previous: ${previous.length} entries`,
        );

        return { current, previous };
    }
}
