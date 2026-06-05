import { UsersService } from './users.service';
import { UserStatusEnum, SocketEventEnum } from '../../../common/enum';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const makeLogger = () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
});

const makeEnvConfig = () => ({
    stagingPassword: 'staging-secret',
    sAdminRole: 'super-admin',
    adminRole: 'admin',
    supportRole: 'support',
    userRole: 'user',
});

const makeErrorHandler = () => ({
    forbidden: jest.fn().mockImplementation((msg: string) => {
        throw new Error(msg);
    }),
});

const makeUserRepo = () => ({
    findOne: jest.fn(),
    create: jest.fn(),
});

const makeCacheService = () => ({
    generateRedisKey: jest.fn().mockReturnValue('cache-key'),
    retrieveGenericPaginated: jest.fn(),
    deleteKeysByBase: jest.fn().mockResolvedValue(undefined),
});

const makePreUserService = () => ({
    registerUserCore: jest.fn(),
    retrieveUsersQuery: jest.fn(),
    validateUniqueFields: jest.fn().mockResolvedValue(undefined),
    ensureSysRoles: jest.fn(),
    buildUserEntity: jest.fn().mockReturnValue({ id: 'user-uuid' }),
    wsAdminUser: jest.fn(),
    scheduleUsersInvalidateCache: jest.fn().mockResolvedValue(undefined),
    findUserByEmail: jest.fn(),
    syncExistingGoogleUser: jest.fn(),
    createGoogleUser: jest.fn(),
    retrieveUserByCriteria: jest.fn(),
    checkUserIsActive: jest.fn(),
    ensureUserHasPassword: jest.fn(),
    ensurePasswordMatch: jest.fn(),
    updateUserDetails: jest.fn().mockResolvedValue(undefined),
    prepareUserUpdates: jest.fn(),
    prepareAdminUpdates: jest.fn(),
});

const makeUserCodeService = () => ({
    createUserCode: jest.fn(),
    verifyUserCode: jest.fn(),
    deleteUserCode: jest.fn().mockResolvedValue(undefined),
    askNewCode: jest.fn(),
});

const makeRPRequestService = () => ({
    handleResetPasswordRequest: jest.fn(),
    getResetPasswordRequestById: jest.fn(),
    deleteResetPasswordRequest: jest.fn().mockResolvedValue(undefined),
});

const makeUEmailSendingService = () => ({
    sendWelcomeEmailToAdmin: jest.fn(),
    sendUserOTP: jest.fn(),
    sendResetPasswordMail: jest.fn(),
});

const makeUETransformService = () => ({
    transformAdmins: jest.fn(),
    toConnectedUserInfo: jest.fn(),
});

const makeURelationService = () => ({
    getCurrentUserRelations: jest.fn().mockReturnValue(['role', 'avatar']),
});

const makeRoleService = () => ({
    retrieveRoleByCriteria: jest.fn(),
});

const makeGroupService = () => ({
    retrieveGroupByCriteria: jest.fn(),
});

const makeAuthService = () => ({
    generateUserSession: jest.fn(),
});

const makeHashService = () => ({
    hashPassword: jest.fn().mockResolvedValue('hashed-password'),
});

function buildService(overrides: Record<string, any> = {}) {
    const deps = {
        logger: makeLogger(),
        preUserService: makePreUserService(),
        userCodeService: makeUserCodeService(),
        rPRequestService: makeRPRequestService(),
        uEmailSendingService: makeUEmailSendingService(),
        fileLinksService: {},
        uRelationService: makeURelationService(),
        uETransformService: makeUETransformService(),
        errorHandlerService: makeErrorHandler(),
        userRepo: makeUserRepo(),
        userCodeRepo: {},
        rPRequestRepo: {},
        envConfigService: makeEnvConfig(),
        hashService: makeHashService(),
        otherUtils: {},
        roleService: makeRoleService(),
        cacheService: makeCacheService(),
        groupService: makeGroupService(),
        authService: makeAuthService(),
        permsService: {},
        mailerService: {},
        sockerService: {},
        ...overrides,
    };

    const service = new UsersService(
        deps.logger as any,
        deps.preUserService as any,
        deps.userCodeService as any,
        deps.rPRequestService as any,
        deps.uEmailSendingService as any,
        deps.fileLinksService as any,
        deps.uRelationService as any,
        deps.uETransformService as any,
        deps.errorHandlerService as any,
        deps.userRepo as any,
        deps.userCodeRepo as any,
        deps.rPRequestRepo as any,
        deps.envConfigService as any,
        deps.hashService as any,
        deps.otherUtils as any,
        deps.roleService as any,
        deps.cacheService as any,
        deps.groupService as any,
        deps.authService as any,
        deps.permsService as any,
        deps.mailerService as any,
        deps.sockerService as any,
    );

    return { service, deps };
}

