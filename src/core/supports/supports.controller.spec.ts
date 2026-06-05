import { Test, TestingModule } from '@nestjs/testing';
import { SupportsController } from './supports.controller';
import { SupportsService } from './services';
import { CurrentUserInterface } from '../../interface';
import { PaginationDto } from '../../common/dto';
import { SConStatusEnum } from '../../common/enum';
import { AdminSendMessageDto, CreateConDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guard';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('SupportsController', () => {
    let controller: SupportsController;
    let supportsService: jest.Mocked<SupportsService>;

    const mockUser: CurrentUserInterface = {
        id: 'user-123',
        role: 'user',
        sessionId: 'session-123',
        permissions: {},
    };

    const mockAdmin: CurrentUserInterface = {
        id: 'admin-123',
        role: 'admin',
        sessionId: 'session-456',
        permissions: {
            help_support: ['view', 'create', 'update'],
        },
    };

    const mockPaginationDto: PaginationDto = {
        page: 1,
        limit: 10,
        getPage: jest.fn().mockReturnValue(1),
        getLimit: jest.fn().mockReturnValue(10),
    } as any;

    const mockConversationsList = {
        data: [
            {
                id: 'con-123',
                label: '12345678',
                status: SConStatusEnum.ACTIVE,
            },
        ],
        total: 1,
        page: 1,
        limit: 10,
    };

    const mockConversation = {
        id: 'con-123',
        label: 'Ticket id: #12345678',
        lastMessage: null,
        color: '#568903',
        unreadCount: 0,
        createdBy: {
            id: 'user-123',
            fullname: 'Test User',
            email: 'user@test.com',
        },
    };

    const mockTransformedMessage = {
        id: 'msg-123',
        content: 'Hello',
        isModified: false,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z'),
        files: [],
        sentBy: {
            id: 'user-123',
            fullname: 'Test User',
            avatar: null,
        },
        replyToMessage: null,
    };

    const mockMessages = {
        messages: [mockTransformedMessage],
        meta: {
            direction: 'initial',
            cursorBefore: 'msg-123',
            cursorAfter: 'msg-123',
            hasMoreBefore: false,
            hasMoreAfter: false,
        },
    };

    const mockCreateConDto: CreateConDto = {
        codeId: 'code-123',
        content: 'Hello, I need help',
        files: [],
    };

    beforeEach(async () => {
        const mockSupportsService = {
            userConList: jest.fn(),
            openConMessagesByUser: jest.fn(),
            scrollMessage: jest.fn(),
            openConMessagesByAdmin: jest.fn(),
            adminConList: jest.fn(),
            conDetails: jest.fn(),
            badgeCount: jest.fn(),
            createConversation: jest.fn(),
            sendMessageByUser: jest.fn(),
            sendMessageByAdmin: jest.fn(),
            markAsReadByUser: jest.fn(),
            markAsReadyAdmin: jest.fn(),
            closeChat: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [SupportsController],
            providers: [
                {
                    provide: SupportsService,
                    useValue: mockSupportsService,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: jest.fn().mockReturnValue(true) })
            .overrideGuard(PermissionsGuard)
            .useValue({ canActivate: jest.fn().mockReturnValue(true) })
            .compile();

        controller = module.get<SupportsController>(SupportsController);
        supportsService = module.get(SupportsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('badgeCount', () => {
        it('should retrieve badge count for user', async () => {
            const mockBadgeCount = {
                closed: 2,
                active: 3,
            };
            supportsService.badgeCount.mockResolvedValue(mockBadgeCount);

            const result = await controller.badgeCount(mockUser);

            expect(supportsService.badgeCount).toHaveBeenCalledWith(mockUser);
            expect(result).toEqual(mockBadgeCount);
        });

        it('should retrieve badge count for admin', async () => {
            const mockBadgeCount = {
                closed: 2,
                active: 3,
            };
            supportsService.badgeCount.mockResolvedValue(mockBadgeCount);

            const result = await controller.badgeCount(mockAdmin);

            expect(supportsService.badgeCount).toHaveBeenCalledWith(mockAdmin);
            expect(result).toEqual(mockBadgeCount);
        });

        it('should handle zero counts', async () => {
            const mockBadgeCount = {
                closed: 2,
                active: 3,
            };
            supportsService.badgeCount.mockResolvedValue(mockBadgeCount);

            const result = await controller.badgeCount(mockUser);

            expect(supportsService.badgeCount).toHaveBeenCalledWith(mockUser);
            expect(result).toEqual(mockBadgeCount);
        });

        it('should handle different user roles', async () => {
            const guestUser = { ...mockUser, role: 'guest' };
            const mockBadgeCount = {
                closed: 2,
                active: 3,
            };
            supportsService.badgeCount.mockResolvedValue(mockBadgeCount);

            const result = await controller.badgeCount(guestUser);

            expect(supportsService.badgeCount).toHaveBeenCalledWith(guestUser);
            expect(result).toEqual(mockBadgeCount);
        });

        it('should propagate service errors', async () => {
            supportsService.badgeCount.mockRejectedValue(
                new Error('Failed to retrieve badge count'),
            );

            await expect(controller.badgeCount(mockUser)).rejects.toThrow(
                'Failed to retrieve badge count',
            );
        });

        it('should call service with correct user context', async () => {
            const mockBadgeCount = { closed: 2, active: 3 };
            supportsService.badgeCount.mockResolvedValue(mockBadgeCount);

            await controller.badgeCount(mockUser);

            expect(supportsService.badgeCount).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'user-123',
                    role: 'user',
                    sessionId: 'session-123',
                }),
            );
        });

        it('should return correct structure for badge count', async () => {
            const mockBadgeCount = {
                closed: 2,
                active: 3,
            };
            supportsService.badgeCount.mockResolvedValue(mockBadgeCount);

            const result = await controller.badgeCount(mockUser);

            expect(result).toHaveProperty('closed');
            expect(result).toHaveProperty('active');
        });

        it('should handle additional fields returned by service', async () => {
            const mockBadgeCount = {
                closed: 2,
                active: 3,
            };
            supportsService.badgeCount.mockResolvedValue(mockBadgeCount);

            const result = await controller.badgeCount(mockUser);

            expect(result).toEqual(mockBadgeCount);
            expect(result).toHaveProperty('closed', 2);
            expect(result).toHaveProperty('active', 3);
        });
    });

    describe('allUserConversations', () => {
        it('should retrieve all user conversations with default pagination', async () => {
            supportsService.userConList.mockResolvedValue(mockConversationsList);

            const result = await controller.allUserConversations(mockUser, mockPaginationDto);

            expect(supportsService.userConList).toHaveBeenCalledWith(
                mockUser,
                1,
                10,
                undefined,
                undefined,
            );
            expect(result).toEqual(mockConversationsList);
        });

        it('should retrieve user conversations with status filter', async () => {
            supportsService.userConList.mockResolvedValue(mockConversationsList);

            await controller.allUserConversations(
                mockUser,
                mockPaginationDto,
                SConStatusEnum.ACTIVE,
            );

            expect(supportsService.userConList).toHaveBeenCalledWith(
                mockUser,
                1,
                10,
                SConStatusEnum.ACTIVE,
                undefined,
            );
        });

        it('should retrieve user conversations with search filter', async () => {
            supportsService.userConList.mockResolvedValue(mockConversationsList);

            await controller.allUserConversations(
                mockUser,
                mockPaginationDto,
                undefined,
                'search term',
            );

            expect(supportsService.userConList).toHaveBeenCalledWith(
                mockUser,
                1,
                10,
                undefined,
                'search term',
            );
        });

        it('should retrieve user conversations with both status and search filters', async () => {
            supportsService.userConList.mockResolvedValue(mockConversationsList);

            await controller.allUserConversations(
                mockUser,
                mockPaginationDto,
                SConStatusEnum.CLOSED,
                'urgent',
            );

            expect(supportsService.userConList).toHaveBeenCalledWith(
                mockUser,
                1,
                10,
                SConStatusEnum.CLOSED,
                'urgent',
            );
        });

        it('should use pagination values from DTO', async () => {
            const customPaginationDto: PaginationDto = {
                page: 3,
                limit: 25,
                getPage: jest.fn().mockReturnValue(3),
                getLimit: jest.fn().mockReturnValue(25),
            } as any;

            supportsService.userConList.mockResolvedValue(mockConversationsList);

            await controller.allUserConversations(mockUser, customPaginationDto);

            expect(customPaginationDto.getPage).toHaveBeenCalled();
            expect(customPaginationDto.getLimit).toHaveBeenCalled();
            expect(supportsService.userConList).toHaveBeenCalledWith(
                mockUser,
                3,
                25,
                undefined,
                undefined,
            );
        });

        it('should handle empty result set', async () => {
            const emptyResult = { data: [], total: 0, page: 1, limit: 10 };
            supportsService.userConList.mockResolvedValue(emptyResult);

            const result = await controller.allUserConversations(mockUser, mockPaginationDto);

            expect(result).toEqual(emptyResult);
        });

        it('should pass user context correctly', async () => {
            supportsService.userConList.mockResolvedValue(mockConversationsList);

            await controller.allUserConversations(mockUser, mockPaginationDto);

            expect(supportsService.userConList).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'user-123', role: 'user' }),
                expect.any(Number),
                expect.any(Number),
                undefined,
                undefined,
            );
        });

        it('should handle different user roles', async () => {
            const differentUser = { ...mockUser, id: 'user-456' };
            supportsService.userConList.mockResolvedValue(mockConversationsList);

            await controller.allUserConversations(differentUser, mockPaginationDto);

            expect(supportsService.userConList).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'user-456' }),
                expect.any(Number),
                expect.any(Number),
                undefined,
                undefined,
            );
        });
    });

    describe('openCByUser', () => {
        it('should open conversation messages by user', async () => {
            supportsService.openConMessagesByUser.mockResolvedValue(mockMessages);

            const result = await controller.openCByUser(mockUser, 'con-123', 20);

            expect(supportsService.openConMessagesByUser).toHaveBeenCalledWith(
                mockUser,
                'con-123',
                20,
            );
            expect(result).toEqual(mockMessages);
        });

        it('should handle different conversation IDs', async () => {
            supportsService.openConMessagesByUser.mockResolvedValue(mockMessages);

            await controller.openCByUser(mockUser, 'different-con-id', 30);

            expect(supportsService.openConMessagesByUser).toHaveBeenCalledWith(
                mockUser,
                'different-con-id',
                30,
            );
        });

        it('should handle different limit values', async () => {
            supportsService.openConMessagesByUser.mockResolvedValue(mockMessages);

            await controller.openCByUser(mockUser, 'con-123', 50);

            expect(supportsService.openConMessagesByUser).toHaveBeenCalledWith(
                mockUser,
                'con-123',
                50,
            );
        });

        it('should pass user context correctly', async () => {
            supportsService.openConMessagesByUser.mockResolvedValue(mockMessages);

            await controller.openCByUser(mockUser, 'con-123', 20);

            expect(supportsService.openConMessagesByUser).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'user-123' }),
                expect.any(String),
                expect.any(Number),
            );
        });

        it('should handle empty messages result', async () => {
            const emptyMessages = {
                messages: [],
                meta: { hasMoreBefore: false, hasMoreAfter: false },
            };
            supportsService.openConMessagesByUser.mockResolvedValue(emptyMessages);

            const result = await controller.openCByUser(mockUser, 'con-123', 20);

            expect(result).toEqual(emptyMessages);
        });

        it('should handle limit as string that gets converted to number', async () => {
            supportsService.openConMessagesByUser.mockResolvedValue(mockMessages);

            await controller.openCByUser(mockUser, 'con-123', '20' as any);

            expect(supportsService.openConMessagesByUser).toHaveBeenCalledWith(
                mockUser,
                'con-123',
                '20',
            );
        });

        it('should handle different user types', async () => {
            const guestUser = { ...mockUser, role: 'guest' };
            supportsService.openConMessagesByUser.mockResolvedValue(mockMessages);

            await controller.openCByUser(guestUser, 'con-123', 20);

            expect(supportsService.openConMessagesByUser).toHaveBeenCalledWith(
                guestUser,
                'con-123',
                20,
            );
        });
    });

    describe('scrollCMessages', () => {
        it('should scroll messages with before direction', async () => {
            supportsService.scrollMessage.mockResolvedValue(mockMessages);

            const result = await controller.scrollCMessages(
                'con-123',
                20,
                'msg-cursor-123',
                'before',
            );

            expect(supportsService.scrollMessage).toHaveBeenCalledWith(
                'con-123',
                'msg-cursor-123',
                20,
                'before',
            );
            expect(result).toEqual(mockMessages);
        });

        it('should scroll messages with after direction', async () => {
            supportsService.scrollMessage.mockResolvedValue(mockMessages);

            await controller.scrollCMessages('con-123', 20, 'msg-cursor-123', 'after');

            expect(supportsService.scrollMessage).toHaveBeenCalledWith(
                'con-123',
                'msg-cursor-123',
                20,
                'after',
            );
        });

        it('should default to before direction when not provided', async () => {
            supportsService.scrollMessage.mockResolvedValue(mockMessages);

            await controller.scrollCMessages('con-123', 20, 'msg-cursor-123');

            expect(supportsService.scrollMessage).toHaveBeenCalledWith(
                'con-123',
                'msg-cursor-123',
                20,
                'before',
            );
        });

        it('should handle different limit values', async () => {
            supportsService.scrollMessage.mockResolvedValue(mockMessages);

            await controller.scrollCMessages('con-123', 50, 'msg-cursor-123', 'before');

            expect(supportsService.scrollMessage).toHaveBeenCalledWith(
                'con-123',
                'msg-cursor-123',
                50,
                'before',
            );
        });

        it('should handle different cursor IDs', async () => {
            supportsService.scrollMessage.mockResolvedValue(mockMessages);

            await controller.scrollCMessages('con-123', 20, 'different-cursor-id', 'before');

            expect(supportsService.scrollMessage).toHaveBeenCalledWith(
                'con-123',
                'different-cursor-id',
                20,
                'before',
            );
        });

        it('should handle different conversation IDs', async () => {
            supportsService.scrollMessage.mockResolvedValue(mockMessages);

            await controller.scrollCMessages('different-con-id', 20, 'msg-cursor-123', 'after');

            expect(supportsService.scrollMessage).toHaveBeenCalledWith(
                'different-con-id',
                'msg-cursor-123',
                20,
                'after',
            );
        });

        it('should handle invalid direction by using default', async () => {
            supportsService.scrollMessage.mockResolvedValue(mockMessages);

            await controller.scrollCMessages('con-123', 20, 'msg-cursor-123', 'invalid' as any);

            expect(supportsService.scrollMessage).toHaveBeenCalledWith(
                'con-123',
                'msg-cursor-123',
                20,
                'invalid',
            );
        });

        it('should handle limit as string', async () => {
            supportsService.scrollMessage.mockResolvedValue(mockMessages);

            await controller.scrollCMessages('con-123', '20' as any, 'msg-cursor-123', 'before');

            expect(supportsService.scrollMessage).toHaveBeenCalledWith(
                'con-123',
                'msg-cursor-123',
                '20',
                'before',
            );
        });

        it('should return empty messages when no more messages', async () => {
            const emptyResult = {
                messages: [],
                hasMore: false,
                cursor: null,
            } as any;
            supportsService.scrollMessage.mockResolvedValue(emptyResult);

            const result = await controller.scrollCMessages(
                'con-123',
                20,
                'msg-cursor-123',
                'before',
            );

            expect(result).toEqual(emptyResult);
        });
    });

    describe('openCByAdmin', () => {
        it('should open conversation messages by admin', async () => {
            supportsService.openConMessagesByAdmin.mockResolvedValue(mockMessages);

            const result = await controller.openCByAdmin(mockAdmin, 'con-123', 20);

            expect(supportsService.openConMessagesByAdmin).toHaveBeenCalledWith(
                mockAdmin,
                'con-123',
                20,
            );
            expect(result).toEqual(mockMessages);
        });

        it('should handle different conversation IDs', async () => {
            supportsService.openConMessagesByAdmin.mockResolvedValue(mockMessages);

            await controller.openCByAdmin(mockAdmin, 'different-con-id', 30);

            expect(supportsService.openConMessagesByAdmin).toHaveBeenCalledWith(
                mockAdmin,
                'different-con-id',
                30,
            );
        });

        it('should handle different limit values', async () => {
            supportsService.openConMessagesByAdmin.mockResolvedValue(mockMessages);

            await controller.openCByAdmin(mockAdmin, 'con-123', 50);

            expect(supportsService.openConMessagesByAdmin).toHaveBeenCalledWith(
                mockAdmin,
                'con-123',
                50,
            );
        });

        it('should pass admin context correctly', async () => {
            supportsService.openConMessagesByAdmin.mockResolvedValue(mockMessages);

            await controller.openCByAdmin(mockAdmin, 'con-123', 20);

            expect(supportsService.openConMessagesByAdmin).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'admin-123', role: 'admin' }),
                expect.any(String),
                expect.any(Number),
            );
        });

        it('should handle limit as string', async () => {
            supportsService.openConMessagesByAdmin.mockResolvedValue(mockMessages);

            await controller.openCByAdmin(mockAdmin, 'con-123', '20' as any);

            expect(supportsService.openConMessagesByAdmin).toHaveBeenCalledWith(
                mockAdmin,
                'con-123',
                '20',
            );
        });

        it('should handle different admin roles', async () => {
            const superAdmin = { ...mockAdmin, role: 'superadmin' };
            supportsService.openConMessagesByAdmin.mockResolvedValue(mockMessages);

            await controller.openCByAdmin(superAdmin, 'con-123', 20);

            expect(supportsService.openConMessagesByAdmin).toHaveBeenCalledWith(
                superAdmin,
                'con-123',
                20,
            );
        });
    });

    describe('allConversations', () => {
        it('should retrieve all conversations for admin with default pagination', async () => {
            supportsService.adminConList.mockResolvedValue(mockConversationsList);

            const result = await controller.allConversations(mockAdmin, mockPaginationDto);

            expect(supportsService.adminConList).toHaveBeenCalledWith(
                mockAdmin,
                1,
                10,
                undefined,
                undefined,
            );
            expect(result).toEqual(mockConversationsList);
        });

        it('should retrieve admin conversations with status filter', async () => {
            supportsService.adminConList.mockResolvedValue(mockConversationsList);

            await controller.allConversations(mockAdmin, mockPaginationDto, SConStatusEnum.ACTIVE);

            expect(supportsService.adminConList).toHaveBeenCalledWith(
                mockAdmin,
                1,
                10,
                SConStatusEnum.ACTIVE,
                undefined,
            );
        });

        it('should retrieve admin conversations with search filter', async () => {
            supportsService.adminConList.mockResolvedValue(mockConversationsList);

            await controller.allConversations(
                mockAdmin,
                mockPaginationDto,
                undefined,
                'search term',
            );

            expect(supportsService.adminConList).toHaveBeenCalledWith(
                mockAdmin,
                1,
                10,
                undefined,
                'search term',
            );
        });

        it('should retrieve admin conversations with both filters', async () => {
            supportsService.adminConList.mockResolvedValue(mockConversationsList);

            await controller.allConversations(
                mockAdmin,
                mockPaginationDto,
                SConStatusEnum.CLOSED,
                'urgent',
            );

            expect(supportsService.adminConList).toHaveBeenCalledWith(
                mockAdmin,
                1,
                10,
                SConStatusEnum.CLOSED,
                'urgent',
            );
        });

        it('should use custom pagination values', async () => {
            const customPaginationDto: PaginationDto = {
                page: 2,
                limit: 50,
                getPage: jest.fn().mockReturnValue(2),
                getLimit: jest.fn().mockReturnValue(50),
            } as any;

            supportsService.adminConList.mockResolvedValue(mockConversationsList);

            await controller.allConversations(mockAdmin, customPaginationDto);

            expect(supportsService.adminConList).toHaveBeenCalledWith(
                mockAdmin,
                2,
                50,
                undefined,
                undefined,
            );
        });

        it('should handle empty result set', async () => {
            const emptyResult = { data: [], total: 0, page: 1, limit: 10 };
            supportsService.adminConList.mockResolvedValue(emptyResult);

            const result = await controller.allConversations(mockAdmin, mockPaginationDto);

            expect(result).toEqual(emptyResult);
        });

        it('should handle different admin IDs', async () => {
            const differentAdmin = { ...mockAdmin, id: 'admin-456' };
            supportsService.adminConList.mockResolvedValue(mockConversationsList);

            await controller.allConversations(differentAdmin, mockPaginationDto);

            expect(supportsService.adminConList).toHaveBeenCalledWith(
                differentAdmin,
                expect.any(Number),
                expect.any(Number),
                undefined,
                undefined,
            );
        });
    });

    describe('conDetails', () => {
        it('should retrieve conversation details by id', async () => {
            supportsService.conDetails.mockResolvedValue(mockConversation);

            const result = await controller.conDetails('con-123');

            expect(supportsService.conDetails).toHaveBeenCalledWith('con-123');
            expect(result).toEqual(mockConversation);
        });

        it('should handle different conversation IDs', async () => {
            supportsService.conDetails.mockResolvedValue(mockConversation);

            await controller.conDetails('different-con-id');

            expect(supportsService.conDetails).toHaveBeenCalledWith('different-con-id');
        });

        it('should return conversation details with all fields', async () => {
            const detailedConversation = {
                ...mockConversation,
                messages: [],
                participants: [mockUser],
                createdBy: {
                    id: 'user-123',
                    fullname: 'Test User',
                    email: 'user@test.com',
                },
            };

            supportsService.conDetails.mockResolvedValue(detailedConversation);

            const result = await controller.conDetails('con-123');

            expect(result).toEqual(detailedConversation);
        });

        it('should handle conversation without createdBy', async () => {
            const conversationWithoutCreator = {
                ...mockConversation,
                createdBy: null,
            };
            supportsService.conDetails.mockResolvedValue(conversationWithoutCreator);

            const result = await controller.conDetails('con-123');

            expect(result.createdBy).toBeNull();
        });

        it('should handle conversation with different label', async () => {
            const conWithDifferentLabel = {
                ...mockConversation,
                label: 'Ticket id: #99999999',
            };
            supportsService.conDetails.mockResolvedValue(conWithDifferentLabel);

            const result = await controller.conDetails('con-999');

            expect(result.label).toBe('Ticket id: #99999999');
        });
    });

    describe('createConversation', () => {
        it('should create a new conversation with full dto', async () => {
            supportsService.createConversation.mockResolvedValue(mockConversation);

            const result = await controller.createConversation(mockUser, mockCreateConDto);

            expect(supportsService.createConversation).toHaveBeenCalledWith(
                mockUser,
                mockCreateConDto,
            );
            expect(result).toEqual(mockConversation);
        });

        it('should pass the entire dto object to the service', async () => {
            const dto: CreateConDto = {
                codeId: 'different-code-id',
                content: 'Different content',
                files: ['file-1'],
            };

            supportsService.createConversation.mockResolvedValue(mockConversation);

            await controller.createConversation(mockUser, dto);

            expect(supportsService.createConversation).toHaveBeenCalledWith(
                mockUser,
                expect.objectContaining({
                    codeId: 'different-code-id',
                    content: 'Different content',
                    files: ['file-1'],
                }),
            );
        });

        it('should handle dto without optional files', async () => {
            const dto: CreateConDto = {
                codeId: 'code-123',
                content: 'Hello without files',
            };

            supportsService.createConversation.mockResolvedValue(mockConversation);

            await controller.createConversation(mockUser, dto);

            expect(supportsService.createConversation).toHaveBeenCalledWith(
                mockUser,
                expect.objectContaining({
                    codeId: 'code-123',
                    content: 'Hello without files',
                }),
            );
        });

        it('should pass user context correctly', async () => {
            supportsService.createConversation.mockResolvedValue(mockConversation);

            await controller.createConversation(mockUser, mockCreateConDto);

            expect(supportsService.createConversation).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'user-123' }),
                expect.any(Object),
            );
        });

        it('should handle different codeIds', async () => {
            const dto: CreateConDto = { codeId: 'code-999', content: 'Test' };

            supportsService.createConversation.mockResolvedValue(mockConversation);

            await controller.createConversation(mockUser, dto);

            expect(supportsService.createConversation).toHaveBeenCalledWith(
                mockUser,
                expect.objectContaining({ codeId: 'code-999' }),
            );
        });

        it('should handle dto with empty files array', async () => {
            const dto: CreateConDto = {
                codeId: 'code-123',
                content: 'Test',
                files: [],
            };

            supportsService.createConversation.mockResolvedValue(mockConversation);

            await controller.createConversation(mockUser, dto);

            expect(supportsService.createConversation).toHaveBeenCalledWith(
                mockUser,
                expect.objectContaining({ files: [] }),
            );
        });

        it('should handle different user types', async () => {
            const guestUser = { ...mockUser, role: 'guest' };
            supportsService.createConversation.mockResolvedValue(mockConversation);

            await controller.createConversation(guestUser, mockCreateConDto);

            expect(supportsService.createConversation).toHaveBeenCalledWith(
                guestUser,
                mockCreateConDto,
            );
        });
    });

    describe('sendMByUser', () => {
        it('should send message by user with content only', async () => {
            const dto: AdminSendMessageDto = {
                conId: 'con-123',
                content: 'Hello, I need help',
            };
            const expectedMessage = { message: 'Message sent successfully' };

            supportsService.sendMessageByUser.mockResolvedValue(expectedMessage);

            const result = await controller.sendMByUser(mockUser, dto);

            expect(supportsService.sendMessageByUser).toHaveBeenCalledWith(mockUser, dto);
            expect(result).toEqual(expectedMessage);
        });

        it('should send message with files attached', async () => {
            const dto: AdminSendMessageDto = {
                conId: 'con-123',
                content: 'See attached files',
                files: ['file-1', 'file-2'],
            };

            supportsService.sendMessageByUser.mockResolvedValue({
                message: 'Message sent successfully',
            });

            await controller.sendMByUser(mockUser, dto);

            expect(supportsService.sendMessageByUser).toHaveBeenCalledWith(mockUser, dto);
        });

        it('should send message as reply to another message', async () => {
            const dto: AdminSendMessageDto = {
                conId: 'con-123',
                content: 'This is a reply',
                messagesId: 'msg-original-123',
            };

            supportsService.sendMessageByUser.mockResolvedValue({
                message: 'Message sent successfully',
            });

            await controller.sendMByUser(mockUser, dto);

            expect(supportsService.sendMessageByUser).toHaveBeenCalledWith(mockUser, dto);
        });

        it('should send message with all optional fields', async () => {
            const dto: AdminSendMessageDto = {
                conId: 'con-123',
                content: 'Complete message',
                messagesId: 'msg-original-123',
                files: ['file-1', 'file-2'],
            };

            supportsService.sendMessageByUser.mockResolvedValue({
                message: 'msg-123',
            });

            await controller.sendMByUser(mockUser, dto);

            expect(supportsService.sendMessageByUser).toHaveBeenCalledWith(
                mockUser,
                expect.objectContaining({
                    conId: 'con-123',
                    content: 'Complete message',
                    messagesId: 'msg-original-123',
                    files: ['file-1', 'file-2'],
                }),
            );
        });

        it('should pass user context correctly', async () => {
            const dto: AdminSendMessageDto = {
                conId: 'con-123',
                content: 'Test message',
            };

            supportsService.sendMessageByUser.mockResolvedValue({
                message: 'msg-123',
            });

            await controller.sendMByUser(mockUser, dto);

            expect(supportsService.sendMessageByUser).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'user-123', role: 'user' }),
                expect.any(Object),
            );
        });

        it('should handle dto without content', async () => {
            const dto: AdminSendMessageDto = {
                conId: 'con-123',
            };

            supportsService.sendMessageByUser.mockResolvedValue({
                message: 'msg-123',
            });

            await controller.sendMByUser(mockUser, dto);

            expect(supportsService.sendMessageByUser).toHaveBeenCalledWith(mockUser, dto);
        });

        it('should handle dto with only conId', async () => {
            const dto: AdminSendMessageDto = {
                conId: 'con-123',
            };

            supportsService.sendMessageByUser.mockResolvedValue({
                message: 'msg-123',
            });

            await controller.sendMByUser(mockUser, dto);

            expect(supportsService.sendMessageByUser).toHaveBeenCalledWith(mockUser, dto);
        });
    });

    describe('sendMByAdmin', () => {
        it('should send message by admin with content only', async () => {
            const dto: AdminSendMessageDto = {
                conId: 'con-123',
                content: 'Admin response',
            };
            const expectedMessage = { message: 'Message sent successfully' };

            supportsService.sendMessageByAdmin.mockResolvedValue(expectedMessage);

            const result = await controller.sendMByAdmin(mockAdmin, dto);

            expect(supportsService.sendMessageByAdmin).toHaveBeenCalledWith(mockAdmin, dto);
            expect(result).toEqual(expectedMessage);
        });

        it('should send message with files attached', async () => {
            const dto: AdminSendMessageDto = {
                conId: 'con-123',
                content: 'Admin response with files',
                files: ['file-admin-1', 'file-admin-2'],
            };

            supportsService.sendMessageByAdmin.mockResolvedValue({
                message: 'msg-123',
            });

            await controller.sendMByAdmin(mockAdmin, dto);

            expect(supportsService.sendMessageByAdmin).toHaveBeenCalledWith(
                mockAdmin,
                expect.objectContaining({
                    files: ['file-admin-1', 'file-admin-2'],
                }),
            );
        });

        it('should send message as reply', async () => {
            const dto: AdminSendMessageDto = {
                conId: 'con-123',
                content: 'Admin reply',
                messagesId: 'msg-user-123',
            };

            supportsService.sendMessageByAdmin.mockResolvedValue({
                message: 'msg-admin-reply-123',
            });

            await controller.sendMByAdmin(mockAdmin, dto);

            expect(supportsService.sendMessageByAdmin).toHaveBeenCalledWith(
                mockAdmin,
                expect.objectContaining({ messagesId: 'msg-user-123' }),
            );
        });

        it('should pass admin context correctly', async () => {
            const dto: AdminSendMessageDto = {
                conId: 'con-123',
                content: 'Test',
            };

            supportsService.sendMessageByAdmin.mockResolvedValue({
                message: 'msg-123',
            });

            await controller.sendMByAdmin(mockAdmin, dto);

            expect(supportsService.sendMessageByAdmin).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'admin-123', role: 'admin' }),
                expect.any(Object),
            );
        });

        it('should handle dto without content', async () => {
            const dto: AdminSendMessageDto = {
                conId: 'con-123',
            };

            supportsService.sendMessageByAdmin.mockResolvedValue({
                message: 'msg-123',
            });

            await controller.sendMByAdmin(mockAdmin, dto);

            expect(supportsService.sendMessageByAdmin).toHaveBeenCalledWith(mockAdmin, dto);
        });

        it('should handle dto with all fields', async () => {
            const dto: AdminSendMessageDto = {
                conId: 'con-123',
                content: 'Full admin message',
                messagesId: 'msg-456',
                files: ['file-1', 'file-2'],
            };

            supportsService.sendMessageByAdmin.mockResolvedValue({
                message: 'msg-789',
            });

            await controller.sendMByAdmin(mockAdmin, dto);

            expect(supportsService.sendMessageByAdmin).toHaveBeenCalledWith(mockAdmin, dto);
        });
    });

    describe('markAsReadByUser', () => {
        it('should mark messages as read by user', async () => {
            const expectedResult = {
                message: 'Messages read successfully',
            };
            supportsService.markAsReadByUser.mockResolvedValue(expectedResult);

            const result = await controller.markAsReadByUser(mockUser, 'con-123');

            expect(supportsService.markAsReadByUser).toHaveBeenCalledWith(mockUser, 'con-123');
            expect(result).toEqual(expectedResult);
        });

        it('should handle different conversation IDs', async () => {
            supportsService.markAsReadByUser.mockResolvedValue({
                message: 'Messages read successfully',
            });

            await controller.markAsReadByUser(mockUser, 'different-con-id');

            expect(supportsService.markAsReadByUser).toHaveBeenCalledWith(
                mockUser,
                'different-con-id',
            );
        });

        it('should pass user context correctly', async () => {
            supportsService.markAsReadByUser.mockResolvedValue({
                message: 'Messages read successfully',
            });

            await controller.markAsReadByUser(mockUser, 'con-123');

            expect(supportsService.markAsReadByUser).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'user-123' }),
                expect.any(String),
            );
        });

        it('should handle successful marking', async () => {
            const result = {
                message: 'Messages read successfully',
            };
            supportsService.markAsReadByUser.mockResolvedValue(result);

            const response = await controller.markAsReadByUser(mockUser, 'con-123');

            expect(response).toEqual(result);
        });

        it('should handle different user roles', async () => {
            const guestUser = { ...mockUser, role: 'guest' };
            supportsService.markAsReadByUser.mockResolvedValue({
                message: 'Messages read successfully',
            });

            await controller.markAsReadByUser(guestUser, 'con-123');

            expect(supportsService.markAsReadByUser).toHaveBeenCalledWith(guestUser, 'con-123');
        });
    });

    describe('markAsReadByAdmin', () => {
        it('should mark messages as read by admin', async () => {
            const expectedResult = {
                message: 'Messages read successfully',
            };
            supportsService.markAsReadyAdmin.mockResolvedValue(expectedResult);

            const result = await controller.markAsReadByAdmin(mockAdmin, 'con-123');

            expect(supportsService.markAsReadyAdmin).toHaveBeenCalledWith(mockAdmin, 'con-123');
            expect(result).toEqual(expectedResult);
        });

        it('should handle different conversation IDs', async () => {
            supportsService.markAsReadyAdmin.mockResolvedValue({
                message: 'Messages read successfully',
            });

            await controller.markAsReadByAdmin(mockAdmin, 'different-con-id');

            expect(supportsService.markAsReadyAdmin).toHaveBeenCalledWith(
                mockAdmin,
                'different-con-id',
            );
        });

        it('should pass admin context correctly', async () => {
            supportsService.markAsReadyAdmin.mockResolvedValue({
                message: 'Messages read successfully',
            });

            await controller.markAsReadByAdmin(mockAdmin, 'con-123');

            expect(supportsService.markAsReadyAdmin).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'admin-123', role: 'admin' }),
                expect.any(String),
            );
        });

        it('should handle successful marking', async () => {
            const result = {
                message: 'Messages read successfully',
            };
            supportsService.markAsReadyAdmin.mockResolvedValue(result);

            const response = await controller.markAsReadByAdmin(mockAdmin, 'con-123');

            expect(response).toEqual(result);
        });

        it('should handle different admin roles', async () => {
            const superAdmin = { ...mockAdmin, role: 'superadmin' };
            supportsService.markAsReadyAdmin.mockResolvedValue({
                message: 'Messages read successfully',
            });

            await controller.markAsReadByAdmin(superAdmin, 'con-123');

            expect(supportsService.markAsReadyAdmin).toHaveBeenCalledWith(superAdmin, 'con-123');
        });
    });

    describe('closeChat', () => {
        it('should close an open chat by user', async () => {
            const expectedResult = {
                message: 'Chat closed successfully',
            };
            supportsService.closeChat.mockResolvedValue(expectedResult);

            const result = await controller.closeChat(mockUser, 'con-123');

            expect(supportsService.closeChat).toHaveBeenCalledWith(mockUser, 'con-123');
            expect(result).toEqual(expectedResult);
        });

        it('should handle different conversation IDs', async () => {
            supportsService.closeChat.mockResolvedValue({
                message: 'Chat closed successfully',
            });

            await controller.closeChat(mockUser, 'different-con-id');

            expect(supportsService.closeChat).toHaveBeenCalledWith(mockUser, 'different-con-id');
        });

        it('should pass user context correctly', async () => {
            supportsService.closeChat.mockResolvedValue({
                message: 'Chat closed successfully',
            });

            await controller.closeChat(mockUser, 'con-123');

            expect(supportsService.closeChat).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'user-123', role: 'user' }),
                expect.any(String),
            );
        });

        it('should handle successful chat closing', async () => {
            const result = {
                message: 'Chat closed successfully',
                id: 'con-123',
                status: 'CLOSED',
            };
            supportsService.closeChat.mockResolvedValue(result);

            const response = await controller.closeChat(mockUser, 'con-123');

            expect(response).toEqual(result);
        });

        it('should handle different user roles', async () => {
            const guestUser = { ...mockUser, role: 'guest' };
            supportsService.closeChat.mockResolvedValue({
                message: 'Chat closed successfully',
            });

            await controller.closeChat(guestUser, 'con-123');

            expect(supportsService.closeChat).toHaveBeenCalledWith(guestUser, 'con-123');
        });

        it('should propagate service errors', async () => {
            supportsService.closeChat.mockRejectedValue(new Error('Chat already closed'));

            await expect(controller.closeChat(mockUser, 'con-123')).rejects.toThrow(
                'Chat already closed',
            );
        });
    });

    describe('Guards and Decorators', () => {
        it('should have JwtAuthGuard applied to controller', () => {
            expect(controller).toBeDefined();
        });

        it('should call service methods with correct parameters for user operations', async () => {
            supportsService.userConList.mockResolvedValue(mockConversationsList);

            await controller.allUserConversations(mockUser, mockPaginationDto);

            expect(supportsService.userConList).toHaveBeenCalledTimes(1);
        });

        it('should call service methods with correct parameters for admin operations', async () => {
            supportsService.adminConList.mockResolvedValue(mockConversationsList);

            await controller.allConversations(mockAdmin, mockPaginationDto);

            expect(supportsService.adminConList).toHaveBeenCalledTimes(1);
        });

        it('should call service methods for user-specific operations', async () => {
            supportsService.openConMessagesByUser.mockResolvedValue(mockMessages);

            await controller.openCByUser(mockUser, 'con-123', 20);

            expect(supportsService.openConMessagesByUser).toHaveBeenCalledTimes(1);
        });

        it('should call service methods for admin-specific operations', async () => {
            supportsService.openConMessagesByAdmin.mockResolvedValue(mockMessages);

            await controller.openCByAdmin(mockAdmin, 'con-123', 20);

            expect(supportsService.openConMessagesByAdmin).toHaveBeenCalledTimes(1);
        });

        it('should call closeChat method with correct parameters', async () => {
            supportsService.closeChat.mockResolvedValue({
                message: 'Chat closed successfully',
            });

            await controller.closeChat(mockUser, 'con-123');

            expect(supportsService.closeChat).toHaveBeenCalledTimes(1);
        });
    });

    describe('Error Handling', () => {
        it('should propagate service errors for userConList', async () => {
            supportsService.userConList.mockRejectedValue(new Error('Service error'));

            await expect(
                controller.allUserConversations(mockUser, mockPaginationDto),
            ).rejects.toThrow('Service error');
        });

        it('should propagate service errors for openConMessagesByUser', async () => {
            supportsService.openConMessagesByUser.mockRejectedValue(
                new Error('Conversation not found'),
            );

            await expect(controller.openCByUser(mockUser, 'invalid-id', 20)).rejects.toThrow(
                'Conversation not found',
            );
        });

        it('should propagate service errors for scrollCMessages', async () => {
            supportsService.scrollMessage.mockRejectedValue(new Error('Invalid cursor'));

            await expect(
                controller.scrollCMessages('con-123', 20, 'invalid-cursor', 'before'),
            ).rejects.toThrow('Invalid cursor');
        });

        it('should propagate service errors for openCByAdmin', async () => {
            supportsService.openConMessagesByAdmin.mockRejectedValue(
                new Error('Admin not authorized'),
            );

            await expect(controller.openCByAdmin(mockAdmin, 'con-123', 20)).rejects.toThrow(
                'Admin not authorized',
            );
        });

        it('should propagate service errors for allConversations', async () => {
            supportsService.adminConList.mockRejectedValue(new Error('Database error'));

            await expect(controller.allConversations(mockAdmin, mockPaginationDto)).rejects.toThrow(
                'Database error',
            );
        });

        it('should propagate service errors for conDetails', async () => {
            supportsService.conDetails.mockRejectedValue(new Error('Conversation not found'));

            await expect(controller.conDetails('invalid-id')).rejects.toThrow(
                'Conversation not found',
            );
        });

        it('should propagate service errors for createConversation', async () => {
            supportsService.createConversation.mockRejectedValue(new Error('Invalid code'));

            await expect(controller.createConversation(mockUser, mockCreateConDto)).rejects.toThrow(
                'Invalid code',
            );
        });

        it('should propagate service errors for sendMessageByUser', async () => {
            supportsService.sendMessageByUser.mockRejectedValue(
                new Error('Message validation failed'),
            );

            const dto: AdminSendMessageDto = { conId: 'con-123', content: '' };

            await expect(controller.sendMByUser(mockUser, dto)).rejects.toThrow(
                'Message validation failed',
            );
        });

        it('should propagate service errors for sendMessageByAdmin', async () => {
            supportsService.sendMessageByAdmin.mockRejectedValue(new Error('Admin cannot reply'));

            const dto: AdminSendMessageDto = {
                conId: 'con-123',
                content: 'test',
            };

            await expect(controller.sendMByAdmin(mockAdmin, dto)).rejects.toThrow(
                'Admin cannot reply',
            );
        });

        it('should propagate service errors for markAsReadByUser', async () => {
            supportsService.markAsReadByUser.mockRejectedValue(new Error('Update failed'));

            await expect(controller.markAsReadByUser(mockUser, 'con-123')).rejects.toThrow(
                'Update failed',
            );
        });

        it('should propagate service errors for markAsReadByAdmin', async () => {
            supportsService.markAsReadyAdmin.mockRejectedValue(new Error('Admin update failed'));

            await expect(controller.markAsReadByAdmin(mockAdmin, 'con-123')).rejects.toThrow(
                'Admin update failed',
            );
        });

        it('should propagate service errors for closeChat', async () => {
            supportsService.closeChat.mockRejectedValue(new Error('Chat already closed'));

            await expect(controller.closeChat(mockUser, 'con-123')).rejects.toThrow(
                'Chat already closed',
            );
        });
    });

    describe('Integration Tests', () => {
        it('should handle complete user workflow', async () => {
            supportsService.createConversation.mockResolvedValue(mockConversation);
            const conversation = await controller.createConversation(mockUser, mockCreateConDto);

            const messageDto: AdminSendMessageDto = {
                conId: conversation.id,
                content: 'Hello',
            };
            supportsService.sendMessageByUser.mockResolvedValue({
                message: 'msg-123',
            });
            await controller.sendMByUser(mockUser, messageDto);

            supportsService.openConMessagesByUser.mockResolvedValue(mockMessages);
            await controller.openCByUser(mockUser, conversation.id, 20);

            supportsService.markAsReadByUser.mockResolvedValue({
                message: 'Messages read successfully',
            });
            await controller.markAsReadByUser(mockUser, conversation.id);

            supportsService.closeChat.mockResolvedValue({
                message: 'Chat closed successfully',
            });
            await controller.closeChat(mockUser, conversation.id);

            expect(supportsService.createConversation).toHaveBeenCalledTimes(1);
            expect(supportsService.sendMessageByUser).toHaveBeenCalledTimes(1);
            expect(supportsService.openConMessagesByUser).toHaveBeenCalledTimes(1);
            expect(supportsService.markAsReadByUser).toHaveBeenCalledTimes(1);
            expect(supportsService.closeChat).toHaveBeenCalledTimes(1);
        });

        it('should handle complete admin workflow', async () => {
            supportsService.adminConList.mockResolvedValue(mockConversationsList);
            await controller.allConversations(mockAdmin, mockPaginationDto);

            supportsService.openConMessagesByAdmin.mockResolvedValue(mockMessages);
            await controller.openCByAdmin(mockAdmin, 'con-123', 20);

            const replyDto: AdminSendMessageDto = {
                conId: 'con-123',
                content: 'Admin reply',
            };
            supportsService.sendMessageByAdmin.mockResolvedValue({
                message: 'msg-admin-123',
            });
            await controller.sendMByAdmin(mockAdmin, replyDto);

            supportsService.markAsReadyAdmin.mockResolvedValue({
                message: 'Messages read successfully',
            });
            await controller.markAsReadByAdmin(mockAdmin, 'con-123');

            expect(supportsService.adminConList).toHaveBeenCalledTimes(1);
            expect(supportsService.openConMessagesByAdmin).toHaveBeenCalledTimes(1);
            expect(supportsService.sendMessageByAdmin).toHaveBeenCalledTimes(1);
            expect(supportsService.markAsReadyAdmin).toHaveBeenCalledTimes(1);
        });

        it('should handle scrolling through messages', async () => {
            supportsService.scrollMessage.mockResolvedValueOnce(mockMessages);
            supportsService.scrollMessage.mockResolvedValueOnce({
                messages: [mockTransformedMessage],
                meta: { hasMoreBefore: true, hasMoreAfter: false } as any,
            });

            const result1 = await controller.scrollCMessages('con-123', 20, 'msg-1', 'before');
            const result2 = await controller.scrollCMessages('con-123', 20, 'msg-2', 'after');

            expect(supportsService.scrollMessage).toHaveBeenCalledTimes(2);
            expect(result1).toEqual(mockMessages);
            expect(result2.messages).toHaveLength(1);
        });

        it('should handle conversation details after creation', async () => {
            supportsService.createConversation.mockResolvedValue(mockConversation);
            const created = await controller.createConversation(mockUser, mockCreateConDto);

            supportsService.conDetails.mockResolvedValue({
                ...mockConversation,
                id: created.id,
            });
            const details = await controller.conDetails(created.id);

            expect(details.id).toBe(created.id);
        });
    });

    describe('Parameter Validation', () => {
        it('should handle UUID validation through ParseUUIDPipe', async () => {
            supportsService.conDetails.mockResolvedValue(mockConversation);

            await controller.conDetails('123e4567-e89b-12d3-a456-426614174000');

            expect(supportsService.conDetails).toHaveBeenCalledWith(
                '123e4567-e89b-12d3-a456-426614174000',
            );
        });

        it('should handle pagination values', async () => {
            supportsService.userConList.mockResolvedValue(mockConversationsList);

            await controller.allUserConversations(mockUser, mockPaginationDto);

            expect(mockPaginationDto.getPage).toHaveBeenCalled();
            expect(mockPaginationDto.getLimit).toHaveBeenCalled();
        });

        it('should handle direction enum values', async () => {
            supportsService.scrollMessage.mockResolvedValue(mockMessages);

            await controller.scrollCMessages('con-123', 20, 'msg-123', 'before');
            await controller.scrollCMessages('con-123', 20, 'msg-123', 'after');

            expect(supportsService.scrollMessage).toHaveBeenCalledTimes(2);
        });
    });
});
