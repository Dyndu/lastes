import { Test, TestingModule } from '@nestjs/testing';
import { SupportsService } from './supports.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { SocketService } from '../../../helpers/socket/socket.service';
import { ErrorHandlerService } from '../../../common/response';
import { FileLinksService } from '../../files/services/file-links.service';
import { UsersEntityTransformService, UsersService } from '../../users/services';
import { SAdminConRepository, SConRepository, SMessagesRepository } from '../repositories';
import { TransformSEntitiesService } from './transform-s-entities.service';
import { OtherUtils } from '../../../utils/services/tools';
import { SCodesService } from '../../s-codes/s-codes.service';
import { UserEntity } from '../../users/entities/user.entity';
import { AdminSendMessageDto, BaseSendMessageDto, CreateConDto } from '../dto';
import { SConService } from './s-con.service';
import { SMessagesService } from './s-messages.service';
import { NotificationSubjectTypeEnum, SConStatusEnum, SocketEventEnum } from '../../../common/enum';
import { SAdminConService } from './s-admin-con.service';
import { SConEntity, SMessagesEntity } from '../entities';
import { CurrentUserInterface } from '../../../interface';
import { NotificationsService } from '../../notifications/services';
import { MailerService } from '../../../libs/mailer/services';
import { EnvConfigService } from '../../../utils/services/config';
import { Not } from 'typeorm';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('SupportsService', () => {
    let service: SupportsService;
    let logger: any;
    let sTransformService: any;
    let sConsService: any;
    let sMessagesService: any;
    let sAdminConService: any;
    let socketService: any;
    let errorHandler: any;
    let fileLinkService: any;
    let sAdminConRepo: any;
    let sMessageRepo: any;
    let sConRepo: any;
    let sCodeService: any;
    let otherUtils: any;
    let userService: any;
    let transformService: any;
    let notifService: any;
    let mailerService: any;
    let envConfigService: any;

    const mockUser: UserEntity = {
        id: 'user-123',
        email: 'user@test.com',
        firstname: 'Test',
        lastname: 'User',
        fullname: 'Test User',
        role: 'user',
    } as any;

    const mockAdmin: UserEntity = {
        id: 'admin-123',
        email: 'admin@test.com',
        firstname: 'Admin',
        lastname: 'User',
        fullname: 'Admin User',
        role: 'admin',
        avatar: {
            file: {
                id: 'avatar-file',
                path: '/avatars/admin.jpg',
            },
        },
    } as any;

    const mockCurrentUser: CurrentUserInterface = {
        id: 'user-123',
        role: 'user',
    } as CurrentUserInterface;

    const mockCurrentAdmin: CurrentUserInterface = {
        id: 'admin-123',
        role: 'admin',
    } as CurrentUserInterface;

    const mockConversation: SConEntity = {
        id: 'con-123',
        label: '12345678',
        createdBy: mockUser,
        deleted: false,
        code: { label: 'CODE-1' },
        createdAt: new Date('2024-01-01'),
        status: SConStatusEnum.ACTIVE,
    } as SConEntity;

    const mockClosedConversation: SConEntity = {
        ...mockConversation,
        id: 'con-closed',
        status: SConStatusEnum.CLOSED,
    } as SConEntity;

    const mockMessage: SMessagesEntity = {
        id: 'msg-123',
        content: 'Test message',
        sentBy: mockUser,
        con: mockConversation,
        createdAt: new Date('2024-01-01'),
    } as SMessagesEntity;

    const mockNotification = {
        id: 'notif-123',
        title: 'Support Request Received',
    };

    beforeEach(async () => {
        logger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
        };

        sTransformService = {
            transformCon: jest.fn(),
            markAsReadConEntities: jest.fn(),
            conEntities: jest.fn().mockReturnValue(['createdBy']),
            openChatEntities: jest.fn().mockReturnValue(['lastReadMessage']),
            conDetailsEntity: jest.fn().mockReturnValue(['createdBy']),
        };

        sConsService = {
            userConversations: jest.fn(),
            adminConversations: jest.fn(),
            retrieveSConByCriteria: jest.fn(),
            getOrCreateCon: jest.fn(),
            updateCon: jest.fn(),
            emitConversationUpdate: jest.fn(),
        };

        sMessagesService = {
            checkUserIsConOwner: jest.fn(),
            sendMessage: jest.fn(),
            loadInitial: jest.fn(),
            loadInitialForAdmin: jest.fn(),
            loadMore: jest.fn(),
            resolveAdminLastReadMessage: jest.fn(),
        };

        sAdminConService = {
            associateAdminCon: jest.fn(),
        };

        socketService = {
            sendDataToUser: jest.fn(),
        };

        errorHandler = {
            forbidden: jest.fn(),
            badRequest: jest.fn(),
            notFound: jest.fn(),
        };

        fileLinkService = {
            linkFilesToEntity: jest.fn(),
        };

        sAdminConRepo = {
            findOne: jest.fn(),
            update: jest.fn(),
        };

        sMessageRepo = {
            findOne: jest.fn(),
        };

        sConRepo = {
            findOne: jest.fn(),
        };

        sCodeService = {
            retrieveSCodeByCriteria: jest.fn(),
        };

        otherUtils = {
            formatCriteria: jest.fn(),
            buildEmailTemplate: jest.fn().mockReturnValue('<html lang="">template</html>'),
        };

        notifService = {
            createNotification: jest.fn().mockResolvedValue(mockNotification),
            sendNotificationToUsers: jest.fn().mockResolvedValue(undefined),
        };

        mailerService = {
            emailSend: jest.fn(),
            sendBulkMail: jest.fn().mockResolvedValue(undefined),
        };

        envConfigService = {
            userSupportLink: 'https://app.example.com/support',
            adminSupportLink: 'https://admin.example.com/support',
            sAdminRole: 'superadmin',
            userRole: 'user',
        };

        const preUserService = {
            retrieveUserByCriteria: jest.fn(),
            adminByPermissions: jest.fn(),
        };

        const mockUserRepo = {
            find: jest.fn(),
        };

        userService = {
            preUserService,
            envConfigService,
            userRepo: mockUserRepo,
        };

        transformService = {
            transformFiles: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SupportsService,
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: logger,
                },
                {
                    provide: TransformSEntitiesService,
                    useValue: sTransformService,
                },
                {
                    provide: SConService,
                    useValue: sConsService,
                },
                {
                    provide: SMessagesService,
                    useValue: sMessagesService,
                },
                {
                    provide: SAdminConService,
                    useValue: sAdminConService,
                },
                {
                    provide: SocketService,
                    useValue: socketService,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: errorHandler,
                },
                {
                    provide: FileLinksService,
                    useValue: fileLinkService,
                },
                {
                    provide: SAdminConRepository,
                    useValue: sAdminConRepo,
                },
                {
                    provide: SMessagesRepository,
                    useValue: sMessageRepo,
                },
                {
                    provide: SConRepository,
                    useValue: sConRepo,
                },
                {
                    provide: SCodesService,
                    useValue: sCodeService,
                },
                {
                    provide: OtherUtils,
                    useValue: otherUtils,
                },
                {
                    provide: UsersService,
                    useValue: userService,
                },
                {
                    provide: UsersEntityTransformService,
                    useValue: transformService,
                },
                {
                    provide: NotificationsService,
                    useValue: notifService,
                },
                {
                    provide: MailerService,
                    useValue: mailerService,
                },
                {
                    provide: EnvConfigService,
                    useValue: envConfigService,
                },
            ],
        }).compile();

        service = module.get<SupportsService>(SupportsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('badgeCount', () => {
        let mockQueryBuilder: any;

        beforeEach(() => {
            mockQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                groupBy: jest.fn().mockReturnThis(),
                getRawMany: jest.fn(),
            };

            sConRepo.getRepository = jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
            });
        });

        it('should return badge counts for admin user (all conversations)', async () => {
            mockQueryBuilder.getRawMany.mockResolvedValue([
                { status: SConStatusEnum.ACTIVE, count: '10' },
                { status: SConStatusEnum.CLOSED, count: '7' },
            ]);

            const result = await service.badgeCount(mockCurrentAdmin);

            expect(mockQueryBuilder.where).toHaveBeenCalledWith({});
            expect(result).toEqual({
                closed: 7,
                active: 10,
            });
        });

        it('should handle missing status counts', async () => {
            mockQueryBuilder.getRawMany.mockResolvedValue([
                { status: SConStatusEnum.ACTIVE, count: '8' },
            ]);

            const result = await service.badgeCount(mockCurrentUser);

            expect(result).toEqual({
                closed: 0,
                active: 8,
            });
        });

        it('should handle empty results', async () => {
            mockQueryBuilder.getRawMany.mockResolvedValue([]);

            const result = await service.badgeCount(mockCurrentUser);

            expect(result).toEqual({
                closed: 0,
                active: 0,
            });
        });

        it('should handle string counts and convert to numbers', async () => {
            mockQueryBuilder.getRawMany.mockResolvedValue([
                { status: SConStatusEnum.ACTIVE, count: '42' },
                { status: SConStatusEnum.CLOSED, count: '15' },
            ]);

            const result = await service.badgeCount(mockCurrentUser);

            expect(result.closed).toBe(15);
            expect(result.active).toBe(42);
            expect(typeof result.closed).toBe('number');
            expect(typeof result.active).toBe('number');
        });

        it('should handle user without userRole in envConfig', async () => {
            envConfigService.userRole = 'user';
            mockQueryBuilder.getRawMany.mockResolvedValue([]);

            await service.badgeCount(mockCurrentUser);

            expect(mockQueryBuilder.where).toHaveBeenCalledWith({
                createdBy: { id: 'user-123' },
            });
        });

        it('should use different where clause based on user role', async () => {
            envConfigService.userRole = 'customer';
            const customerUser = { ...mockCurrentUser, role: 'customer' };
            mockQueryBuilder.getRawMany.mockResolvedValue([]);

            await service.badgeCount(customerUser);

            expect(mockQueryBuilder.where).toHaveBeenCalledWith({
                createdBy: { id: 'user-123' },
            });

            const adminUser = { ...mockCurrentAdmin, role: 'admin' };
            await service.badgeCount(adminUser);

            expect(mockQueryBuilder.where).toHaveBeenCalledWith({});
        });

        it('should handle multiple status results correctly', async () => {
            mockQueryBuilder.getRawMany.mockResolvedValue([
                { status: SConStatusEnum.ACTIVE, count: '5' },
                { status: SConStatusEnum.CLOSED, count: '2' },
            ]);

            const result = await service.badgeCount(mockCurrentUser);

            expect(result).toEqual({
                closed: 2,
                active: 5,
            });
        });

        it('should propagate query builder errors', async () => {
            mockQueryBuilder.getRawMany.mockRejectedValue(new Error('Database error'));

            await expect(service.badgeCount(mockCurrentUser)).rejects.toThrow('Database error');
        });

        it('should handle null values in raw results', async () => {
            mockQueryBuilder.getRawMany.mockResolvedValue([
                { status: SConStatusEnum.ACTIVE, count: null },
                { status: SConStatusEnum.CLOSED, count: undefined },
            ]);

            const result = await service.badgeCount(mockCurrentUser);

            expect(result).toEqual({
                closed: 0,
                active: 0,
            });
        });
    });

    describe('assertChatIsOpen', () => {
        it('should not throw error when chat is open', () => {
            const openCon = {
                ...mockConversation,
                status: SConStatusEnum.ACTIVE,
            } as any;

            expect(() => {
                service.assertChatIsOpen(openCon);
            }).not.toThrow();

            expect(errorHandler.forbidden).not.toHaveBeenCalled();
        });

        it('should throw forbidden error when chat is closed', () => {
            errorHandler.forbidden.mockImplementation(() => {
                throw new Error('Forbidden, chat already closed');
            });

            expect(() => {
                service.assertChatIsOpen(mockClosedConversation);
            }).toThrow('Forbidden, chat already closed');

            expect(errorHandler.forbidden).toHaveBeenCalledWith(
                `This chat with id ${mockClosedConversation.id} is already closed, no any further action allowed`,
                `Forbidden, chat already closed`,
            );
        });

        it('should include conversation id in error message', () => {
            errorHandler.forbidden.mockImplementation(() => {
                throw new Error('Forbidden');
            });

            const con = {
                ...mockConversation,
                id: 'specific-con-123',
                status: SConStatusEnum.CLOSED,
            } as any;

            try {
                service.assertChatIsOpen(con);
            } catch (error) {}

            expect(errorHandler.forbidden).toHaveBeenCalledWith(
                `This chat with id specific-con-123 is already closed, no any further action allowed`,
                expect.any(String),
            );
        });
    });

    describe('getUser', () => {
        it('should retrieve user by id with role, avatar and avatar.file relations', async () => {
            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockUser);

            const result = await service.getUser('user-123');

            expect(userService.preUserService.retrieveUserByCriteria).toHaveBeenCalledWith(
                { id: 'user-123' },
                ['role', 'avatar', 'avatar.file'],
            );
            expect(result).toEqual(mockUser);
        });

        it('should handle different user ids', async () => {
            const differentUser = { ...mockUser, id: 'user-456' };
            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(differentUser);

            const result = await service.getUser('user-456');

            expect(userService.preUserService.retrieveUserByCriteria).toHaveBeenCalledWith(
                { id: 'user-456' },
                ['role', 'avatar', 'avatar.file'],
            );
            expect(result).toEqual(differentUser);
        });

        it('should always include role, avatar and avatar.file relations', async () => {
            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockUser);

            await service.getUser('user-789');

            expect(userService.preUserService.retrieveUserByCriteria).toHaveBeenCalledWith(
                expect.any(Object),
                ['role', 'avatar', 'avatar.file'],
            );
        });

        it('should handle user without avatar', async () => {
            const userWithoutAvatar = { ...mockUser, avatar: null };
            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(userWithoutAvatar);

            const result = await service.getUser('user-123');

            expect(result).toEqual(userWithoutAvatar);
        });
    });

    describe('userConList', () => {
        it('should get user conversations with default parameters', async () => {
            const mockResult = { data: [], total: 0, page: 1, limit: 20 };
            sConsService.userConversations.mockResolvedValue(mockResult);

            const result = await service.userConList(mockCurrentUser, 1, 20);

            expect(logger.info).toHaveBeenCalledWith('Get user connected conversations');
            expect(sConsService.userConversations).toHaveBeenCalledWith(
                'user-123',
                undefined,
                undefined,
                1,
                20,
            );
            expect(result).toEqual(mockResult);
        });

        it('should get user conversations with status filter', async () => {
            sConsService.userConversations.mockResolvedValue({
                data: [],
                total: 0,
                page: 1,
                limit: 20,
            });

            await service.userConList(mockCurrentUser, 1, 20, SConStatusEnum.ACTIVE);

            expect(sConsService.userConversations).toHaveBeenCalledWith(
                'user-123',
                SConStatusEnum.ACTIVE,
                undefined,
                1,
                20,
            );
        });

        it('should get user conversations with search term', async () => {
            sConsService.userConversations.mockResolvedValue({
                data: [],
                total: 0,
                page: 1,
                limit: 20,
            });

            await service.userConList(mockCurrentUser, 1, 20, undefined, 'search term');

            expect(sConsService.userConversations).toHaveBeenCalledWith(
                'user-123',
                undefined,
                'search term',
                1,
                20,
            );
        });

        it('should get user conversations with all filters', async () => {
            sConsService.userConversations.mockResolvedValue({
                data: [],
                total: 0,
                page: 2,
                limit: 50,
            });

            await service.userConList(mockCurrentUser, 2, 50, SConStatusEnum.CLOSED, 'urgent');

            expect(sConsService.userConversations).toHaveBeenCalledWith(
                'user-123',
                SConStatusEnum.CLOSED,
                'urgent',
                2,
                50,
            );
        });

        it('should handle different pagination', async () => {
            const mockResult = { data: [], total: 100, page: 3, limit: 10 };
            sConsService.userConversations.mockResolvedValue(mockResult);

            const result = await service.userConList(mockCurrentUser, 3, 10);

            expect(sConsService.userConversations).toHaveBeenCalledWith(
                'user-123',
                undefined,
                undefined,
                3,
                10,
            );
            expect(result).toEqual(mockResult);
        });
    });

    describe('adminConList', () => {
        it('should log with user role in message', async () => {
            sConsService.adminConversations.mockResolvedValue({
                data: [],
                total: 0,
                page: 1,
                limit: 20,
            });

            await service.adminConList(mockCurrentAdmin, 1, 20);

            expect(logger.info).toHaveBeenCalledWith('Get admin connected conversations');
        });

        it('should get admin conversations with default parameters', async () => {
            const mockResult = { data: [], total: 0, page: 1, limit: 20 };
            sConsService.adminConversations.mockResolvedValue(mockResult);

            const result = await service.adminConList(mockCurrentAdmin, 1, 20);

            expect(sConsService.adminConversations).toHaveBeenCalledWith(
                'admin-123',
                undefined,
                undefined,
                1,
                20,
            );
            expect(result).toEqual(mockResult);
        });

        it('should get admin conversations with status filter', async () => {
            sConsService.adminConversations.mockResolvedValue({
                data: [],
                total: 0,
                page: 1,
                limit: 20,
            });

            await service.adminConList(mockCurrentAdmin, 1, 20, SConStatusEnum.ACTIVE);

            expect(sConsService.adminConversations).toHaveBeenCalledWith(
                'admin-123',
                SConStatusEnum.ACTIVE,
                undefined,
                1,
                20,
            );
        });

        it('should get admin conversations with search term', async () => {
            sConsService.adminConversations.mockResolvedValue({
                data: [],
                total: 0,
                page: 1,
                limit: 20,
            });

            await service.adminConList(mockCurrentAdmin, 1, 20, undefined, 'ticket');

            expect(sConsService.adminConversations).toHaveBeenCalledWith(
                'admin-123',
                undefined,
                'ticket',
                1,
                20,
            );
        });

        it('should get admin conversations with all parameters', async () => {
            sConsService.adminConversations.mockResolvedValue({
                data: [],
                total: 0,
                page: 5,
                limit: 15,
            });

            await service.adminConList(mockCurrentAdmin, 5, 15, SConStatusEnum.CLOSED, 'search');

            expect(sConsService.adminConversations).toHaveBeenCalledWith(
                'admin-123',
                SConStatusEnum.CLOSED,
                'search',
                5,
                15,
            );
        });

        it('should use the role from currentUser in log message', async () => {
            sConsService.adminConversations.mockResolvedValue({
                data: [],
                total: 0,
                page: 1,
                limit: 20,
            });
            const superAdmin = { ...mockCurrentAdmin, role: 'superadmin' };

            await service.adminConList(superAdmin, 1, 20);

            expect(logger.info).toHaveBeenCalledWith('Get superadmin connected conversations');
        });
    });

    describe('conDetails', () => {
        it('should get conversation details by id', async () => {
            sConsService.retrieveSConByCriteria.mockResolvedValue(mockConversation);
            sTransformService.conDetailsEntity.mockReturnValue(['createdBy']);

            const result = await service.conDetails('con-123');

            expect(logger.info).toHaveBeenCalledWith('Get conversation details from con-123');
            expect(sTransformService.conDetailsEntity).toHaveBeenCalled();
            expect(sConsService.retrieveSConByCriteria).toHaveBeenCalledWith({ id: 'con-123' }, [
                'createdBy',
            ]);
            expect(result).toEqual({
                id: 'con-123',
                label: 'Ticket id: #12345678',
                createdBy: {
                    id: mockUser.id,
                    fullname: mockUser.fullname,
                    email: mockUser.email,
                },
            });
        });

        it('should format label with ticket prefix', async () => {
            const con = { ...mockConversation, label: '99999999' };
            sConsService.retrieveSConByCriteria.mockResolvedValue(con);

            const result = await service.conDetails('con-456');

            expect(result.label).toBe('Ticket id: #99999999');
        });

        it('should handle different conversation ids', async () => {
            const con = {
                ...mockConversation,
                id: 'con-789',
                label: '11111111',
            };
            sConsService.retrieveSConByCriteria.mockResolvedValue(con);

            const result = await service.conDetails('con-789');

            expect(sConsService.retrieveSConByCriteria).toHaveBeenCalledWith({ id: 'con-789' }, [
                'createdBy',
            ]);
            expect(result).toEqual({
                id: 'con-789',
                label: 'Ticket id: #11111111',
                createdBy: {
                    id: mockUser.id,
                    fullname: mockUser.fullname,
                    email: mockUser.email,
                },
            });
        });

        it('should handle conversation without createdBy', async () => {
            const conWithoutCreator = { ...mockConversation, createdBy: null };
            sConsService.retrieveSConByCriteria.mockResolvedValue(conWithoutCreator);

            const result = await service.conDetails('con-123');

            expect(result.createdBy).toBeNull();
        });
    });

    describe('sendEmailToUser', () => {
        it('should send email to user with correct parameters', () => {
            const template = '<html lang="">email</html>';
            otherUtils.buildEmailTemplate.mockReturnValue(template);

            service.sendEmailToUser(mockUser, mockConversation);

            expect(otherUtils.buildEmailTemplate).toHaveBeenCalledWith(
                '../../../src/utils/templates/h-support-user.hbs',
                expect.objectContaining({
                    fullname: mockUser.fullname,
                    label: `Ticket id: #${mockConversation.label}`,
                    cLabel: mockConversation.code.label,
                    createdAt: mockConversation.createdAt,
                    link: envConfigService.userSupportLink,
                    currentYear: new Date().getFullYear(),
                }),
            );
            expect(mailerService.emailSend).toHaveBeenCalledWith(
                mockUser.email,
                'Help and Support chat initiated',
                template,
            );
        });

        it('should include current year in template data', () => {
            const currentYear = new Date().getFullYear();

            service.sendEmailToUser(mockUser, mockConversation);

            expect(otherUtils.buildEmailTemplate).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ currentYear }),
            );
        });

        it('should include createdAt in template data', () => {
            service.sendEmailToUser(mockUser, mockConversation);

            expect(otherUtils.buildEmailTemplate).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    createdAt: mockConversation.createdAt,
                }),
            );
        });

        it('should use userSupportLink from envConfig', () => {
            service.sendEmailToUser(mockUser, mockConversation);

            expect(otherUtils.buildEmailTemplate).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    link: 'https://app.example.com/support',
                }),
            );
        });
    });

    describe('sendEmailToAdmins', () => {
        const mockAdmins = [
            { ...mockAdmin, email: 'admin1@test.com' },
            { ...mockAdmin, id: 'admin-456', email: 'admin2@test.com' },
        ] as UserEntity[];

        it('should send bulk email to all admins', async () => {
            const template = '<html lang="">admin email</html>';
            otherUtils.buildEmailTemplate.mockReturnValue(template);

            await service.sendEmailToAdmins(mockAdmins, mockUser, mockConversation);

            expect(mailerService.sendBulkMail).toHaveBeenCalledWith(
                ['admin1@test.com', 'admin2@test.com'],
                'Help and Support chat initiated',
                template,
            );
        });

        it('should build template with sender info', async () => {
            await service.sendEmailToAdmins(mockAdmins, mockUser, mockConversation);

            expect(otherUtils.buildEmailTemplate).toHaveBeenCalledWith(
                '../../../src/utils/templates/h-support-admin.hbs',
                expect.objectContaining({
                    fullname: mockUser.fullname,
                    avatar: undefined,
                    email: mockUser.email,
                    label: `Ticket id: #${mockConversation.label}`,
                    cLabel: mockConversation.code.label,
                    createdAt: mockConversation.createdAt,
                    link: envConfigService.adminSupportLink,
                    currentYear: new Date().getFullYear(),
                }),
            );
        });

        it('should include avatar path when user has avatar', async () => {
            const userWithAvatar = {
                ...mockUser,
                avatar: { file: { path: '/avatars/user.jpg' } },
            } as any;

            await service.sendEmailToAdmins(mockAdmins, userWithAvatar, mockConversation);

            expect(otherUtils.buildEmailTemplate).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    avatar: '/avatars/user.jpg',
                }),
            );
        });

        it('should extract emails from user list', async () => {
            const threeAdmins = [
                ...mockAdmins,
                {
                    ...mockAdmin,
                    id: 'admin-789',
                    email: 'admin3@test.com',
                } as UserEntity,
            ];

            await service.sendEmailToAdmins(threeAdmins, mockUser, mockConversation);

            expect(mailerService.sendBulkMail).toHaveBeenCalledWith(
                ['admin1@test.com', 'admin2@test.com', 'admin3@test.com'],
                expect.any(String),
                expect.any(String),
            );
        });

        it('should include current year in template data', async () => {
            const currentYear = new Date().getFullYear();

            await service.sendEmailToAdmins(mockAdmins, mockUser, mockConversation);

            expect(otherUtils.buildEmailTemplate).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ currentYear }),
            );
        });
    });

    describe('notifyAdminWhenConCreated', () => {
        const mockAdmins = [mockAdmin] as UserEntity[];
        const mockSAdmin = {
            ...mockAdmin,
            id: 'sadmin-1',
            role: 'superadmin',
            email: 'super@admin.com',
        } as any;

        beforeEach(() => {
            userService.preUserService.adminByPermissions.mockResolvedValue(mockAdmins);
            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockSAdmin);
            notifService.createNotification.mockResolvedValue(mockNotification);
            notifService.sendNotificationToUsers.mockResolvedValue(undefined);
            mailerService.sendBulkMail.mockResolvedValue(undefined);
            otherUtils.buildEmailTemplate.mockReturnValue('<html lang="">template</html>');
        });

        it('should fetch admins by permission and superadmin in parallel', async () => {
            await service.notifyAdminWhenConCreated(mockUser, mockConversation);

            expect(userService.preUserService.adminByPermissions).toHaveBeenCalledWith(
                'help_support',
                'view',
            );
            expect(userService.preUserService.retrieveUserByCriteria).toHaveBeenCalledWith({
                role: { label: envConfigService.sAdminRole },
            });
        });

        it('should create notification with correct parameters', async () => {
            await service.notifyAdminWhenConCreated(mockUser, mockConversation);

            expect(notifService.createNotification).toHaveBeenCalledWith(
                'Support Request Received',
                `A new help request has been submitted by ${mockUser.fullname}`,
                NotificationSubjectTypeEnum.HELP_AND_SUPPORT,
                {
                    subjectId: mockConversation.id,
                    route: '/supports/cons',
                    sentBy: mockUser,
                },
            );
        });

        it('should send notification to all admins including superadmin', async () => {
            await service.notifyAdminWhenConCreated(mockUser, mockConversation);

            expect(notifService.sendNotificationToUsers).toHaveBeenCalledWith(mockNotification, [
                ...mockAdmins,
                mockSAdmin,
            ]);
        });

        it('should send bulk email to all admins', async () => {
            await service.notifyAdminWhenConCreated(mockUser, mockConversation);

            expect(mailerService.sendBulkMail).toHaveBeenCalled();
        });

        it('should send email to user after notifying admins', async () => {
            await service.notifyAdminWhenConCreated(mockUser, mockConversation);

            expect(mailerService.emailSend).toHaveBeenCalledWith(
                mockUser.email,
                'Help and Support chat initiated',
                expect.any(String),
            );
        });

        it('should handle case when no admins found', async () => {
            userService.preUserService.adminByPermissions.mockResolvedValue([]);

            await service.notifyAdminWhenConCreated(mockUser, mockConversation);

            expect(notifService.sendNotificationToUsers).toHaveBeenCalledWith(mockNotification, [
                mockSAdmin,
            ]);
        });
    });

    describe('notifyAdminsNewMessage', () => {
        const mockAdminUsers = [mockAdmin] as UserEntity[];

        beforeEach(() => {
            userService.userRepo.find.mockResolvedValue(mockAdminUsers);
            notifService.createNotification.mockResolvedValue(mockNotification);
            notifService.sendNotificationToUsers.mockResolvedValue(undefined);
        });

        it('should create a notification with the correct parameters', async () => {
            await service.notifyAdminsNewMessage(mockUser, mockMessage);

            expect(notifService.createNotification).toHaveBeenCalledWith(
                'New Message',
                `You've receive a new message from ${mockUser.fullname}`,
                NotificationSubjectTypeEnum.NEWSLETTER,
                {
                    subjectId: mockMessage.id,
                    route: 'new-message',
                    sentBy: mockUser,
                },
            );
        });

        it('should query non-user role admins', async () => {
            await service.notifyAdminsNewMessage(mockUser, mockMessage);

            expect(userService.userRepo.find).toHaveBeenCalledWith({
                where: { role: { label: Not(envConfigService.userRole) } },
            });
        });

        it('should run notification creation and admin query in parallel', async () => {
            const createNotifSpy = jest.spyOn(notifService, 'createNotification');
            const findSpy = jest.spyOn(userService.userRepo, 'find');

            await service.notifyAdminsNewMessage(mockUser, mockMessage);

            expect(createNotifSpy).toHaveBeenCalledTimes(1);
            expect(findSpy).toHaveBeenCalledTimes(1);
        });

        it('should send notification to all found admins', async () => {
            await service.notifyAdminsNewMessage(mockUser, mockMessage);

            expect(notifService.sendNotificationToUsers).toHaveBeenCalledWith(
                mockNotification,
                mockAdminUsers,
            );
        });

        it('should handle case when no admins are found', async () => {
            userService.userRepo.find.mockResolvedValue([]);

            await service.notifyAdminsNewMessage(mockUser, mockMessage);

            expect(notifService.sendNotificationToUsers).toHaveBeenCalledWith(mockNotification, []);
        });

        it('should handle different senders', async () => {
            await service.notifyAdminsNewMessage(mockAdmin, mockMessage);

            expect(notifService.createNotification).toHaveBeenCalledWith(
                'New Message',
                `You've receive a new message from ${mockAdmin.fullname}`,
                expect.any(String),
                expect.objectContaining({ sentBy: mockAdmin }),
            );
        });
    });

    describe('createConversation', () => {
        const createConDto: CreateConDto = {
            codeId: 'code-123',
            content: 'Hello, I need help',
            files: [],
        };

        beforeEach(() => {
            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockUser);
            sConsService.getOrCreateCon.mockResolvedValue(mockConversation);
            sConsService.retrieveSConByCriteria.mockResolvedValue(mockConversation);
            sConsService.emitConversationUpdate.mockResolvedValue(undefined);
            sMessagesService.sendMessage.mockResolvedValue(mockMessage);
            sTransformService.transformCon.mockReturnValue({ id: 'con-123' });
            sTransformService.conEntities.mockReturnValue(['createdBy']);
            userService.preUserService.adminByPermissions = jest
                .fn()
                .mockResolvedValue([mockAdmin]);
            notifService.createNotification.mockResolvedValue(mockNotification);
            notifService.sendNotificationToUsers.mockResolvedValue(undefined);
            mailerService.sendBulkMail.mockResolvedValue(undefined);
            otherUtils.buildEmailTemplate.mockReturnValue('<html lang="">template</html>');
        });

        it('should log the creation with codeId and userId', async () => {
            await service.createConversation(mockCurrentUser, createConDto);

            expect(logger.info).toHaveBeenCalledWith(
                `Create a new conversation with code: code-123 by user user-123`,
            );
        });

        it('should get the user entities', async () => {
            await service.createConversation(mockCurrentUser, createConDto);

            expect(userService.preUserService.retrieveUserByCriteria).toHaveBeenCalledWith(
                { id: 'user-123' },
                ['role', 'avatar', 'avatar.file'],
            );
        });

        it('should call getOrCreateCon with user and codeId', async () => {
            await service.createConversation(mockCurrentUser, createConDto);

            expect(sConsService.getOrCreateCon).toHaveBeenCalledWith(
                mockUser,
                undefined,
                'code-123',
            );
        });

        it('should send the initial message', async () => {
            await service.createConversation(mockCurrentUser, createConDto);

            expect(sMessagesService.sendMessage).toHaveBeenCalledWith(
                mockConversation,
                mockUser,
                undefined,
                createConDto.content,
                createConDto.files,
            );
        });

        it('should return the transformed conversation', async () => {
            const transformed = { id: 'con-123', label: 'Transformed' };
            sTransformService.transformCon.mockReturnValue(transformed);

            const result = await service.createConversation(mockCurrentUser, createConDto);

            expect(sTransformService.transformCon).toHaveBeenCalledWith(mockConversation);
            expect(result).toEqual(transformed);
        });

        it('should emit conversation update and notify admins in setImmediate', async () => {
            jest.useFakeTimers();

            await service.createConversation(mockCurrentUser, createConDto);

            expect(sConsService.emitConversationUpdate).not.toHaveBeenCalled();

            jest.runAllTimers();
            await Promise.resolve();

            expect(sConsService.emitConversationUpdate).toHaveBeenCalledWith(
                mockConversation,
                mockMessage,
            );
        });

        it('should handle dto without files', async () => {
            const dtoNoFiles: CreateConDto = {
                codeId: 'code-456',
                content: 'Help!',
            };

            await service.createConversation(mockCurrentUser, dtoNoFiles);

            expect(sMessagesService.sendMessage).toHaveBeenCalledWith(
                mockConversation,
                mockUser,
                undefined,
                'Help!',
                undefined,
            );
        });

        it('should handle dto with empty files array', async () => {
            const dtoWithEmptyFiles: CreateConDto = {
                codeId: 'code-789',
                content: 'Help!',
                files: [],
            };

            await service.createConversation(mockCurrentUser, dtoWithEmptyFiles);

            expect(sMessagesService.sendMessage).toHaveBeenCalledWith(
                mockConversation,
                mockUser,
                undefined,
                'Help!',
                [],
            );
        });
    });

    describe('sendMessageGeneric', () => {
        const baseDto: BaseSendMessageDto = {
            content: 'Test message',
        };

        beforeEach(() => {
            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockUser);
            sConsService.retrieveSConByCriteria.mockResolvedValue(mockConversation);
            sMessagesService.sendMessage.mockResolvedValue(mockMessage);
            sConsService.emitConversationUpdate.mockResolvedValue(undefined);
            sTransformService.conEntities.mockReturnValue(['createdBy']);
        });

        it('should log with user role', async () => {
            const dto = { ...baseDto, conId: 'con-123' };

            await service.sendMessageGeneric(mockCurrentUser, dto, false);

            expect(logger.info).toHaveBeenCalledWith(
                'Send a new message by user with id: user-123',
            );
        });

        it('should log with admin role', async () => {
            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockAdmin);
            const dto = { ...baseDto, conId: 'con-123' };

            await service.sendMessageGeneric(mockCurrentAdmin, dto, true);

            expect(logger.info).toHaveBeenCalledWith(
                'Send a new message by admin with id: admin-123',
            );
        });

        it('should assert chat is open before proceeding', async () => {
            const dto = { ...baseDto, conId: 'con-123' };
            const assertSpy = jest.spyOn(service, 'assertChatIsOpen');

            await service.sendMessageGeneric(mockCurrentUser, dto, false);

            expect(assertSpy).toHaveBeenCalledWith(mockConversation);
        });

        it('should throw if chat is closed', async () => {
            sConsService.retrieveSConByCriteria.mockResolvedValue(mockClosedConversation);
            errorHandler.forbidden.mockImplementation(() => {
                throw new Error('Forbidden, chat already closed');
            });
            const dto = { ...baseDto, conId: 'con-closed' };

            await expect(service.sendMessageGeneric(mockCurrentUser, dto, false)).rejects.toThrow(
                'Forbidden, chat already closed',
            );
        });

        it('should return message and sentBy for non-admin user', async () => {
            const dto = { ...baseDto, conId: 'con-123' };

            const result = await service.sendMessageGeneric(mockCurrentUser, dto, false);

            expect(sConsService.retrieveSConByCriteria).toHaveBeenCalledWith({ id: 'con-123' }, [
                'createdBy',
            ]);
            expect(sMessagesService.checkUserIsConOwner).toHaveBeenCalledWith(
                mockUser,
                mockConversation,
            );
            expect(sMessagesService.sendMessage).toHaveBeenCalledWith(
                mockConversation,
                mockUser,
                undefined,
                'Test message',
                undefined,
            );
            expect(result).toEqual({ message: mockMessage, sentBy: mockUser });
        });

        it('should skip ownership check for admin', async () => {
            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockAdmin);
            const dto = { content: 'Admin message', conId: 'con-123' };

            await service.sendMessageGeneric(mockCurrentAdmin, dto, true);

            expect(sMessagesService.checkUserIsConOwner).not.toHaveBeenCalled();
        });

        it('should return message and sentBy for admin', async () => {
            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockAdmin);
            const dto = { content: 'Admin message', conId: 'con-123' };

            const result = await service.sendMessageGeneric(mockCurrentAdmin, dto, true);

            expect(result).toEqual({ message: mockMessage, sentBy: mockAdmin });
        });

        it('should handle message with reply', async () => {
            const dtoWithReply = {
                ...baseDto,
                conId: 'con-123',
                messagesId: 'msg-456',
            };

            await service.sendMessageGeneric(mockCurrentUser, dtoWithReply, false);

            expect(sMessagesService.sendMessage).toHaveBeenCalledWith(
                mockConversation,
                mockUser,
                'msg-456',
                'Test message',
                undefined,
            );
        });

        it('should handle message with files', async () => {
            const dtoWithFiles = {
                ...baseDto,
                conId: 'con-123',
                files: ['file-1', 'file-2'],
            };

            await service.sendMessageGeneric(mockCurrentUser, dtoWithFiles, false);

            expect(sMessagesService.sendMessage).toHaveBeenCalledWith(
                mockConversation,
                mockUser,
                undefined,
                'Test message',
                ['file-1', 'file-2'],
            );
        });

        it('should emit conversation update in setImmediate', async () => {
            jest.useFakeTimers();
            const dto = { ...baseDto, conId: 'con-123' };

            await service.sendMessageGeneric(mockCurrentUser, dto, false);

            expect(sConsService.emitConversationUpdate).not.toHaveBeenCalled();

            jest.runAllTimers();
            await Promise.resolve();

            expect(sConsService.emitConversationUpdate).toHaveBeenCalledWith(
                mockConversation,
                mockMessage,
            );
        });

        it('should handle all dto fields', async () => {
            const fullDto = {
                content: 'Full message',
                messagesId: 'msg-reply',
                files: ['file-1'],
                conId: 'con-existing',
            };

            await service.sendMessageGeneric(mockCurrentUser, fullDto, false);

            expect(sMessagesService.sendMessage).toHaveBeenCalledWith(
                mockConversation,
                mockUser,
                'msg-reply',
                'Full message',
                ['file-1'],
            );
        });

        it('should handle dto with only conId', async () => {
            const minimalDto = { conId: 'con-123' };

            await service.sendMessageGeneric(mockCurrentUser, minimalDto, false);

            expect(sMessagesService.sendMessage).toHaveBeenCalledWith(
                mockConversation,
                mockUser,
                undefined,
                undefined,
                undefined,
            );
        });
    });

    describe('sendMessageByUser', () => {
        const userDto: AdminSendMessageDto = {
            content: 'User message',
            conId: 'con-123',
        };

        beforeEach(() => {
            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockUser);
            sConsService.retrieveSConByCriteria.mockResolvedValue(mockConversation);
            sMessagesService.sendMessage.mockResolvedValue(mockMessage);
            sConsService.emitConversationUpdate.mockResolvedValue(undefined);
            sTransformService.conEntities.mockReturnValue(['createdBy']);
            userService.userRepo.find.mockResolvedValue([mockAdmin]);
            notifService.createNotification.mockResolvedValue(mockNotification);
            notifService.sendNotificationToUsers.mockResolvedValue(undefined);
        });

        it('should return success message', async () => {
            const result = await service.sendMessageByUser(mockCurrentUser, userDto);

            expect(result).toEqual({ message: 'Message sent successfully' });
        });

        it('should call sendMessageGeneric with isAdmin false', async () => {
            const sendGenericSpy = jest.spyOn(service, 'sendMessageGeneric');

            await service.sendMessageByUser(mockCurrentUser, userDto);

            expect(sendGenericSpy).toHaveBeenCalledWith(mockCurrentUser, userDto, false);
        });

        it('should check user is conversation owner', async () => {
            await service.sendMessageByUser(mockCurrentUser, userDto);

            expect(sMessagesService.checkUserIsConOwner).toHaveBeenCalled();
        });

        it('should call notifyAdminsNewMessage with sentBy and message', async () => {
            const notifySpy = jest.spyOn(service, 'notifyAdminsNewMessage');

            await service.sendMessageByUser(mockCurrentUser, userDto);

            expect(notifySpy).toHaveBeenCalledWith(mockUser, mockMessage);
        });

        it('should notify admins after sending message', async () => {
            await service.sendMessageByUser(mockCurrentUser, userDto);

            expect(notifService.createNotification).toHaveBeenCalledWith(
                'New Message',
                `You've receive a new message from ${mockUser.fullname}`,
                NotificationSubjectTypeEnum.NEWSLETTER,
                expect.objectContaining({
                    subjectId: mockMessage.id,
                    sentBy: mockUser,
                }),
            );
            expect(notifService.sendNotificationToUsers).toHaveBeenCalledWith(mockNotification, [
                mockAdmin,
            ]);
        });

        it('should pass user dto correctly', async () => {
            const customDto: AdminSendMessageDto = {
                content: 'Custom message',
                conId: 'con-456',
                messagesId: 'msg-123',
                files: ['file-1'],
            };

            await service.sendMessageByUser(mockCurrentUser, customDto);

            expect(sMessagesService.sendMessage).toHaveBeenCalledWith(
                mockConversation,
                mockUser,
                'msg-123',
                'Custom message',
                ['file-1'],
            );
        });
    });

    describe('sendMessageByAdmin', () => {
        const adminDto: AdminSendMessageDto = {
            content: 'Admin message',
            conId: 'con-123',
        };

        beforeEach(() => {
            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockAdmin);
            sConsService.retrieveSConByCriteria.mockResolvedValue(mockConversation);
            sMessagesService.sendMessage.mockResolvedValue(mockMessage);
            sConsService.emitConversationUpdate.mockResolvedValue(undefined);
            sTransformService.conEntities.mockReturnValue(['createdBy']);
        });

        it('should send message by admin', async () => {
            const result = await service.sendMessageByAdmin(mockCurrentAdmin, adminDto);

            expect(result).toEqual({ message: 'Message sent successfully' });
        });

        it('should call sendMessageGeneric with isAdmin true', async () => {
            const sendGenericSpy = jest.spyOn(service, 'sendMessageGeneric');

            await service.sendMessageByAdmin(mockCurrentAdmin, adminDto);

            expect(sendGenericSpy).toHaveBeenCalledWith(mockCurrentAdmin, adminDto, true);
        });

        it('should not check user is conversation owner', async () => {
            await service.sendMessageByAdmin(mockCurrentAdmin, adminDto);

            expect(sMessagesService.checkUserIsConOwner).not.toHaveBeenCalled();
        });

        it('should NOT call notifyAdminsNewMessage', async () => {
            const notifySpy = jest.spyOn(service, 'notifyAdminsNewMessage');

            await service.sendMessageByAdmin(mockCurrentAdmin, adminDto);

            expect(notifySpy).not.toHaveBeenCalled();
        });

        it('should pass admin dto correctly', async () => {
            const customDto: AdminSendMessageDto = {
                content: 'Custom admin message',
                conId: 'con-456',
                messagesId: 'msg-789',
                files: ['file-2', 'file-3'],
            };

            await service.sendMessageByAdmin(mockCurrentAdmin, customDto);

            expect(sMessagesService.sendMessage).toHaveBeenCalledWith(
                mockConversation,
                mockAdmin,
                'msg-789',
                'Custom admin message',
                ['file-2', 'file-3'],
            );
        });

        it('should work with minimal dto', async () => {
            const minimalDto: AdminSendMessageDto = { conId: 'con-minimal' };

            await service.sendMessageByAdmin(mockCurrentAdmin, minimalDto);

            expect(sMessagesService.sendMessage).toHaveBeenCalledWith(
                mockConversation,
                mockAdmin,
                undefined,
                undefined,
                undefined,
            );
        });
    });

    describe('notifyConversationUpdate', () => {
        it('should send socket notification with conversation data', () => {
            jest.useFakeTimers();
            const transformedCon = { id: 'con-123', label: 'Transformed' };
            sTransformService.transformCon.mockReturnValue(transformedCon);

            service.notifyConversationUpdate('user-123', mockConversation, mockMessage);

            expect(socketService.sendDataToUser).not.toHaveBeenCalled();

            jest.runAllTimers();

            expect(sTransformService.transformCon).toHaveBeenCalledWith(
                mockConversation,
                mockMessage,
            );
            expect(socketService.sendDataToUser).toHaveBeenCalledWith(
                'user-123',
                '/supports/cons',
                SocketEventEnum.SUPPORT_CONVERSATION_UPDATED,
                { payload: [transformedCon] },
            );
        });

        it('should notify without lastMessage', () => {
            jest.useFakeTimers();
            sTransformService.transformCon.mockReturnValue({ id: 'con-456' });

            service.notifyConversationUpdate('user-456', mockConversation);

            jest.runAllTimers();

            expect(sTransformService.transformCon).toHaveBeenCalledWith(
                mockConversation,
                undefined,
            );
        });

        it('should execute in setImmediate', () => {
            jest.useFakeTimers();

            service.notifyConversationUpdate('user-123', mockConversation, mockMessage);

            expect(socketService.sendDataToUser).not.toHaveBeenCalled();

            jest.runAllTimers();

            expect(socketService.sendDataToUser).toHaveBeenCalled();
        });

        it('should handle different user ids', () => {
            jest.useFakeTimers();
            sTransformService.transformCon.mockReturnValue({});

            service.notifyConversationUpdate('user-999', mockConversation, mockMessage);

            jest.runAllTimers();

            expect(socketService.sendDataToUser).toHaveBeenCalledWith(
                'user-999',
                expect.any(String),
                expect.any(String),
                expect.any(Object),
            );
        });
    });

    describe('getConWithLastMessage', () => {
        it('should retrieve conversation with last message', async () => {
            const conWithMessage = {
                ...mockConversation,
                lastMessage: mockMessage,
            };
            sTransformService.markAsReadConEntities.mockReturnValue([
                'lastMessage',
                'lastMessage.files',
                'lastMessage.sentBy',
            ]);
            sConsService.retrieveSConByCriteria.mockResolvedValue(conWithMessage);

            const result = await service.getConWithLastMessage('con-123');

            expect(sTransformService.markAsReadConEntities).toHaveBeenCalled();
            expect(sConsService.retrieveSConByCriteria).toHaveBeenCalledWith({ id: 'con-123' }, [
                'lastMessage',
                'lastMessage.files',
                'lastMessage.sentBy',
            ]);
            expect(result).toEqual({
                con: conWithMessage,
                lastMessage: mockMessage,
            });
        });

        it('should handle conversation without last message', async () => {
            const conWithoutMessage = {
                ...mockConversation,
                lastMessage: undefined,
            };
            sTransformService.markAsReadConEntities.mockReturnValue([]);
            sConsService.retrieveSConByCriteria.mockResolvedValue(conWithoutMessage);

            const result = await service.getConWithLastMessage('con-456');

            expect(result).toEqual({
                con: conWithoutMessage,
                lastMessage: undefined,
            });
        });

        it('should use markAsReadConEntities for relations', async () => {
            const customRelations = ['lastMessage', 'lastMessage.sentBy'];
            sTransformService.markAsReadConEntities.mockReturnValue(customRelations);
            sConsService.retrieveSConByCriteria.mockResolvedValue(mockConversation);

            await service.getConWithLastMessage('con-789');

            expect(sConsService.retrieveSConByCriteria).toHaveBeenCalledWith(
                { id: 'con-789' },
                customRelations,
            );
        });
    });

    describe('markAsReadByUser', () => {
        it('should mark conversation as read for user', async () => {
            const conWithMessage = {
                ...mockConversation,
                lastMessage: mockMessage,
            };
            sTransformService.markAsReadConEntities.mockReturnValue([]);
            sConsService.retrieveSConByCriteria.mockResolvedValue(conWithMessage);
            sConsService.updateCon.mockResolvedValue({ affected: 1 });
            sTransformService.transformCon.mockReturnValue({});

            const result = await service.markAsReadByUser(mockCurrentUser, 'con-123');

            expect(logger.info).toHaveBeenCalledWith(
                'Mark conversation messages as read by user with id: user-123',
            );
            expect(sConsService.updateCon).toHaveBeenCalledWith(conWithMessage, {
                lastReadMessage: mockMessage,
            });
            expect(result).toEqual({ message: 'Messages read successfully' });
        });

        it('should return early if no last message', async () => {
            const conWithoutMessage = {
                ...mockConversation,
                lastMessage: undefined,
            };
            sTransformService.markAsReadConEntities.mockReturnValue([]);
            sConsService.retrieveSConByCriteria.mockResolvedValue(conWithoutMessage);

            const result = await service.markAsReadByUser(mockCurrentUser, 'con-123');

            expect(sConsService.updateCon).not.toHaveBeenCalled();
            expect(result).toEqual({ message: 'Messages read successfully' });
        });

        it('should notify user after marking as read', async () => {
            jest.useFakeTimers();
            const conWithMessage = {
                ...mockConversation,
                lastMessage: mockMessage,
            };
            sTransformService.markAsReadConEntities.mockReturnValue([]);
            sConsService.retrieveSConByCriteria.mockResolvedValue(conWithMessage);
            sConsService.updateCon.mockResolvedValue({ affected: 1 });
            sTransformService.transformCon.mockReturnValue({});

            await service.markAsReadByUser(mockCurrentUser, 'con-123');

            jest.runAllTimers();

            expect(socketService.sendDataToUser).toHaveBeenCalledWith(
                'user-123',
                '/supports/cons',
                SocketEventEnum.SUPPORT_CONVERSATION_UPDATED,
                expect.any(Object),
            );
        });

        it('should handle null lastMessage', async () => {
            const conWithNull = { ...mockConversation, lastMessage: null };
            sTransformService.markAsReadConEntities.mockReturnValue([]);
            sConsService.retrieveSConByCriteria.mockResolvedValue(conWithNull);

            const result = await service.markAsReadByUser(mockCurrentUser, 'con-123');

            expect(sConsService.updateCon).not.toHaveBeenCalled();
            expect(result).toEqual({ message: 'Messages read successfully' });
        });
    });

    describe('markAsReadyAdmin', () => {
        it('should update existing admin-conversation link', async () => {
            const conWithMessage = {
                ...mockConversation,
                lastMessage: mockMessage,
            };
            const existingLink = { id: 'link-123' };

            sTransformService.markAsReadConEntities.mockReturnValue([]);
            sConsService.retrieveSConByCriteria.mockResolvedValue(conWithMessage);
            sAdminConRepo.findOne.mockResolvedValue(existingLink);
            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockAdmin);
            sAdminConRepo.update.mockResolvedValue({ affected: 1 });
            sTransformService.transformCon.mockReturnValue({});

            const result = await service.markAsReadyAdmin(mockCurrentAdmin, 'con-123');

            expect(logger.info).toHaveBeenCalledWith(
                'Mark conversation messages as read by admin with id: admin-123',
            );
            expect(sAdminConRepo.findOne).toHaveBeenCalledWith({
                where: {
                    admin: { id: 'admin-123' },
                    conversation: { id: 'con-123' },
                },
            });
            expect(sAdminConRepo.update).toHaveBeenCalledWith(
                { id: 'link-123' },
                { lastReadMessage: mockMessage },
            );
            expect(sAdminConService.associateAdminCon).not.toHaveBeenCalled();
            expect(result).toEqual({ message: 'Messages read successfully' });
        });

        it('should create new admin-conversation link if not exists', async () => {
            const cWithMessage = {
                ...mockConversation,
                lastMessage: mockMessage,
            };

            sTransformService.markAsReadConEntities.mockReturnValue([]);
            sConsService.retrieveSConByCriteria.mockResolvedValue(cWithMessage);
            sAdminConRepo.findOne.mockResolvedValue(null);
            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockAdmin);
            sAdminConService.associateAdminCon.mockResolvedValue({});
            sTransformService.transformCon.mockReturnValue({});

            await service.markAsReadyAdmin(mockCurrentAdmin, 'con-123');

            expect(sAdminConService.associateAdminCon).toHaveBeenCalledWith(
                mockAdmin,
                cWithMessage,
                mockMessage,
            );
            expect(sAdminConRepo.update).not.toHaveBeenCalled();
        });

        it('should fetch conversation, admin link and user in parallel', async () => {
            const cWMessage = { ...mockConversation, lastMessage: mockMessage };

            sTransformService.markAsReadConEntities.mockReturnValue([]);
            sConsService.retrieveSConByCriteria.mockResolvedValue(cWMessage);
            sAdminConRepo.findOne.mockResolvedValue(null);
            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockAdmin);
            sAdminConService.associateAdminCon.mockResolvedValue({});
            sTransformService.transformCon.mockReturnValue({});

            await service.markAsReadyAdmin(mockCurrentAdmin, 'con-123');

            expect(sConsService.retrieveSConByCriteria).toHaveBeenCalled();
            expect(sAdminConRepo.findOne).toHaveBeenCalled();
            expect(userService.preUserService.retrieveUserByCriteria).toHaveBeenCalled();
        });

        it('should notify admin after marking as read', async () => {
            jest.useFakeTimers();
            const conWithMessage = {
                ...mockConversation,
                lastMessage: mockMessage,
            };

            sTransformService.markAsReadConEntities.mockReturnValue([]);
            sConsService.retrieveSConByCriteria.mockResolvedValue(conWithMessage);
            sAdminConRepo.findOne.mockResolvedValue(null);
            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockAdmin);
            sAdminConService.associateAdminCon.mockResolvedValue({});
            sTransformService.transformCon.mockReturnValue({});

            await service.markAsReadyAdmin(mockCurrentAdmin, 'con-123');

            jest.runAllTimers();

            expect(socketService.sendDataToUser).toHaveBeenCalledWith(
                'admin-123',
                '/supports/cons',
                SocketEventEnum.SUPPORT_CONVERSATION_UPDATED,
                expect.any(Object),
            );
        });

        it('should handle existing link with different ids', async () => {
            const conWithMessage = {
                ...mockConversation,
                lastMessage: mockMessage,
            };
            const existingLink = { id: 'link-999' };

            sTransformService.markAsReadConEntities.mockReturnValue([]);
            sConsService.retrieveSConByCriteria.mockResolvedValue(conWithMessage);
            sAdminConRepo.findOne.mockResolvedValue(existingLink);
            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockAdmin);
            sAdminConRepo.update.mockResolvedValue({ affected: 1 });
            sTransformService.transformCon.mockReturnValue({});

            await service.markAsReadyAdmin(mockCurrentAdmin, 'con-456');

            expect(sAdminConRepo.update).toHaveBeenCalledWith(
                { id: 'link-999' },
                { lastReadMessage: mockMessage },
            );
        });

        it('should handle case when lastMessage is undefined', async () => {
            const conWithoutMessage = {
                ...mockConversation,
                lastMessage: undefined,
            };
            const existingLink = { id: 'link-123' };

            sTransformService.markAsReadConEntities.mockReturnValue([]);
            sConsService.retrieveSConByCriteria.mockResolvedValue(conWithoutMessage);
            sAdminConRepo.findOne.mockResolvedValue(existingLink);
            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockAdmin);
            sAdminConRepo.update.mockResolvedValue({ affected: 1 });
            sTransformService.transformCon.mockReturnValue({});

            const result = await service.markAsReadyAdmin(mockCurrentAdmin, 'con-123');

            expect(sAdminConRepo.update).toHaveBeenCalledWith(
                { id: 'link-123' },
                { lastReadMessage: undefined },
            );
            expect(result).toEqual({ message: 'Messages read successfully' });
        });
    });

    describe('openConMessagesByUser', () => {
        const mockLastReadMessage = {
            id: 'msg-last',
            content: 'Last read',
        } as SMessagesEntity;

        it('should load initial messages for user', async () => {
            const conWithLastRead = {
                ...mockConversation,
                lastReadMessage: mockLastReadMessage,
            };
            const mockMessages = {
                messages: [mockMessage],
                hasMore: false,
                cursor: null,
            };

            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockUser);
            sTransformService.openChatEntities.mockReturnValue(['lastReadMessage']);
            sConsService.retrieveSConByCriteria.mockResolvedValue(conWithLastRead);
            sMessagesService.loadInitial.mockResolvedValue(mockMessages);

            const result = await service.openConMessagesByUser(mockCurrentUser, 'con-123', 50);

            expect(userService.preUserService.retrieveUserByCriteria).toHaveBeenCalledWith(
                { id: 'user-123' },
                ['role', 'avatar', 'avatar.file'],
            );
            expect(sConsService.retrieveSConByCriteria).toHaveBeenCalledWith({ id: 'con-123' }, [
                'lastReadMessage',
            ]);
            expect(sMessagesService.loadInitial).toHaveBeenCalledWith(
                conWithLastRead,
                mockUser,
                50,
                mockLastReadMessage,
            );
            expect(result).toEqual(mockMessages);
        });

        it('should assert chat is open', async () => {
            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockUser);
            sTransformService.openChatEntities.mockReturnValue([]);
            sConsService.retrieveSConByCriteria.mockResolvedValue(mockConversation);
            sMessagesService.loadInitial.mockResolvedValue({
                messages: [],
                hasMore: false,
                cursor: null,
            });

            const assertSpy = jest.spyOn(service, 'assertChatIsOpen');

            await service.openConMessagesByUser(mockCurrentUser, 'con-123', 20);

            expect(assertSpy).toHaveBeenCalledWith(mockConversation);
        });

        it('should throw if chat is closed', async () => {
            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockUser);
            sTransformService.openChatEntities.mockReturnValue([]);
            sConsService.retrieveSConByCriteria.mockResolvedValue(mockClosedConversation);
            errorHandler.forbidden.mockImplementation(() => {
                throw new Error('Forbidden, chat already closed');
            });

            await expect(
                service.openConMessagesByUser(mockCurrentUser, 'con-closed', 20),
            ).rejects.toThrow('Forbidden, chat already closed');
        });

        it('should handle conversation without lastReadMessage', async () => {
            const conWithoutLastRead = {
                ...mockConversation,
                lastReadMessage: undefined,
            };
            const mockMessages = { messages: [], hasMore: false, cursor: null };

            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockUser);
            sTransformService.openChatEntities.mockReturnValue([]);
            sConsService.retrieveSConByCriteria.mockResolvedValue(conWithoutLastRead);
            sMessagesService.loadInitial.mockResolvedValue(mockMessages);

            await service.openConMessagesByUser(mockCurrentUser, 'con-123', 20);

            expect(sMessagesService.loadInitial).toHaveBeenCalledWith(
                conWithoutLastRead,
                mockUser,
                20,
                undefined,
            );
        });

        it('should use openChatEntities for relations', async () => {
            const customRelations = ['lastReadMessage', 'createdBy', 'messages'];
            sTransformService.openChatEntities.mockReturnValue(customRelations);
            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockUser);
            sConsService.retrieveSConByCriteria.mockResolvedValue(mockConversation);
            sMessagesService.loadInitial.mockResolvedValue({
                messages: [],
                hasMore: false,
                cursor: null,
            });

            await service.openConMessagesByUser(mockCurrentUser, 'con-456', 30);

            expect(sConsService.retrieveSConByCriteria).toHaveBeenCalledWith(
                { id: 'con-456' },
                customRelations,
            );
        });

        it('should handle different limit values', async () => {
            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockUser);
            sTransformService.openChatEntities.mockReturnValue([]);
            sConsService.retrieveSConByCriteria.mockResolvedValue(mockConversation);
            sMessagesService.loadInitial.mockResolvedValue({
                messages: [],
                hasMore: false,
                cursor: null,
            });

            await service.openConMessagesByUser(mockCurrentUser, 'con-123', 100);

            expect(sMessagesService.loadInitial).toHaveBeenCalledWith(
                expect.any(Object),
                expect.any(Object),
                100,
                undefined,
            );
        });
    });

    describe('openConMessagesByAdmin', () => {
        const mockLastReadMessage = {
            id: 'msg-admin-last',
            content: 'Admin last read',
        } as SMessagesEntity;

        it('should load initial messages for admin', async () => {
            const mockMessages = {
                messages: [mockMessage],
                hasMore: true,
                cursor: 'cursor-123',
            };

            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockAdmin);
            sConsService.retrieveSConByCriteria.mockResolvedValue(mockConversation);
            sMessagesService.resolveAdminLastReadMessage.mockResolvedValue(mockLastReadMessage);
            sMessagesService.loadInitialForAdmin.mockResolvedValue(mockMessages);

            const result = await service.openConMessagesByAdmin(mockCurrentAdmin, 'con-123', 50);

            expect(userService.preUserService.retrieveUserByCriteria).toHaveBeenCalledWith(
                { id: 'admin-123' },
                ['role', 'avatar', 'avatar.file'],
            );
            expect(sConsService.retrieveSConByCriteria).toHaveBeenCalledWith({
                id: 'con-123',
            });
            expect(sMessagesService.resolveAdminLastReadMessage).toHaveBeenCalledWith(
                mockConversation,
                mockAdmin,
            );
            expect(sMessagesService.loadInitialForAdmin).toHaveBeenCalledWith(
                mockConversation,
                mockAdmin,
                50,
                mockLastReadMessage,
            );
            expect(result).toEqual(mockMessages);
        });

        it('should assert chat is open', async () => {
            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockAdmin);
            sConsService.retrieveSConByCriteria.mockResolvedValue(mockConversation);
            sMessagesService.resolveAdminLastReadMessage.mockResolvedValue(null);
            sMessagesService.loadInitialForAdmin.mockResolvedValue({
                messages: [],
                hasMore: false,
                cursor: null,
            });

            const assertSpy = jest.spyOn(service, 'assertChatIsOpen');

            await service.openConMessagesByAdmin(mockCurrentAdmin, 'con-123', 20);

            expect(assertSpy).toHaveBeenCalledWith(mockConversation);
        });

        it('should handle admin without last read message', async () => {
            const mockMessages = { messages: [], hasMore: false, cursor: null };

            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockAdmin);
            sConsService.retrieveSConByCriteria.mockResolvedValue(mockConversation);
            sMessagesService.resolveAdminLastReadMessage.mockResolvedValue(null);
            sMessagesService.loadInitialForAdmin.mockResolvedValue(mockMessages);

            await service.openConMessagesByAdmin(mockCurrentAdmin, 'con-123', 20);

            expect(sMessagesService.loadInitialForAdmin).toHaveBeenCalledWith(
                mockConversation,
                mockAdmin,
                20,
                null,
            );
        });

        it('should resolve admin last read message before loading', async () => {
            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockAdmin);
            sConsService.retrieveSConByCriteria.mockResolvedValue(mockConversation);
            sMessagesService.resolveAdminLastReadMessage.mockResolvedValue(mockLastReadMessage);
            sMessagesService.loadInitialForAdmin.mockResolvedValue({
                messages: [],
                hasMore: false,
                cursor: null,
            });

            await service.openConMessagesByAdmin(mockCurrentAdmin, 'con-789', 30);

            expect(sMessagesService.resolveAdminLastReadMessage).toHaveBeenCalled();
            expect(sMessagesService.loadInitialForAdmin).toHaveBeenCalledWith(
                expect.any(Object),
                expect.any(Object),
                30,
                mockLastReadMessage,
            );
        });
    });

    describe('scrollMessage', () => {
        it('should load more messages before cursor', async () => {
            const mockMessages = {
                messages: [mockMessage],
                hasMore: true,
                cursor: 'cursor-prev',
            };
            sConsService.retrieveSConByCriteria.mockResolvedValue(mockConversation);
            sMessagesService.loadMore.mockResolvedValue(mockMessages);

            const result = await service.scrollMessage('con-123', 'msg-cursor', 20, 'before');

            expect(sConsService.retrieveSConByCriteria).toHaveBeenCalledWith({
                id: 'con-123',
            });
            expect(sMessagesService.loadMore).toHaveBeenCalledWith(
                'con-123',
                'msg-cursor',
                'before',
                20,
            );
            expect(result).toEqual(mockMessages);
        });

        it('should load more messages after cursor', async () => {
            sConsService.retrieveSConByCriteria.mockResolvedValue(mockConversation);
            sMessagesService.loadMore.mockResolvedValue({
                messages: [mockMessage],
                hasMore: false,
                cursor: null,
            });

            await service.scrollMessage('con-123', 'msg-cursor', 15, 'after');

            expect(sMessagesService.loadMore).toHaveBeenCalledWith(
                'con-123',
                'msg-cursor',
                'after',
                15,
            );
        });

        it('should default to before direction', async () => {
            sConsService.retrieveSConByCriteria.mockResolvedValue(mockConversation);
            sMessagesService.loadMore.mockResolvedValue({
                messages: [],
                hasMore: false,
                cursor: null,
            });

            await service.scrollMessage('con-123', 'msg-cursor', 10);

            expect(sMessagesService.loadMore).toHaveBeenCalledWith(
                'con-123',
                'msg-cursor',
                'before',
                10,
            );
        });

        it('should handle different conversation ids', async () => {
            const differentCon = { ...mockConversation, id: 'con-999' };
            sConsService.retrieveSConByCriteria.mockResolvedValue(differentCon);
            sMessagesService.loadMore.mockResolvedValue({
                messages: [],
                hasMore: false,
                cursor: null,
            });

            await service.scrollMessage('con-999', 'msg-cursor', 25);

            expect(sConsService.retrieveSConByCriteria).toHaveBeenCalledWith({
                id: 'con-999',
            });
            expect(sMessagesService.loadMore).toHaveBeenCalledWith(
                'con-999',
                expect.any(String),
                expect.any(String),
                expect.any(Number),
            );
        });

        it('should handle different cursor ids', async () => {
            sConsService.retrieveSConByCriteria.mockResolvedValue(mockConversation);
            sMessagesService.loadMore.mockResolvedValue({
                messages: [],
                hasMore: false,
                cursor: null,
            });

            await service.scrollMessage('con-123', 'msg-999', 30, 'after');

            expect(sMessagesService.loadMore).toHaveBeenCalledWith(
                'con-123',
                'msg-999',
                'after',
                30,
            );
        });

        it('should handle different limit values', async () => {
            sConsService.retrieveSConByCriteria.mockResolvedValue(mockConversation);
            sMessagesService.loadMore.mockResolvedValue({
                messages: [],
                hasMore: true,
                cursor: 'cursor-123',
            });

            await service.scrollMessage('con-123', 'msg-cursor', 50, 'before');

            expect(sMessagesService.loadMore).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                expect.any(String),
                50,
            );
        });
    });

    describe('closeChat', () => {
        it('should close an open chat', async () => {
            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockUser);
            sConsService.retrieveSConByCriteria.mockResolvedValue(mockConversation);
            sConsService.updateCon.mockResolvedValue({ affected: 1 });
            sTransformService.conEntities.mockReturnValue(['createdBy']);
            sTransformService.transformCon.mockReturnValue({});

            const result = await service.closeChat(mockCurrentUser, 'con-123');

            expect(logger.info).toHaveBeenCalledWith(
                'Closing support chat with id: con-123 by user with id: user-123',
            );
            expect(sConsService.updateCon).toHaveBeenCalledWith(mockConversation, {
                status: SConStatusEnum.CLOSED,
            });
            expect(result).toEqual({ message: 'Chat closed successfully' });
        });

        it('should assert chat is open before closing', async () => {
            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockUser);
            sConsService.retrieveSConByCriteria.mockResolvedValue(mockConversation);
            const assertSpy = jest.spyOn(service, 'assertChatIsOpen');

            await service.closeChat(mockCurrentUser, 'con-123');

            expect(assertSpy).toHaveBeenCalledWith(mockConversation);
        });

        it('should throw if chat is already closed', async () => {
            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockUser);
            sConsService.retrieveSConByCriteria.mockResolvedValue(mockClosedConversation);
            errorHandler.forbidden.mockImplementation(() => {
                throw new Error('Forbidden, chat already closed');
            });

            await expect(service.closeChat(mockCurrentUser, 'con-closed')).rejects.toThrow(
                'Forbidden, chat already closed',
            );
        });

        it('should emit conversation update after closing', async () => {
            jest.useFakeTimers();
            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockUser);
            sConsService.retrieveSConByCriteria.mockResolvedValue(mockConversation);
            sConsService.updateCon.mockResolvedValue({ affected: 1 });
            sTransformService.transformCon.mockReturnValue({});

            await service.closeChat(mockCurrentUser, 'con-123');

            jest.runAllTimers();
            await Promise.resolve();

            expect(sConsService.emitConversationUpdate).toHaveBeenCalled();
        });

        it('should handle conversation without lastMessage', async () => {
            jest.useFakeTimers();
            const conWithoutLastMessage = {
                ...mockConversation,
                lastMessage: undefined,
            };
            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockUser);
            sConsService.retrieveSConByCriteria.mockResolvedValue(conWithoutLastMessage);
            sConsService.updateCon.mockResolvedValue({ affected: 1 });
            sTransformService.transformCon.mockReturnValue({});

            await service.closeChat(mockCurrentUser, 'con-123');

            jest.runAllTimers();

            expect(sConsService.emitConversationUpdate).toHaveBeenCalledWith(
                conWithoutLastMessage,
                undefined,
            );
        });
    });

    describe('dependency injection', () => {
        it('should have all dependencies injected', () => {
            expect(service.logger).toBeDefined();
            expect(service.sTransformService).toBeDefined();
            expect(service.sConsService).toBeDefined();
            expect(service.sMessagesService).toBeDefined();
            expect(service.sAdminConService).toBeDefined();
            expect(service.socketService).toBeDefined();
            expect(service.errorHandler).toBeDefined();
            expect(service.fileLinkService).toBeDefined();
            expect(service.sAdminConRepo).toBeDefined();
            expect(service.sMessageRepo).toBeDefined();
            expect(service.envConfigService).toBeDefined();
            expect(service.sConRepo).toBeDefined();
            expect(service.sCodeService).toBeDefined();
            expect(service.otherUtils).toBeDefined();
            expect(service.notifService).toBeDefined();
            expect(service.userService).toBeDefined();
            expect(service.mailerService).toBeDefined();
            expect(service.transformService).toBeDefined();
        });

        it('should have access to envConfigService properties', () => {
            expect(envConfigService.userSupportLink).toBe('https://app.example.com/support');
            expect(envConfigService.adminSupportLink).toBe('https://admin.example.com/support');
            expect(envConfigService.sAdminRole).toBe('superadmin');
        });
    });
});
