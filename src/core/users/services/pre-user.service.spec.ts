import { Test, TestingModule } from '@nestjs/testing';
import { PreUserService } from './pre-user.service';
import { UsersService } from './users.service';
import { UserEntity } from '../entities/user.entity';
import { RoleEntity } from '../../roles/entities/role.entity';
import { GroupEntity } from '../../groups/entities/group.entity';
import { FileLinksEntity } from '../../files/entities/file-links.entity';
import { FileUsageEnum, SocketEventEnum, UserStatusEnum } from '../../../common/enum';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('PreUserService', () => {
    let service: PreUserService;
    let usersService: any;
    let mockUserRepo: any;

    const mockUser: UserEntity = {
        id: 'user-1',
        email: 'test@test.com',
        fullname: 'Test User',
        password: 'hashed',
        status: UserStatusEnum.ACTIVE,
        googleId: null,
        googleAvatar: null,
        deleted: false,
    } as any;

    const mockRole: RoleEntity = {
        id: 'role-1',
        label: 'ADMIN',
    } as RoleEntity;

    const mockGroup: GroupEntity = {
        id: 'group-1',
        label: 'Group',
    } as GroupEntity;

    const mockFile: FileLinksEntity = {
        id: 'file-1',
        file: { id: 'file-entities' } as any,
    } as FileLinksEntity;

    beforeEach(async () => {
        mockUserRepo = {
            findActiveOne: jest.fn(),
            findOne: jest.fn(),
            getRepository: jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
            }),
            update: jest.fn().mockResolvedValue({ affected: 1 }),
            create: jest.fn(),
            assertUniqueActive: jest.fn(),
        };

        const mockUsersService = {
            userRepo: mockUserRepo,
            logger: {
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
            },
            envConfigService: {
                supportRole: 'SUPPORT',
                adminRole: 'ADMIN',
                userRole: 'USER',
                userResetPasswordLink: 'http://reset/',
            },
            errorHandlerService: {
                forbidden: jest.fn().mockImplementation((msg, userMsg) => {
                    throw new Error(userMsg || msg);
                }),
                notFound: jest.fn().mockImplementation((msg, userMsg) => {
                    throw new Error(userMsg || msg);
                }),
                validation: jest.fn().mockImplementation((errors) => {
                    throw new Error(JSON.stringify(errors));
                }),
            },
            otherUtils: {
                formatCriteria: jest.fn((c) => JSON.stringify(c)),
            },
            mailerService: {
                emailSend: jest.fn(),
            },
            uEmailSendingService: {
                sendWelcomeEmail: jest.fn(),
            },
            roleService: {
                retrieveRoleByCriteria: jest.fn(),
            },
            groupService: {
                retrieveGroupByCriteria: jest.fn(),
            },
            fileLinksService: {
                linkFileToEntity: jest.fn(),
            },
            hashService: {
                hashPassword: jest.fn(),
                comparePassword: jest.fn(),
            },
            cacheService: {
                deleteKeysByBase: jest.fn(),
            },
            sockerService: {
                sendDataToRoute: jest.fn(),
            },
            uETransformService: {
                transformAdmin: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [PreUserService, { provide: UsersService, useValue: mockUsersService }],
        }).compile();

        service = module.get(PreUserService);
        usersService = module.get(UsersService);
    });

    afterEach(() => jest.clearAllMocks());

    describe('Controller definition', () => {
        it('should be defined', () => {
            expect(service).toBeDefined();
        });
    });

    describe('checkUserIsActive', () => {
        it('should pass if user is ACTIVE', () => {
            expect(() => service.checkUserIsActive(mockUser)).not.toThrow();
        });

        it('should throw forbidden error if user is SUSPENDED', () => {
            const suspendedUser = {
                ...mockUser,
                status: UserStatusEnum.SUSPENDED,
            } as UserEntity;

            expect(() => service.checkUserIsActive(suspendedUser)).toThrow(
                'Forbidden, account unactive',
            );
            expect(usersService.errorHandlerService.forbidden).toHaveBeenCalledWith(
                `User with id: ${suspendedUser.id} is not active`,
                `Forbidden, account unactive`,
            );
        });
    });

    describe('ensureGoogleAuthAllowed', () => {
        it('should pass when user has googleId', () => {
            const googleUser = {
                ...mockUser,
                googleId: 'google-123',
            } as UserEntity;

            expect(() =>
                service.ensureGoogleAuthAllowed(googleUser, 'test@test.com'),
            ).not.toThrow();
        });

        it('should pass when user has no password', () => {
            const noPasswordUser = {
                ...mockUser,
                password: null,
                googleId: null,
            } as any;

            expect(() =>
                service.ensureGoogleAuthAllowed(noPasswordUser, 'test@test.com'),
            ).not.toThrow();
        });

        it('should throw forbidden error when user has password but no googleId', () => {
            expect(() => service.ensureGoogleAuthAllowed(mockUser, 'test@test.com')).toThrow(
                'Please login with your password instead of Google.',
            );
            expect(usersService.errorHandlerService.forbidden).toHaveBeenCalledWith(
                `User with email test@test.com already registered with password`,
                `Please login with your password instead of Google.`,
            );
        });
    });

    describe('ensureUserHasPassword', () => {
        it('should pass when user has password', () => {
            expect(() => service.ensureUserHasPassword(mockUser)).not.toThrow();
        });

        it('should throw forbidden error when user has no password', () => {
            const noPasswordUser = { ...mockUser, password: null } as any;

            expect(() => service.ensureUserHasPassword(noPasswordUser)).toThrow(
                'Forbidden, either reset or login with google',
            );
            expect(usersService.errorHandlerService.forbidden).toHaveBeenCalledWith(
                `User with email ${noPasswordUser.email} has no password, can't update password`,
                `Forbidden, either reset or login with google`,
            );
        });

        it('should throw forbidden error when user has empty password string', () => {
            const emptyPasswordUser = { ...mockUser, password: '' } as any;

            expect(() => service.ensureUserHasPassword(emptyPasswordUser)).toThrow();
        });
    });

    describe('ensureSysRoles', () => {
        it('should allow ADMIN role', () => {
            expect(() => service.ensureSysRoles('ADMIN')).not.toThrow();
        });

        it('should allow SUPPORT role', () => {
            expect(() => service.ensureSysRoles('SUPPORT')).not.toThrow();
        });

        it('should throw forbidden error for USER role', () => {
            expect(() => service.ensureSysRoles('USER')).toThrow('Forbidden, unknow attribution');
            expect(usersService.errorHandlerService.forbidden).toHaveBeenCalledWith(
                `Created user has to be either admin or support`,
                `Forbidden, unknow attribution`,
            );
        });

        it('should throw forbidden error for unknown role', () => {
            expect(() => service.ensureSysRoles('MODERATOR')).toThrow();
        });

        it('should throw forbidden error for empty role', () => {
            expect(() => service.ensureSysRoles('')).toThrow();
        });
    });

    describe('buildUserBaseQuery', () => {
        let mockQueryBuilder: any;

        beforeEach(() => {
            mockQueryBuilder = {
                andWhere: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
            };
            mockUserRepo.getRepository.mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
            });
        });

        it('should build base query without any filters', () => {
            service.buildUserBaseQuery({});

            expect(mockUserRepo.getRepository).toHaveBeenCalled();
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('user.deleted = false');
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledTimes(4);
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenNthCalledWith(
                1,
                'user.group',
                'group',
            );
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenNthCalledWith(
                2,
                'user.role',
                'role',
            );
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenNthCalledWith(
                3,
                'user.avatar',
                'fileLinks',
            );
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenNthCalledWith(
                4,
                'fileLinks.file',
                'file',
            );
        });

        it('should add labels filter when labels array is provided', () => {
            const labels = ['ADMIN', 'SUPPORT'];

            service.buildUserBaseQuery({ labels });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('role.label IN (:...labels)', {
                labels,
            });
        });

        it('should not add labels filter when labels array is empty', () => {
            service.buildUserBaseQuery({ labels: [] });

            expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
                'role.label IN (:...labels)',
                expect.anything(),
            );
        });

        it('should add status filter when status is provided', () => {
            service.buildUserBaseQuery({ status: UserStatusEnum.ACTIVE });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('user.status = :status', {
                status: UserStatusEnum.ACTIVE,
            });
        });

        it('should add search term filter with fuzzy matching', () => {
            const searchTerm = 'john doe';

            service.buildUserBaseQuery({ searchTerm });

            const expectedPattern = '%j%o%h%n% %d%o%e%';
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                `(user.fullname ILIKE :searchTerm\n              OR role.label ILIKE :searchTerm\n              OR group.label ILIKE :searchTerm)`,
                { searchTerm: expectedPattern },
            );
        });

        it('should handle search term with special characters', () => {
            service.buildUserBaseQuery({ searchTerm: 'test@email.com' });

            const expectedPattern = '%t%e%s%t%@%e%m%a%i%l%.%c%o%m%';
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(expect.any(String), {
                searchTerm: expectedPattern,
            });
        });

        it('should combine all filters when all are provided', () => {
            const filters = {
                labels: ['USER'],
                status: UserStatusEnum.SUSPENDED,
                searchTerm: 'test user',
            };

            service.buildUserBaseQuery(filters);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('role.label IN (:...labels)', {
                labels: ['USER'],
            });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('user.status = :status', {
                status: UserStatusEnum.SUSPENDED,
            });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                expect.stringContaining('ILIKE'),
                {
                    searchTerm: '%t%e%s%t% %u%s%e%r%',
                },
            );
        });

        it('should build query with only search term', () => {
            service.buildUserBaseQuery({ searchTerm: 'single' });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2); // deleted = false + search term
        });

        it('should build query with only labels', () => {
            service.buildUserBaseQuery({ labels: ['ADMIN'] });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('role.label IN (:...labels)', {
                labels: ['ADMIN'],
            });
        });

        it('should build query with only status', () => {
            service.buildUserBaseQuery({ status: UserStatusEnum.ACTIVE });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('user.status = :status', {
                status: UserStatusEnum.ACTIVE,
            });
        });
    });

    describe('retrieveUsersQuery', () => {
        let mockQueryBuilder: any;

        beforeEach(() => {
            mockQueryBuilder = {
                andWhere: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
            };
            mockUserRepo.getRepository.mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
            });
        });

        it('should build query with pagination and no filters', () => {
            service.retrieveUsersQuery(0, 10, {});

            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('user.updatedAt', 'DESC');
            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
        });

        it('should handle different offset and limit values', () => {
            service.retrieveUsersQuery(20, 50, {});

            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(50);
        });

        it('should apply all filters to query', () => {
            const filters = {
                labels: ['USER', 'ADMIN'],
                status: UserStatusEnum.ACTIVE,
                searchTerm: 'test',
            };

            service.retrieveUsersQuery(0, 10, filters);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('role.label IN (:...labels)', {
                labels: ['USER', 'ADMIN'],
            });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('user.status = :status', {
                status: UserStatusEnum.ACTIVE,
            });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                expect.stringContaining('ILIKE'),
                {
                    searchTerm: '%t%e%s%t%',
                },
            );
        });

        it('should handle large offset values', () => {
            service.retrieveUsersQuery(1000, 25, {});

            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(1000);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(25);
        });

        it('should handle limit of 0', () => {
            service.retrieveUsersQuery(0, 0, {});

            expect(mockQueryBuilder.take).toHaveBeenCalledWith(0);
        });
    });

    describe('buildUserEntity', () => {
        it('should build entities with required fields only', () => {
            const required = { email: 'test@test.com', role: mockRole };
            const user = service.buildUserEntity(required, {});

            expect(user).toBeInstanceOf(UserEntity);
            expect(user.email).toBe('test@test.com');
            expect(user.role).toBe(mockRole);
            expect(user.fullname).toBeUndefined();
            expect(user.password).toBeUndefined();
        });

        it('should build entities with all optional fields', () => {
            const required = { email: 'test@test.com', role: mockRole };
            const optional = {
                password: 'hashed-pass',
                fullname: 'John Doe',
                googleId: 'google-123',
                googleAvatar: 'avatar.jpg',
                group: mockGroup,
                status: UserStatusEnum.ACTIVE,
            };

            const user = service.buildUserEntity(required, optional);

            expect(user.email).toBe('test@test.com');
            expect(user.role).toBe(mockRole);
            expect(user.password).toBe('hashed-pass');
            expect(user.fullname).toBe('John Doe');
            expect(user.googleId).toBe('google-123');
            expect(user.googleAvatar).toBe('avatar.jpg');
            expect(user.group).toBe(mockGroup);
            expect(user.status).toBe(UserStatusEnum.ACTIVE);
        });

        it('should handle partial optional fields', () => {
            const required = { email: 'test@test.com', role: mockRole };
            const optional = { fullname: 'Partial User' };

            const user = service.buildUserEntity(required, optional);

            expect(user.email).toBe('test@test.com');
            expect(user.role).toBe(mockRole);
            expect(user.fullname).toBe('Partial User');
            expect(user.password).toBeUndefined();
            expect(user.googleId).toBeUndefined();
        });

        it('should handle empty string optional fields', () => {
            const required = { email: 'test@test.com', role: mockRole };
            const optional = { fullname: '', password: '', googleId: '' };

            const user = service.buildUserEntity(required, optional);

            expect(user.fullname).toBe('');
            expect(user.password).toBe('');
            expect(user.googleId).toBe('');
        });

        it('should handle null optional fields', () => {
            const required = { email: 'test@test.com', role: mockRole };
            const optional = {
                fullname: null,
                password: null,
                googleId: null,
            } as any;

            const user = service.buildUserEntity(required, optional);

            expect(user.fullname).toBeNull();
            expect(user.password).toBeNull();
            expect(user.googleId).toBeNull();
        });
    });

    describe('retrieveUserByCriteria', () => {
        it('should return user when found', async () => {
            mockUserRepo.findActiveOne.mockResolvedValue(mockUser);
            usersService.otherUtils.formatCriteria.mockReturnValue('{"id":"user-1"}');

            const result = await service.retrieveUserByCriteria({
                id: 'user-1',
            });

            expect(result).toEqual(mockUser);
            expect(usersService.logger.info).toHaveBeenCalledWith('Find a user by {"id":"user-1"}');
            expect(mockUserRepo.findActiveOne).toHaveBeenCalledWith(
                usersService.userRepo,
                { id: 'user-1' },
                undefined,
            );
        });

        it('should return user with relations when specified', async () => {
            mockUserRepo.findActiveOne.mockResolvedValue(mockUser);

            const result = await service.retrieveUserByCriteria({ email: 'test@test.com' }, [
                'role',
                'group',
            ]);

            expect(result).toEqual(mockUser);
            expect(mockUserRepo.findActiveOne).toHaveBeenCalledWith(
                usersService.userRepo,
                { email: 'test@test.com' },
                ['role', 'group'],
            );
        });

        it('should throw not found error when user does not exist', async () => {
            mockUserRepo.findActiveOne.mockResolvedValue(null);
            usersService.otherUtils.formatCriteria.mockReturnValue('{"id":"nonexistent"}');

            await expect(service.retrieveUserByCriteria({ id: 'nonexistent' })).rejects.toThrow(
                'Data not found',
            );

            expect(usersService.errorHandlerService.notFound).toHaveBeenCalledWith(
                'Data not found with {"id":"nonexistent"}',
                'Data not found',
            );
        });

        it('should handle complex criteria', async () => {
            const complexCriteria = {
                email: 'test@test.com',
                status: UserStatusEnum.ACTIVE,
                deleted: false,
            };

            mockUserRepo.findActiveOne.mockResolvedValue(mockUser);
            usersService.otherUtils.formatCriteria.mockReturnValue(JSON.stringify(complexCriteria));

            const result = await service.retrieveUserByCriteria(complexCriteria);

            expect(result).toEqual(mockUser);
            expect(usersService.otherUtils.formatCriteria).toHaveBeenCalledWith(complexCriteria);
        });

        it('should log the search criteria', async () => {
            mockUserRepo.findActiveOne.mockResolvedValue(mockUser);
            usersService.otherUtils.formatCriteria.mockReturnValue('criteria-string');

            await service.retrieveUserByCriteria({ id: '1' });

            expect(usersService.logger.info).toHaveBeenCalledWith('Find a user by criteria-string');
        });
    });

    describe('findUserByEmail', () => {
        it('should find user by email without relations', async () => {
            mockUserRepo.findOne.mockResolvedValue(mockUser);

            const result = await service.findUserByEmail('test@test.com');

            expect(result).toEqual(mockUser);
            expect(mockUserRepo.findOne).toHaveBeenCalledWith({
                where: { email: 'test@test.com' },
                relations: undefined,
            });
        });

        it('should find user by email with relations', async () => {
            mockUserRepo.findOne.mockResolvedValue(mockUser);

            const result = await service.findUserByEmail('test@test.com', [
                'role',
                'group',
                'avatar',
            ]);

            expect(result).toEqual(mockUser);
            expect(mockUserRepo.findOne).toHaveBeenCalledWith({
                where: { email: 'test@test.com' },
                relations: ['role', 'group', 'avatar'],
            });
        });

        it('should return null when user not found', async () => {
            mockUserRepo.findOne.mockResolvedValue(null);

            const result = await service.findUserByEmail('notfound@test.com');

            expect(result).toBeNull();
        });

        it('should handle email with spaces (trim is not done by service)', async () => {
            mockUserRepo.findOne.mockResolvedValue(mockUser);

            const result = await service.findUserByEmail('  test@test.com  ');

            expect(result).toEqual(mockUser);
            expect(mockUserRepo.findOne).toHaveBeenCalledWith({
                where: { email: '  test@test.com  ' },
                relations: undefined,
            });
        });
    });

    describe('assertEmailIsUnique', () => {
        it('should not add error when email is unique', async () => {
            const errors = {};

            await service.assertEmailIsUnique('unique@test.com', errors);

            expect(errors).toEqual({});
            expect(mockUserRepo.assertUniqueActive).toHaveBeenCalledWith(
                usersService.userRepo,
                errors,
                { email: 'unique@test.com' },
                'User',
            );
        });

        it('should add error when email already exists', async () => {
            const errors = {};
            mockUserRepo.assertUniqueActive.mockImplementation(
                (_repo: any, errorObj: { email: string }) => {
                    errorObj.email = 'Email already exists';
                },
            );

            await service.assertEmailIsUnique('exists@test.com', errors);

            expect(errors).toEqual({ email: 'Email already exists' });
        });

        it('should work with pre-existing errors object', async () => {
            const errors = { other: 'Some error' };

            await service.assertEmailIsUnique('test@test.com', errors);

            expect(errors).toHaveProperty('other');
            expect(errors.other).toBe('Some error');
        });

        it('should handle multiple errors', async () => {
            const errors = { field1: 'Error 1' };
            mockUserRepo.assertUniqueActive.mockImplementation(
                (_repo: any, errorObj: { email: string }) => {
                    errorObj.email = 'Email taken';
                },
            );

            await service.assertEmailIsUnique('test@test.com', errors);

            expect(errors).toEqual({
                field1: 'Error 1',
                email: 'Email taken',
            });
        });
    });

    describe('validateUniqueFields', () => {
        it('should pass when email is unique', async () => {
            await expect(service.validateUniqueFields('unique@test.com')).resolves.not.toThrow();
        });

        it('should throw validation error when email is not unique', async () => {
            mockUserRepo.assertUniqueActive.mockImplementation(
                (_repo: any, errorObj: { email: string }) => {
                    errorObj.email = 'Email already exists';
                },
            );

            await expect(service.validateUniqueFields('exists@test.com')).rejects.toThrow();

            expect(usersService.errorHandlerService.validation).toHaveBeenCalledWith({
                email: 'Email already exists',
            });
        });

        it('should handle multiple validation errors', async () => {
            mockUserRepo.assertUniqueActive.mockImplementation(
                (_repo: any, errorObj: { email: string; other: string }) => {
                    errorObj.email = 'Email exists';
                    errorObj.other = 'Other error';
                },
            );

            await expect(service.validateUniqueFields('test@test.com')).rejects.toThrow();

            const expectedErrors = {
                email: 'Email exists',
                other: 'Other error',
            };
            expect(usersService.errorHandlerService.validation).toHaveBeenCalledWith(
                expectedErrors,
            );
        });
    });

    describe('updateUserDetails', () => {
        it('should return message when no updates provided', async () => {
            const result = await service.updateUserDetails(mockUser, {});

            expect(result).toEqual({ message: 'No updates provided' });
            expect(mockUserRepo.update).not.toHaveBeenCalled();
        });

        it('should return message when updates object is undefined', async () => {
            const result = await service.updateUserDetails(mockUser, undefined);

            expect(result).toEqual({ message: 'No updates provided' });
        });

        it('should update string fields with trimming', async () => {
            const updates = {
                fullname: '  New Name  ',
                email: '  new@test.com  ',
                password: '  newpass  ',
                googleAvatar: '  avatar.jpg  ',
                googleId: '  gid123  ',
            };

            await service.updateUserDetails(mockUser, updates);

            expect(mockUserRepo.update).toHaveBeenCalledWith(
                { id: mockUser.id },
                {
                    fullname: 'New Name',
                    email: 'new@test.com',
                    password: 'newpass',
                    googleAvatar: 'avatar.jpg',
                    googleId: 'gid123',
                },
            );
        });

        it('should not update string fields with empty strings after trim', async () => {
            const updates = { fullname: '   ', email: ' ' };

            await service.updateUserDetails(mockUser, updates);

            expect(mockUserRepo.update).toHaveBeenCalledWith({ id: mockUser.id }, {});
        });

        it('should update status field', async () => {
            const updates = { status: UserStatusEnum.SUSPENDED };

            await service.updateUserDetails(mockUser, updates);

            expect(mockUserRepo.update).toHaveBeenCalledWith(
                { id: mockUser.id },
                { status: UserStatusEnum.SUSPENDED },
            );
        });

        it('should update entities fields (avatar, role, group)', async () => {
            const updates = {
                avatar: mockFile,
                role: mockRole,
                group: mockGroup,
            };

            await service.updateUserDetails(mockUser, updates);

            expect(mockUserRepo.update).toHaveBeenCalledWith(
                { id: mockUser.id },
                {
                    avatar: mockFile,
                    role: mockRole,
                    group: mockGroup,
                },
            );
        });

        it('should combine all field types in update', async () => {
            const updates = {
                fullname: 'Updated Name',
                status: UserStatusEnum.ACTIVE,
                avatar: mockFile,
                role: mockRole,
                group: mockGroup,
            };

            await service.updateUserDetails(mockUser, updates);

            expect(mockUserRepo.update).toHaveBeenCalledWith(
                { id: mockUser.id },
                {
                    fullname: 'Updated Name',
                    status: UserStatusEnum.ACTIVE,
                    avatar: mockFile,
                    role: mockRole,
                    group: mockGroup,
                },
            );
        });

        it('should handle partial updates with only some fields', async () => {
            const updates = { fullname: 'Partial Update' };

            await service.updateUserDetails(mockUser, updates);

            expect(mockUserRepo.update).toHaveBeenCalledWith(
                { id: mockUser.id },
                { fullname: 'Partial Update' },
            );
        });
    });

    describe('registerUserCore', () => {
        const registerDto = {
            email: 'new@test.com',
            password: 'plainPassword',
            confirmPassword: 'plainPassword',
            fullname: 'New User',
        };

        beforeEach(() => {
            usersService.hashService.hashPassword.mockResolvedValue('hashedPassword');
            usersService.roleService.retrieveRoleByCriteria.mockResolvedValue(mockRole);
            mockUserRepo.create.mockResolvedValue(mockUser);
        });

        it('should register user successfully', async () => {
            const result = await service.registerUserCore(registerDto, 'USER');

            expect(result).toEqual(mockUser);
            expect(usersService.hashService.hashPassword).toHaveBeenCalledWith('plainPassword');
            expect(usersService.roleService.retrieveRoleByCriteria).toHaveBeenCalledWith({
                label: 'USER',
            });
            expect(mockUserRepo.create).toHaveBeenCalledWith(expect.any(UserEntity));
            expect(usersService.uEmailSendingService.sendWelcomeEmail).toHaveBeenCalledWith(
                mockUser,
            );
        });

        it('should register user with ADMIN role', async () => {
            const adminRole = { ...mockRole, label: 'ADMIN' };
            usersService.roleService.retrieveRoleByCriteria.mockResolvedValue(adminRole);

            await service.registerUserCore(registerDto, 'ADMIN');

            expect(usersService.roleService.retrieveRoleByCriteria).toHaveBeenCalledWith({
                label: 'ADMIN',
            });
        });

        it('should handle email uniqueness validation', async () => {
            mockUserRepo.assertUniqueActive.mockImplementation(
                (_repo: any, errorObj: { email: string }) => {
                    errorObj.email = 'Email exists';
                },
            );
            usersService.errorHandlerService.validation.mockImplementation(() => {
                throw new Error('Validation failed');
            });

            await expect(service.registerUserCore(registerDto, 'USER')).rejects.toThrow(
                'Validation failed',
            );
        });

        it('should use the created user entities for welcome email', async () => {
            const newUser = {
                id: 'new-user',
                email: 'new@test.com',
            } as UserEntity;
            mockUserRepo.create.mockResolvedValue(newUser);

            await service.registerUserCore(registerDto, 'USER');

            expect(usersService.uEmailSendingService.sendWelcomeEmail).toHaveBeenCalledWith(
                newUser,
            );
        });

        it('should handle password hashing error', async () => {
            usersService.hashService.hashPassword.mockRejectedValue(new Error('Hashing failed'));

            await expect(service.registerUserCore(registerDto, 'USER')).rejects.toThrow(
                'Hashing failed',
            );
        });
    });

    describe('syncExistingGoogleUser', () => {
        const googleUser = {
            email: 'google@test.com',
            firstName: 'Google',
            lastName: 'User',
            googleId: 'gid-123',
            picture: 'new-avatar.jpg',
        };

        it('should sync existing google user successfully', async () => {
            const existingUser = {
                ...mockUser,
                googleId: 'gid-123',
                googleAvatar: 'old-avatar.jpg',
            } as UserEntity;

            const result = await service.syncExistingGoogleUser(existingUser, googleUser);

            expect(result).toEqual(existingUser);
            expect(mockUserRepo.update).toHaveBeenCalledWith(
                { id: existingUser.id },
                { googleAvatar: 'new-avatar.jpg' },
            );
        });

        it('should throw error if user is not active', async () => {
            const inactiveUser = {
                ...mockUser,
                status: UserStatusEnum.SUSPENDED,
                googleId: 'gid-123',
            } as UserEntity;

            await expect(
                service.syncExistingGoogleUser(inactiveUser, googleUser),
            ).rejects.toThrow();

            expect(usersService.errorHandlerService.forbidden).toHaveBeenCalled();
        });

        it('should throw error if google auth is not allowed', async () => {
            const nonGoogleUser = {
                ...mockUser,
                googleId: null,
                password: 'hashed',
            } as any;

            await expect(
                service.syncExistingGoogleUser(nonGoogleUser, googleUser),
            ).rejects.toThrow();
        });

        it('should not update avatar if picture is same', async () => {
            const sameAvatarUser = {
                ...mockUser,
                googleId: 'gid-123',
                googleAvatar: 'new-avatar.jpg',
            } as UserEntity;

            await service.syncExistingGoogleUser(sameAvatarUser, googleUser);

            expect(mockUserRepo.update).not.toHaveBeenCalled();
        });

        it('should not update avatar if no picture provided', async () => {
            const userWithGoogleId = {
                ...mockUser,
                googleId: 'gid-123',
            } as UserEntity;
            const googleUserNoPic = { ...googleUser, picture: undefined };

            await service.syncExistingGoogleUser(userWithGoogleId, googleUserNoPic);

            expect(mockUserRepo.update).not.toHaveBeenCalled();
        });
    });

    describe('syncGoogleAvatar', () => {
        it('should update google avatar when all conditions are met', async () => {
            const user = {
                ...mockUser,
                googleId: 'gid-123',
                googleAvatar: 'old.jpg',
            } as UserEntity;

            await service.syncGoogleAvatar(user, 'new.jpg');

            expect(mockUserRepo.update).toHaveBeenCalledWith(
                { id: user.id },
                { googleAvatar: 'new.jpg' },
            );
        });

        it('should not update if user has no googleId', async () => {
            const user = { ...mockUser, googleId: null } as any;

            await service.syncGoogleAvatar(user, 'new.jpg');

            expect(mockUserRepo.update).not.toHaveBeenCalled();
        });

        it('should not update if no picture provided', async () => {
            const user = { ...mockUser, googleId: 'gid-123' } as UserEntity;

            await service.syncGoogleAvatar(user, undefined);

            expect(mockUserRepo.update).not.toHaveBeenCalled();
        });

        it('should not update if picture is same as current', async () => {
            const user = {
                ...mockUser,
                googleId: 'gid-123',
                googleAvatar: 'same.jpg',
            } as UserEntity;

            await service.syncGoogleAvatar(user, 'same.jpg');

            expect(mockUserRepo.update).not.toHaveBeenCalled();
        });

        it('should update when current avatar is null', async () => {
            const user = {
                ...mockUser,
                googleId: 'gid-123',
                googleAvatar: null,
            } as any;

            await service.syncGoogleAvatar(user, 'new.jpg');

            expect(mockUserRepo.update).toHaveBeenCalled();
        });
    });

    describe('createGoogleUser', () => {
        const googleUser = {
            email: 'google@test.com',
            firstName: 'John',
            lastName: 'Doe',
            googleId: 'google-123',
            picture: 'avatar.jpg',
        };

        beforeEach(() => {
            usersService.roleService.retrieveRoleByCriteria.mockResolvedValue(mockRole);
            mockUserRepo.create.mockResolvedValue(mockUser);
        });

        it('should create new google user successfully', async () => {
            const result = await service.createGoogleUser(googleUser);

            expect(result).toEqual(mockUser);
            expect(usersService.logger.info).toHaveBeenCalledWith(
                `Creating a new user from google with information ${JSON.stringify(googleUser)}`,
            );
            expect(usersService.roleService.retrieveRoleByCriteria).toHaveBeenCalledWith({
                label: 'USER',
            });
            expect(mockUserRepo.create).toHaveBeenCalledWith(expect.any(UserEntity));
            expect(usersService.logger.info).toHaveBeenCalledWith(
                `New user created via Google: ${mockUser.id}`,
            );
        });

        it('should handle empty first and last name', async () => {
            const emptyNameUser = {
                ...googleUser,
                firstName: '',
                lastName: '',
            };

            await service.createGoogleUser(emptyNameUser);

            const createdUser = mockUserRepo.create.mock.calls[0][0];
            expect(createdUser.fullname).toBe('');
        });

        it('should handle only first name', async () => {
            const onlyFirstNameUser = {
                ...googleUser,
                firstName: 'John',
                lastName: '',
            };

            await service.createGoogleUser(onlyFirstNameUser);

            const createdUser = mockUserRepo.create.mock.calls[0][0];
            expect(createdUser.fullname).toBe('John');
        });

        it('should handle only last name', async () => {
            const onlyLastNameUser = {
                ...googleUser,
                firstName: '',
                lastName: 'Doe',
            };

            await service.createGoogleUser(onlyLastNameUser);

            const createdUser = mockUserRepo.create.mock.calls[0][0];
            expect(createdUser.fullname).toBe('Doe');
        });

        it('should handle user with no picture', async () => {
            const noPictureUser = {
                ...googleUser,
                picture: undefined,
            };

            await service.createGoogleUser(noPictureUser);

            const createdUser = mockUserRepo.create.mock.calls[0][0];
            expect(createdUser.googleAvatar).toBeUndefined();
        });
    });

    describe('scheduleUsersInvalidateCache', () => {
        it('should delete cache keys with base prefix', async () => {
            await service.scheduleUsersInvalidateCache();

            expect(usersService.cacheService.deleteKeysByBase).toHaveBeenCalledWith('user-admins');
        });

        it('should handle cache service error', async () => {
            usersService.cacheService.deleteKeysByBase.mockRejectedValue(new Error('Cache error'));

            await expect(service.scheduleUsersInvalidateCache()).rejects.toThrow('Cache error');
        });
    });

    describe('ensurePasswordMatch', () => {
        beforeEach(() => {
            usersService.hashService.comparePassword.mockResolvedValue(true);
        });

        it('should pass when passwords match', async () => {
            await expect(
                service.ensurePasswordMatch(mockUser, 'correct-password'),
            ).resolves.not.toThrow();

            expect(usersService.hashService.comparePassword).toHaveBeenCalledWith(
                'correct-password',
                'hashed',
            );
        });

        it('should throw when passwords do not match', async () => {
            usersService.hashService.comparePassword.mockResolvedValue(false);

            await expect(service.ensurePasswordMatch(mockUser, 'wrong-password')).rejects.toThrow(
                "Password doesn't match",
            );

            expect(usersService.errorHandlerService.forbidden).toHaveBeenCalledWith(
                `Provided password doesn't match the existing one`,
                `Password doesn't match`,
            );
        });
    });

    describe('prepareUserUpdates', () => {
        it('should return empty object when no updates provided', async () => {
            const result = await service.prepareUserUpdates({});

            expect(result).toEqual({});
        });

        it('should prepare updates with fullname only', async () => {
            const result = await service.prepareUserUpdates({
                fullname: 'New Name',
            });

            expect(result).toEqual({ fullname: 'New Name' });
        });

        it('should prepare updates with avatar only', async () => {
            usersService.fileLinksService.linkFileToEntity.mockResolvedValue(mockFile);

            const result = await service.prepareUserUpdates({
                avatar: 'file-id-123',
            } as any);

            expect(result).toEqual({ avatar: mockFile });
            expect(usersService.fileLinksService.linkFileToEntity).toHaveBeenCalledWith(
                'file-id-123',
                FileUsageEnum.USER_AVATAR,
            );
        });

        it('should prepare updates with both fullname and avatar', async () => {
            usersService.fileLinksService.linkFileToEntity.mockResolvedValue(mockFile);

            const result = await service.prepareUserUpdates({
                fullname: 'Complete User',
                avatar: 'file-id-456',
            } as any);

            expect(result).toEqual({
                fullname: 'Complete User',
                avatar: mockFile,
            });
        });

        it('should handle file linking error', async () => {
            usersService.fileLinksService.linkFileToEntity.mockRejectedValue(
                new Error('File error'),
            );

            await expect(service.prepareUserUpdates({ avatar: 'file-id' } as any)).rejects.toThrow(
                'File error',
            );
        });
    });

    describe('prepareAdminUpdates', () => {
        beforeEach(() => {
            usersService.roleService.retrieveRoleByCriteria.mockResolvedValue(mockRole);
            usersService.groupService.retrieveGroupByCriteria.mockResolvedValue(mockGroup);
        });

        it('should return empty object when no updates provided', async () => {
            const result = await service.prepareAdminUpdates({} as any);

            expect(result).toEqual({});
        });

        it('should prepare updates with status only', async () => {
            const result = await service.prepareAdminUpdates({
                status: UserStatusEnum.SUSPENDED,
            } as any);

            expect(result).toEqual({ status: UserStatusEnum.SUSPENDED });
        });

        it('should prepare updates with role only', async () => {
            const result = await service.prepareAdminUpdates({
                roleId: 'ADMIN',
            } as any);

            expect(result).toEqual({ role: mockRole });
            expect(usersService.roleService.retrieveRoleByCriteria).toHaveBeenCalledWith({
                label: 'ADMIN',
            });
        });

        it('should prepare updates with group only', async () => {
            const result = await service.prepareAdminUpdates({
                groupId: 'group-123',
            } as any);

            expect(result).toEqual({ group: mockGroup });
            expect(usersService.groupService.retrieveGroupByCriteria).toHaveBeenCalledWith({
                id: 'group-123',
            });
        });

        it('should prepare updates with all fields', async () => {
            const result = await service.prepareAdminUpdates({
                status: UserStatusEnum.ACTIVE,
                roleId: 'SUPPORT',
                groupId: 'group-456',
            } as any);

            expect(result).toEqual({
                status: UserStatusEnum.ACTIVE,
                role: mockRole,
                group: mockGroup,
            });
        });

        it('should handle role service error', async () => {
            usersService.roleService.retrieveRoleByCriteria.mockRejectedValue(
                new Error('Role error'),
            );

            await expect(service.prepareAdminUpdates({ roleId: 'ADMIN' } as any)).rejects.toThrow(
                'Role error',
            );
        });

        it('should handle group service error', async () => {
            usersService.groupService.retrieveGroupByCriteria.mockRejectedValue(
                new Error('Group error'),
            );

            await expect(
                service.prepareAdminUpdates({ groupId: 'group-1' } as any),
            ).rejects.toThrow('Group error');
        });
    });

    describe('wsAdminUser', () => {
        it('should send socket event with transformed admin data', () => {
            const transformedData = { id: 'transformed-1' };
            usersService.uETransformService.transformAdmin.mockReturnValue(transformedData);

            service.wsAdminUser(mockUser, SocketEventEnum.ADMIN_USER_CREATED);

            expect(usersService.uETransformService.transformAdmin).toHaveBeenCalledWith(mockUser);
            expect(usersService.sockerService.sendDataToRoute).toHaveBeenCalledWith(
                '/admin-users',
                SocketEventEnum.ADMIN_USER_CREATED,
                { payload: [transformedData] },
            );
        });

        it('should handle different socket events', () => {
            const events = [SocketEventEnum.ADMIN_USER_CREATED, SocketEventEnum.ADMIN_USER_UPDATED];

            events.forEach((event) => {
                service.wsAdminUser(mockUser, event);

                expect(usersService.sockerService.sendDataToRoute).toHaveBeenCalledWith(
                    '/admin-users',
                    event,
                    expect.any(Object),
                );
            });
        });

        it('should handle socket service error', () => {
            usersService.sockerService.sendDataToRoute.mockImplementation(() => {
                throw new Error('Socket error');
            });

            expect(() => service.wsAdminUser(mockUser, SocketEventEnum.ADMIN_USER_CREATED)).toThrow(
                'Socket error',
            );
        });
    });

    describe('adminByPermissions', () => {
        it('should find users with matching permission label and action', async () => {
            const fakeUsers = [
                { id: 'u1', email: 'admin1@test.com' },
                { id: 'u2', email: 'admin2@test.com' },
            ];
            mockUserRepo.find = jest.fn().mockResolvedValueOnce(fakeUsers);

            const result = await service.adminByPermissions('invoices', 'read');

            expect(mockUserRepo.find).toHaveBeenCalledWith({
                where: {
                    group: {
                        permissions: { label: 'invoices', action: 'read' },
                    },
                },
                select: ['id', 'email'],
            });
            expect(result).toEqual(fakeUsers);
        });

        it('should return empty array when no users match', async () => {
            mockUserRepo.find = jest.fn().mockResolvedValueOnce([]);

            const result = await service.adminByPermissions('unknown', 'delete');

            expect(result).toEqual([]);
        });

        it('should propagate errors from userRepo.find', async () => {
            mockUserRepo.find = jest.fn().mockRejectedValueOnce(new Error('DB error'));

            await expect(service.adminByPermissions('invoices', 'write')).rejects.toThrow(
                'DB error',
            );
        });
    });
});