describe('UsersService', () => {
    describe('ensureSuperAdminExist', () => {
        it('returns true when a super admin exists', async () => {
            const { service, deps } = buildService();
            deps.userRepo.findOne.mockResolvedValueOnce({ id: 'uuid-1' });

            const result = await service.ensureSuperAdminExist();

            expect(result).toBe(true);
            expect(deps.userRepo.findOne).toHaveBeenCalledWith({
                where: { role: { label: 'super-admin' } },
            });
        });

        it('returns false when no super admin exists', async () => {
            const { service, deps } = buildService();
            deps.userRepo.findOne.mockResolvedValueOnce(null);
            expect(await service.ensureSuperAdminExist()).toBe(false);
        });
    });

    describe('allAdminUsers', () => {
        it('generates cache key with status and lowercased searchTerm', async () => {
            const { service, deps } = buildService();
            deps.cacheService.retrieveGenericPaginated.mockResolvedValueOnce({});

            await service.allAdminUsers(1, 10, {
                status: UserStatusEnum.ACTIVE,
                searchTerm: 'John',
            });

            expect(deps.cacheService.generateRedisKey).toHaveBeenCalledWith('user-admins', {
                status: UserStatusEnum.ACTIVE,
                search: 'john',
            });
        });

        it('generates cache key without filters when none provided', async () => {
            const { service, deps } = buildService();
            deps.cacheService.retrieveGenericPaginated.mockResolvedValueOnce({});

            await service.allAdminUsers(1, 10, {});

            expect(deps.cacheService.generateRedisKey).toHaveBeenCalledWith('user-admins', {});
        });

        it('generates cache key with only status', async () => {
            const { service, deps } = buildService();
            deps.cacheService.retrieveGenericPaginated.mockResolvedValueOnce({});

            await service.allAdminUsers(1, 10, {
                status: UserStatusEnum.SUSPENDED,
            });

            expect(deps.cacheService.generateRedisKey).toHaveBeenCalledWith('user-admins', {
                status: UserStatusEnum.SUSPENDED,
            });
        });

        it('generates cache key with only searchTerm', async () => {
            const { service, deps } = buildService();
            deps.cacheService.retrieveGenericPaginated.mockResolvedValueOnce({});

            await service.allAdminUsers(1, 10, { searchTerm: 'Alice' });

            expect(deps.cacheService.generateRedisKey).toHaveBeenCalledWith('user-admins', {
                search: 'alice',
            });
        });

        it('calls retrieveGenericPaginated with correct args and returns its result', async () => {
            const { service, deps } = buildService();
            const expected = { items: [{ id: 'u1' }], total: 1 };
            deps.cacheService.retrieveGenericPaginated.mockResolvedValueOnce(expected);

            const result = await service.allAdminUsers(2, 5, {});

            expect(deps.cacheService.retrieveGenericPaginated).toHaveBeenCalledWith(
                'cache-key',
                2,
                5,
                { status: undefined, searchTerm: undefined },
                expect.any(Function),
                expect.any(Function),
            );
            expect(result).toEqual(expected);
        });

        it('transformer callback delegates to uETransformService.transformAdmins', async () => {
            const { service, deps } = buildService();
            let capturedTransformer: (items: any[]) => any;

            deps.cacheService.retrieveGenericPaginated.mockImplementationOnce(
                (_k, _p, _l, _f, _fetcher, transformer) => {
                    capturedTransformer = transformer;
                    return Promise.resolve({});
                },
            );

            await service.allAdminUsers(1, 10, {});
            const fakeUsers = [{ id: 'u1' }];
            capturedTransformer!(fakeUsers);
            expect(deps.uETransformService.transformAdmins).toHaveBeenCalledWith(fakeUsers);
        });

        it('fetcher callback calls preUserService.retrieveUsersQuery with correct labels and filters', async () => {
            const { service, deps } = buildService();
            let capturedFetcher: (offset: number, limit: number) => any;

            deps.cacheService.retrieveGenericPaginated.mockImplementationOnce(
                (_k, _p, _l, _f, fetcher) => {
                    capturedFetcher = fetcher;
                    return Promise.resolve({});
                },
            );

            await service.allAdminUsers(1, 10, {
                status: UserStatusEnum.ACTIVE,
                searchTerm: 'Bob',
            });

            capturedFetcher!(0, 10);
            expect(deps.preUserService.retrieveUsersQuery).toHaveBeenCalledWith(0, 10, {
                labels: ['admin', 'support'],
                status: UserStatusEnum.ACTIVE,
                searchTerm: 'Bob',
            });
        });
    });

    describe('registerSuperAdmin', () => {
        const dto = {
            fullname: 'Super',
            email: 'super@admin.com',
            password: 'P@ss12345678',
            confirmPassword: 'P@ss12345678',
        };

        it('registers super admin when none exists', async () => {
            const { service, deps } = buildService();
            deps.userRepo.findOne.mockResolvedValueOnce(null);
            deps.preUserService.registerUserCore.mockResolvedValueOnce(undefined);

            const result = await service.registerSuperAdmin(dto as any);

            expect(deps.preUserService.registerUserCore).toHaveBeenCalledWith(dto, 'super-admin');
            expect(result).toEqual({
                message: 'Super admin registered successfully',
            });
        });

        it('calls forbidden and does not register when super admin already exists', async () => {
            const { service, deps } = buildService();
            deps.userRepo.findOne.mockResolvedValueOnce({ id: 'uuid-1' });

            await expect(service.registerSuperAdmin(dto as any)).rejects.toThrow(
                'Forbidden, super admin already exists, please login',
            );
            expect(deps.preUserService.registerUserCore).not.toHaveBeenCalled();
        });
    });

    describe('registerUser', () => {
        const dto = {
            fullname: 'User',
            email: 'u@u.com',
            password: 'P@ss12345678',
            confirmPassword: 'P@ss12345678',
        };

        it('registers user with user role and returns success', async () => {
            const { service, deps } = buildService();
            deps.preUserService.registerUserCore.mockResolvedValueOnce(undefined);

            const result = await service.registerUser(dto as any);

            expect(deps.preUserService.registerUserCore).toHaveBeenCalledWith(dto, 'user');
            expect(result).toEqual({ message: 'User registered successfully' });
        });

        it('propagates errors from registerUserCore', async () => {
            const { service, deps } = buildService();
            deps.preUserService.registerUserCore.mockRejectedValueOnce(new Error('Email taken'));

            await expect(service.registerUser(dto as any)).rejects.toThrow('Email taken');
        });
    });

    describe('registerAdmin', () => {
        const fakeRole = { label: 'admin' };
        const fakeUser = { id: 'user-uuid', email: 'admin@example.com' };
        const fakeRequest = { id: 'request-uuid' };

        function setupAdminMocks(deps: ReturnType<typeof buildService>['deps']) {
            deps.roleService.retrieveRoleByCriteria.mockResolvedValue(fakeRole);
            deps.userRepo.create.mockResolvedValue(fakeUser);
            deps.rPRequestService.handleResetPasswordRequest.mockResolvedValue(fakeRequest);
        }

        it('registers admin with ACTIVE status when isAuthorized is true', async () => {
            const { service, deps } = buildService();
            setupAdminMocks(deps);

            const result = await service.registerAdmin({
                email: 'admin@example.com',
                role: 'admin',
                isAuthorized: true,
            } as any);

            expect(deps.preUserService.validateUniqueFields).toHaveBeenCalledWith(
                'admin@example.com',
            );
            expect(deps.roleService.retrieveRoleByCriteria).toHaveBeenCalledWith({
                label: 'admin',
            });
            expect(deps.preUserService.ensureSysRoles).toHaveBeenCalledWith('admin');
            expect(deps.preUserService.buildUserEntity).toHaveBeenCalledWith(
                { email: 'admin@example.com', role: fakeRole },
                { status: UserStatusEnum.ACTIVE, group: undefined },
            );
            expect(deps.userRepo.create).toHaveBeenCalled();
            expect(deps.preUserService.wsAdminUser).toHaveBeenCalledWith(
                fakeUser,
                SocketEventEnum.ADMIN_USER_CREATED,
            );
            expect(deps.rPRequestService.handleResetPasswordRequest).toHaveBeenCalledWith(fakeUser);
            expect(deps.uEmailSendingService.sendWelcomeEmailToAdmin).toHaveBeenCalledWith(
                fakeUser,
                fakeRequest.id,
            );
            expect(result).toEqual({
                message: 'Admin registered successfully',
            });
        });

        it('registers admin with SUSPENDED status when isAuthorized is false', async () => {
            const { service, deps } = buildService();
            setupAdminMocks(deps);

            await service.registerAdmin({
                email: 'a@b.com',
                role: 'admin',
                isAuthorized: false,
            } as any);

            expect(deps.preUserService.buildUserEntity).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ status: UserStatusEnum.SUSPENDED }),
            );
        });

        it('defaults to ACTIVE status when isAuthorized is undefined', async () => {
            const { service, deps } = buildService();
            setupAdminMocks(deps);

            await service.registerAdmin({
                email: 'a@b.com',
                role: 'admin',
                isAuthorized: undefined,
            } as any);

            expect(deps.preUserService.buildUserEntity).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ status: UserStatusEnum.ACTIVE }),
            );
        });

        it('resolves group when groupId is provided', async () => {
            const { service, deps } = buildService();
            const fakeGroup = { id: 'grp-uuid' };
            setupAdminMocks(deps);
            deps.groupService.retrieveGroupByCriteria.mockResolvedValueOnce(fakeGroup);

            await service.registerAdmin({
                email: 'a@b.com',
                role: 'admin',
                isAuthorized: true,
                groupId: 'grp-uuid',
            } as any);

            expect(deps.groupService.retrieveGroupByCriteria).toHaveBeenCalledWith({
                id: 'grp-uuid',
            });
            expect(deps.preUserService.buildUserEntity).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ group: fakeGroup }),
            );
        });

        it('does not call retrieveGroupByCriteria when groupId is absent', async () => {
            const { service, deps } = buildService();
            setupAdminMocks(deps);

            await service.registerAdmin({
                email: 'a@b.com',
                role: 'support',
                isAuthorized: true,
            } as any);

            expect(deps.groupService.retrieveGroupByCriteria).not.toHaveBeenCalled();
        });

        it('propagates errors from validateUniqueFields', async () => {
            const { service, deps } = buildService();
            deps.preUserService.validateUniqueFields.mockRejectedValueOnce(
                new Error('Already used'),
            );

            await expect(
                service.registerAdmin({
                    email: 'x@x.com',
                    role: 'admin',
                } as any),
            ).rejects.toThrow('Already used');
        });
    });

    describe('authenticateWithGoogle', () => {
        const googleUser = { email: 'g@g.com', googleId: 'gid' };
        const fakeSession = { accessToken: 'token' };

        it('syncs existing user when found and generates session', async () => {
            const { service, deps } = buildService();
            const existing = { id: 'existing' };
            const synced = { id: 'existing', googleId: 'gid' };

            deps.preUserService.findUserByEmail.mockResolvedValueOnce(existing);
            deps.preUserService.syncExistingGoogleUser.mockResolvedValueOnce(synced);
            deps.authService.generateUserSession.mockResolvedValueOnce(fakeSession);

            const result = await service.authenticateWithGoogle(googleUser as any, 'ua', '1.1.1.1');

            expect(deps.preUserService.findUserByEmail).toHaveBeenCalledWith(googleUser.email, [
                'role',
            ]);
            expect(deps.preUserService.syncExistingGoogleUser).toHaveBeenCalledWith(
                existing,
                googleUser,
            );
            expect(deps.preUserService.createGoogleUser).not.toHaveBeenCalled();
            expect(deps.authService.generateUserSession).toHaveBeenCalledWith(
                synced,
                false,
                'ua',
                '1.1.1.1',
            );
            expect(result).toEqual(fakeSession);
        });

        it('creates a new google user when not found', async () => {
            const { service, deps } = buildService();
            const newUser = { id: 'new' };

            deps.preUserService.findUserByEmail.mockResolvedValueOnce(null);
            deps.preUserService.createGoogleUser.mockResolvedValueOnce(newUser);
            deps.authService.generateUserSession.mockResolvedValueOnce(fakeSession);

            const result = await service.authenticateWithGoogle(googleUser as any);

            expect(deps.preUserService.createGoogleUser).toHaveBeenCalledWith(googleUser);
            expect(deps.preUserService.syncExistingGoogleUser).not.toHaveBeenCalled();
            expect(result).toEqual(fakeSession);
        });
    });

    describe('generateAndSendLoginOtp', () => {
        it('creates code, sends OTP, and returns message', async () => {
            const { service, deps } = buildService();
            const fakeUser = { id: 'u1', email: 'a@b.com' } as any;
            deps.userCodeService.createUserCode.mockResolvedValueOnce({
                code: '123456',
            });

            const result = await service.generateAndSendLoginOtp(fakeUser, false);

            expect(deps.userCodeService.createUserCode).toHaveBeenCalledWith(fakeUser, false);
            expect(deps.uEmailSendingService.sendUserOTP).toHaveBeenCalledWith(fakeUser, '123456');
            expect(result).toEqual({
                message: 'A one-time password (OTP) has been sent to your email address.',
            });
        });
    });

    describe('loginUser', () => {
        const fakeUser = { id: 'u1', email: 'a@b.com' };

        it('authenticates user and sends OTP', async () => {
            const { service, deps } = buildService();
            deps.preUserService.retrieveUserByCriteria.mockResolvedValueOnce(fakeUser);
            deps.preUserService.ensurePasswordMatch.mockResolvedValueOnce(undefined);
            deps.userCodeService.createUserCode.mockResolvedValueOnce({
                code: '654321',
            });

            const result = await service.loginUser({
                email: 'a@b.com',
                password: 'pass',
                rememberMe: true,
            } as any);

            expect(deps.preUserService.retrieveUserByCriteria).toHaveBeenCalledWith({
                email: 'a@b.com',
            });
            expect(deps.preUserService.checkUserIsActive).toHaveBeenCalledWith(fakeUser);
            expect(deps.preUserService.ensureUserHasPassword).toHaveBeenCalledWith(fakeUser);
            expect(deps.preUserService.ensurePasswordMatch).toHaveBeenCalledWith(fakeUser, 'pass');
            expect(deps.userCodeService.createUserCode).toHaveBeenCalledWith(fakeUser, true);
            expect(result).toEqual({
                message: 'A one-time password (OTP) has been sent to your email address.',
            });
        });

        it('defaults rememberMe to false when not provided', async () => {
            const { service, deps } = buildService();
            deps.preUserService.retrieveUserByCriteria.mockResolvedValueOnce(fakeUser);
            deps.preUserService.ensurePasswordMatch.mockResolvedValueOnce(undefined);
            deps.userCodeService.createUserCode.mockResolvedValueOnce({
                code: '000000',
            });

            await service.loginUser({
                email: 'a@b.com',
                password: 'pass',
            } as any);

            expect(deps.userCodeService.createUserCode).toHaveBeenCalledWith(fakeUser, false);
        });
    });

    describe('verifyUserCode', () => {
        it('verifies code, deletes it, and generates session', async () => {
            const { service, deps } = buildService();
            const fakeUser = { id: 'u1' };
            const fakeCode = { rememberMe: true };
            const fakeSession = { accessToken: 'tok' };

            deps.preUserService.retrieveUserByCriteria.mockResolvedValueOnce(fakeUser);
            deps.userCodeService.verifyUserCode.mockResolvedValueOnce(fakeCode);
            deps.authService.generateUserSession.mockResolvedValueOnce(fakeSession);

            const verifyDto = { email: 'a@b.com', code: '123' } as any;
            const result = await service.verifyUserCode(verifyDto, 'ua', '1.2.3.4');

            expect(deps.preUserService.retrieveUserByCriteria).toHaveBeenCalledWith(
                { email: 'a@b.com' },
                ['role'],
            );
            expect(deps.userCodeService.verifyUserCode).toHaveBeenCalledWith(verifyDto);
            expect(deps.userCodeService.deleteUserCode).toHaveBeenCalledWith('u1');
            expect(deps.authService.generateUserSession).toHaveBeenCalledWith(
                fakeUser,
                true,
                'ua',
                '1.2.3.4',
            );
            expect(result).toEqual(fakeSession);
        });
    });

    describe('resendCode', () => {
        it('asks for a new code and sends OTP email', async () => {
            const { service, deps } = buildService();
            const fakeUser = { id: 'u1', email: 'a@b.com' };
            deps.preUserService.retrieveUserByCriteria.mockResolvedValueOnce(fakeUser);
            deps.userCodeService.askNewCode.mockResolvedValueOnce({
                code: '999888',
            });

            const result = await service.resendCode('a@b.com');

            expect(deps.preUserService.retrieveUserByCriteria).toHaveBeenCalledWith({
                email: 'a@b.com',
            });
            expect(deps.userCodeService.askNewCode).toHaveBeenCalledWith(fakeUser);
            expect(deps.uEmailSendingService.sendUserOTP).toHaveBeenCalledWith(fakeUser, '999888');
            expect(result).toEqual({
                message: 'Confirmation code resent successfully',
            });
        });
    });

    describe('createResetPasswordRequest', () => {
        it('creates reset request and sends email', async () => {
            const { service, deps } = buildService();
            const fakeUser = { id: 'u1', email: 'a@b.com' };
            const fakeRequest = { id: 'req-id' };

            deps.preUserService.retrieveUserByCriteria.mockResolvedValueOnce(fakeUser);
            deps.rPRequestService.handleResetPasswordRequest.mockResolvedValueOnce(fakeRequest);

            const result = await service.createResetPasswordRequest('a@b.com');

            expect(deps.preUserService.retrieveUserByCriteria).toHaveBeenCalledWith(
                { email: 'a@b.com' },
                ['role'],
            );
            expect(deps.rPRequestService.handleResetPasswordRequest).toHaveBeenCalledWith(fakeUser);
            expect(deps.uEmailSendingService.sendResetPasswordMail).toHaveBeenCalledWith(
                fakeUser,
                'req-id',
            );
            expect(result).toEqual({
                message: 'Reset password request sent. Please check your email for instructions.',
            });
        });
    });

    describe('resetPassword', () => {
        it('hashes new password, updates user, and deletes request', async () => {
            const { service, deps } = buildService();
            const fakeRequest = { id: 'req-id', user: { id: 'u1' } };

            deps.rPRequestService.getResetPasswordRequestById.mockResolvedValueOnce(fakeRequest);

            const result = await service.resetPassword('req-id', {
                newPassword: 'NewP@ss123',
            } as any);

            expect(deps.rPRequestService.getResetPasswordRequestById).toHaveBeenCalledWith(
                'req-id',
            );
            expect(deps.hashService.hashPassword).toHaveBeenCalledWith('NewP@ss123');
            expect(deps.preUserService.updateUserDetails).toHaveBeenCalledWith(fakeRequest, {
                password: 'hashed-password',
            });
            expect(deps.rPRequestService.deleteResetPasswordRequest).toHaveBeenCalledWith('req-id');
            expect(result).toEqual({ message: 'Password reset successfully' });
        });
    });

    describe('updatePassword', () => {
        it('verifies old password, hashes and saves new password', async () => {
            const { service, deps } = buildService();
            const fakeUser = { id: 'u1' };
            deps.preUserService.retrieveUserByCriteria.mockResolvedValueOnce(fakeUser);
            deps.preUserService.ensurePasswordMatch.mockResolvedValueOnce(undefined);

            const result = await service.updatePassword('u1', {
                oldPassword: 'OldP@ss1',
                newPassword: 'NewP@ss1',
            } as any);

            expect(deps.preUserService.retrieveUserByCriteria).toHaveBeenCalledWith({ id: 'u1' });
            expect(deps.preUserService.ensureUserHasPassword).toHaveBeenCalledWith(fakeUser);
            expect(deps.preUserService.ensurePasswordMatch).toHaveBeenCalledWith(
                fakeUser,
                'OldP@ss1',
            );
            expect(deps.hashService.hashPassword).toHaveBeenCalledWith('NewP@ss1');
            expect(deps.preUserService.updateUserDetails).toHaveBeenCalledWith(fakeUser, {
                password: 'hashed-password',
            });
            expect(result).toEqual({
                message: 'Password updated successfully',
            });
        });
    });

    describe('userConnectedInfo', () => {
        it('retrieves user with current relations and transforms result', async () => {
            const { service, deps } = buildService();
            const fakeUser = { id: 'u1', role: { label: 'user' } };
            const transformed = { id: 'u1', hasPassword: false };

            deps.preUserService.retrieveUserByCriteria.mockResolvedValueOnce(fakeUser);
            deps.uETransformService.toConnectedUserInfo.mockReturnValueOnce(transformed);

            const result = await service.userConnectedInfo({
                id: 'u1',
                role: 'user',
            } as any);

            expect(deps.uRelationService.getCurrentUserRelations).toHaveBeenCalled();
            expect(deps.preUserService.retrieveUserByCriteria).toHaveBeenCalledWith({ id: 'u1' }, [
                'role',
                'avatar',
            ]);
            expect(deps.uETransformService.toConnectedUserInfo).toHaveBeenCalledWith(fakeUser);
            expect(result).toEqual(transformed);
        });
    });

    describe('updateUserInfo', () => {
        const updateDto = { fullname: 'New Name' };

        it('prepares and applies updates, returns success message', async () => {
            const { service, deps } = buildService();
            const fakeUser = { id: 'u1' };
            deps.preUserService.retrieveUserByCriteria.mockResolvedValueOnce(fakeUser);
            deps.preUserService.prepareUserUpdates.mockResolvedValueOnce({
                fullname: 'New Name',
            });

            const result = await service.updateUserInfo(
                { id: 'u1', role: 'user' } as any,
                updateDto as any,
            );

            expect(deps.preUserService.retrieveUserByCriteria).toHaveBeenCalledWith({ id: 'u1' }, [
                'avatar',
                'avatar.file',
            ]);
            expect(deps.preUserService.prepareUserUpdates).toHaveBeenCalledWith(updateDto);
            expect(deps.preUserService.updateUserDetails).toHaveBeenCalledWith(fakeUser, {
                fullname: 'New Name',
            });
            expect(result).toEqual({ message: 'Updated user information' });
        });

        it('invalidates admin cache when user is not a regular user', async () => {
            const { service, deps } = buildService();
            deps.preUserService.retrieveUserByCriteria.mockResolvedValueOnce({
                id: 'a1',
            });
            deps.preUserService.prepareUserUpdates.mockResolvedValueOnce({});

            await service.updateUserInfo({ id: 'a1', role: 'admin' } as any, updateDto as any);
            await new Promise((r) => setImmediate(r));

            expect(deps.cacheService.deleteKeysByBase).toHaveBeenCalledWith('user-admins');
        });

        it('does NOT invalidate cache when user has the regular user role', async () => {
            const { service, deps } = buildService();
            deps.preUserService.retrieveUserByCriteria.mockResolvedValueOnce({
                id: 'u1',
            });
            deps.preUserService.prepareUserUpdates.mockResolvedValueOnce({});

            await service.updateUserInfo({ id: 'u1', role: 'user' } as any, updateDto as any);
            await new Promise((r) => setImmediate(r));

            expect(deps.cacheService.deleteKeysByBase).not.toHaveBeenCalled();
        });
    });

    describe('updateAdminUser', () => {
        const adminId = 'admin-uuid';
        const updateDto = { status: UserStatusEnum.SUSPENDED };
        const fakeAdmin = {
            id: adminId,
            role: { label: 'admin' },
            group: null,
        };
        const updatedAdmin = {
            id: adminId,
            role: { label: 'admin' },
            group: null,
            status: UserStatusEnum.SUSPENDED,
        };

        it('validates sys role, updates, broadcasts WS event, and schedules cache invalidation', async () => {
            const { service, deps } = buildService();
            deps.preUserService.retrieveUserByCriteria
                .mockResolvedValueOnce(fakeAdmin)
                .mockResolvedValueOnce(updatedAdmin);
            deps.preUserService.prepareAdminUpdates.mockResolvedValueOnce({
                status: UserStatusEnum.SUSPENDED,
            });

            const result = await service.updateAdminUser(adminId, updateDto as any);

            expect(deps.preUserService.retrieveUserByCriteria).toHaveBeenNthCalledWith(
                1,
                { id: adminId },
                ['role', 'group'],
            );
            expect(deps.preUserService.ensureSysRoles).toHaveBeenCalledWith('admin');
            expect(deps.preUserService.prepareAdminUpdates).toHaveBeenCalledWith(updateDto);
            expect(deps.preUserService.updateUserDetails).toHaveBeenCalledWith(fakeAdmin, {
                status: UserStatusEnum.SUSPENDED,
            });
            expect(deps.preUserService.retrieveUserByCriteria).toHaveBeenNthCalledWith(
                2,
                { id: adminId },
                ['role', 'group'],
            );
            expect(deps.preUserService.wsAdminUser).toHaveBeenCalledWith(
                updatedAdmin,
                SocketEventEnum.ADMIN_USER_UPDATED,
            );
            expect(result).toEqual({
                message: 'Updated admin user information',
            });

            await new Promise((r) => setImmediate(r));
            expect(deps.preUserService.scheduleUsersInvalidateCache).toHaveBeenCalled();
        });
    });
});
