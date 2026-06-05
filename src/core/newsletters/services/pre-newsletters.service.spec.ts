import { Test, TestingModule } from '@nestjs/testing';
import { PreNewslettersService } from './pre-newsletters.service';
import { NewslettersService } from './newsletters.service';
import { NewsletterEntity } from '../entities/newsletter.entity';
import {
    NewsletterAudienceEnum,
    NewsletterChannelEnum,
    NewsletterSendModeEnum,
    NewsletterStatusEnum,
    NotificationSubjectTypeEnum,
    SocketEventEnum,
    UserStatusEnum,
} from '../../../common/enum';
import { UserEntity } from '../../users/entities/user.entity';
import { In } from 'typeorm';

describe('PreNewslettersService', () => {
    let service: PreNewslettersService;
    let newslettersService: jest.Mocked<NewslettersService>;

    const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
    };

    const mockUserRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
    };

    const mockNotifService = {
        createNotification: jest.fn(),
        sendNotificationToUsers: jest.fn(),
    };

    const mockMailerService = {
        sendMail: jest.fn(),
    };

    const mockConfig = {
        userRole: 'user',
        sAdminRole: 'super-admin',
    };

    const mockRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const mockNewsletterRepo = {
        getRepository: jest.fn().mockReturnValue(mockRepository),
        findActiveOne: jest.fn(),
        assertUniqueActive: jest.fn(),
        update: jest.fn(),
    };

    const mockOtherUtils = {
        formatCriteria: jest.fn(),
        buildEmailTemplate: jest.fn(),
    };

    const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    };

    const mockErrorHandler = {
        notFound: jest.fn(),
        validation: jest.fn(),
        fail: jest.fn(),
        forbidden: jest.fn(),
    };

    const mockCacheService = {
        deleteKeysByBase: jest.fn(),
    };

    const mockSocketService = {
        sendDataToRoute: jest.fn(),
    };

    const mockNewsletterQueue = {
        getJob: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PreNewslettersService,
                {
                    provide: NewslettersService,
                    useValue: {
                        newLetterRepo: mockNewsletterRepo,
                        otherUtils: mockOtherUtils,
                        logger: mockLogger,
                        errorHandler: mockErrorHandler,
                        cacheService: mockCacheService,
                        socketService: mockSocketService,
                        transformNewsLetter: jest.fn(),
                        userRepository: mockUserRepository,
                        notifService: mockNotifService,
                        mailerService: mockMailerService,
                        config: mockConfig,
                        newsletterQueue: mockNewsletterQueue,
                    },
                },
            ],
        }).compile();

        service = module.get<PreNewslettersService>(PreNewslettersService);
        newslettersService = module.get(NewslettersService) as jest.Mocked<NewslettersService>;

        jest.clearAllMocks();
        mockNewsletterRepo.getRepository.mockReturnValue(mockRepository);
        mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.andWhere.mockReturnThis();
        mockQueryBuilder.orderBy.mockReturnThis();
        mockQueryBuilder.skip.mockReturnThis();
        mockQueryBuilder.take.mockReturnThis();
        mockQueryBuilder.where.mockReturnThis();
        mockQueryBuilder.leftJoinAndSelect.mockReturnThis();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('buildNLettersQuery', () => {
        it('should build query with channel filter only', () => {
            const filters = { channel: NewsletterChannelEnum.EMAIL };

            const result = service.buildNLettersQuery(filters);

            expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('news');
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('news.deleted = false');
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('news.channel = :channel', {
                channel: NewsletterChannelEnum.EMAIL,
            });
            expect(result).toBe(mockQueryBuilder);
        });

        it('should build query with channel and status filters', () => {
            const filters = {
                channel: NewsletterChannelEnum.EMAIL,
                status: NewsletterStatusEnum.DRAFT,
            };

            service.buildNLettersQuery(filters);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('news.status = :status', {
                status: NewsletterStatusEnum.DRAFT,
            });
        });

        it('should build query with all filters including searchTerm', () => {
            const filters = {
                channel: NewsletterChannelEnum.EMAIL,
                status: NewsletterStatusEnum.DRAFT,
                searchTerm: 'test search',
            };

            service.buildNLettersQuery(filters);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                expect.stringContaining('news.label ILIKE :searchTerm'),
                { searchTerm: '%test search%' },
            );
        });

        it('should build query without optional filters', () => {
            const filters = { channel: NewsletterChannelEnum.EMAIL };

            service.buildNLettersQuery(filters);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2);
        });

        it('should convert searchTerm to lowercase', () => {
            const filters = {
                channel: NewsletterChannelEnum.EMAIL,
                searchTerm: 'TEST SEARCH',
            };

            service.buildNLettersQuery(filters);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(expect.any(String), {
                searchTerm: '%test search%',
            });
        });
    });

    describe('retrieveNewsLettersQuery', () => {
        it('should build paginated query with ordering', () => {
            const filters = { channel: NewsletterChannelEnum.EMAIL };

            const result = service.retrieveNewsLettersQuery(10, 20, filters);

            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('news.updatedAt', 'DESC');
            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
            expect(result).toBe(mockQueryBuilder);
        });

        it('should handle zero offset', () => {
            const filters = { channel: NewsletterChannelEnum.EMAIL };

            service.retrieveNewsLettersQuery(0, 10, filters);

            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
        });
    });

    describe('retrieveNewLetterByCriteria', () => {
        it('should retrieve newsletter successfully', async () => {
            const criteria = { id: '123' };
            const mockNewsletter = new NewsletterEntity();
            mockOtherUtils.formatCriteria.mockReturnValue('id: 123');
            mockNewsletterRepo.findActiveOne.mockResolvedValue(mockNewsletter);

            const result = await service.retrieveNewLetterByCriteria(criteria);

            expect(mockOtherUtils.formatCriteria).toHaveBeenCalledWith(criteria);
            expect(mockLogger.info).toHaveBeenCalledWith('Finding a new letter by id: 123');
            expect(mockNewsletterRepo.findActiveOne).toHaveBeenCalledWith(
                mockNewsletterRepo,
                criteria,
            );
            expect(result).toBe(mockNewsletter);
        });

        it('should call notFound when newsletter does not exist', async () => {
            const criteria = { id: '123' };
            mockOtherUtils.formatCriteria.mockReturnValue('id: 123');
            mockNewsletterRepo.findActiveOne.mockResolvedValue(null);

            await service.retrieveNewLetterByCriteria(criteria);

            expect(mockErrorHandler.notFound).toHaveBeenCalledWith(
                'Newsletter not found with entry id: 123',
                'Newsletter not found',
            );
        });
    });

    describe('buildNewLetterEntity', () => {
        it('should build newsletter entities with required and optional fields', () => {
            const required = {
                label: 'Test Newsletter',
                content: 'Test Content',
                status: NewsletterStatusEnum.DRAFT,
                channel: NewsletterChannelEnum.EMAIL,
                sendMode: NewsletterSendModeEnum.MANUAL,
                audience: NewsletterAudienceEnum.ALL_USERS,
            };
            const optional = { scheduledAt: new Date('2025-12-31') };

            const result = service.buildNewLetterEntity(required, optional);

            expect(result).toBeInstanceOf(NewsletterEntity);
            expect(result.label).toBe('Test Newsletter');
            expect(result.content).toBe('Test Content');
            expect(result.status).toBe(NewsletterStatusEnum.DRAFT);
            expect(result.channel).toBe(NewsletterChannelEnum.EMAIL);
            expect(result.sendMode).toBe(NewsletterSendModeEnum.MANUAL);
            expect(result.audience).toBe(NewsletterAudienceEnum.ALL_USERS);
            expect(result.scheduledAt).toEqual(new Date('2025-12-31'));
        });

        it('should build newsletter entities with only required fields', () => {
            const required = {
                label: 'Test Newsletter',
                content: 'Test Content',
                status: NewsletterStatusEnum.DRAFT,
                channel: NewsletterChannelEnum.EMAIL,
                sendMode: NewsletterSendModeEnum.MANUAL,
                audience: NewsletterAudienceEnum.ALL_USERS,
            };

            const result = service.buildNewLetterEntity(required, {});

            expect(result).toBeInstanceOf(NewsletterEntity);
            expect(result.scheduledAt).toBeUndefined();
        });
    });

    describe('updateNewsLetter', () => {
        let mockNewsletter: NewsletterEntity;

        beforeEach(() => {
            mockNewsletter = new NewsletterEntity();
            mockNewsletter.id = '123';
        });

        it('should return message when no updates provided', async () => {
            const result = await service.updateNewsLetter(mockNewsletter);

            expect(result).toEqual({ message: 'No newsLetter updates provided for ads' });
            expect(mockNewsletterRepo.update).not.toHaveBeenCalled();
        });

        it('should return message when empty updates object provided', async () => {
            const result = await service.updateNewsLetter(mockNewsletter, {});

            expect(result).toEqual({ message: 'No newsLetter updates provided for ads' });
            expect(mockNewsletterRepo.update).not.toHaveBeenCalled();
        });

        it('should update string fields after trimming', async () => {
            await service.updateNewsLetter(mockNewsletter, {
                label: '  Updated Label  ',
                content: '  Updated Content  ',
            });

            expect(mockNewsletterRepo.update).toHaveBeenCalledWith(
                { id: '123' },
                { label: 'Updated Label', content: 'Updated Content' },
            );
        });

        it('should skip whitespace-only string fields', async () => {
            await service.updateNewsLetter(mockNewsletter, {
                label: '   ',
                content: 'Valid Content',
            });

            expect(mockNewsletterRepo.update).toHaveBeenCalledWith(
                { id: '123' },
                { content: 'Valid Content' },
            );
        });

        it('should update non-string fields', async () => {
            const scheduledAt = new Date('2025-12-31');
            await service.updateNewsLetter(mockNewsletter, {
                status: NewsletterStatusEnum.PENDING,
                channel: NewsletterChannelEnum.NOTIFICATION,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                audience: NewsletterAudienceEnum.CUSTOM_LIST,
                scheduledAt,
            });

            expect(mockNewsletterRepo.update).toHaveBeenCalledWith(
                { id: '123' },
                {
                    status: NewsletterStatusEnum.PENDING,
                    channel: NewsletterChannelEnum.NOTIFICATION,
                    sendMode: NewsletterSendModeEnum.IMMEDIATE,
                    audience: NewsletterAudienceEnum.CUSTOM_LIST,
                    scheduledAt,
                },
            );
        });

        it('should update both string and non-string fields together', async () => {
            await service.updateNewsLetter(mockNewsletter, {
                label: 'New Label',
                status: NewsletterStatusEnum.SCHEDULED,
            });

            expect(mockNewsletterRepo.update).toHaveBeenCalledWith(
                { id: '123' },
                { label: 'New Label', status: NewsletterStatusEnum.SCHEDULED },
            );
        });
    });

    describe('ensureLabelUnique', () => {
        it('should pass when label is unique', async () => {
            mockNewsletterRepo.assertUniqueActive.mockResolvedValue(undefined);

            await service.ensureLabelUnique('Unique Label');

            expect(mockNewsletterRepo.assertUniqueActive).toHaveBeenCalledWith(
                mockNewsletterRepo,
                {},
                { label: 'Unique Label' },
                'News letter',
            );
        });

        it('should throw validation error when label is not unique', async () => {
            const errors = { label: 'Label already exists' };
            mockNewsletterRepo.assertUniqueActive.mockImplementation((_repo, errObj) => {
                Object.assign(errObj, errors);
            });
            mockErrorHandler.validation.mockImplementation(() => {
                throw new Error('Validation failed');
            });

            await expect(service.ensureLabelUnique('Duplicate Label')).rejects.toThrow(
                'Validation failed',
            );
            expect(mockErrorHandler.validation).toHaveBeenCalledWith(errors);
        });
    });

    describe('ensureLabelUniqueForUpdate', () => {
        let mockNewsletter: NewsletterEntity;

        beforeEach(() => {
            mockNewsletter = new NewsletterEntity();
            mockNewsletter.id = '123';
        });

        it('should pass when label is unique for update', async () => {
            mockNewsletterRepo.assertUniqueActive.mockResolvedValue(undefined);

            await service.ensureLabelUniqueForUpdate('Updated Label', mockNewsletter);

            expect(mockNewsletterRepo.assertUniqueActive).toHaveBeenCalledWith(
                mockNewsletterRepo,
                {},
                { label: 'Updated Label' },
                'News letter',
                '123',
            );
        });

        it('should throw validation error when label is not unique for update', async () => {
            const errors = { label: 'Label already exists' };
            mockNewsletterRepo.assertUniqueActive.mockImplementation((_repo, errObj) => {
                Object.assign(errObj, errors);
            });
            mockErrorHandler.validation.mockImplementation(() => {
                throw new Error('Validation failed');
            });

            await expect(
                service.ensureLabelUniqueForUpdate('Duplicate Label', mockNewsletter),
            ).rejects.toThrow('Validation failed');
            expect(mockErrorHandler.validation).toHaveBeenCalledWith(errors);
        });
    });

    describe('scheduleInvalidateNewsCache', () => {
        it('should delete cache keys with newsletter base', async () => {
            mockCacheService.deleteKeysByBase.mockResolvedValue(undefined);

            await service.scheduleInvalidateNewsCache();

            expect(mockCacheService.deleteKeysByBase).toHaveBeenCalledWith('newsletter');
        });
    });

    describe('notifyAdsChange', () => {
        it('should send newsletter change notification via socket', () => {
            const mockNewsletter = new NewsletterEntity();
            const transformedData = { id: '123', label: 'Test' } as any;
            newslettersService.transformNewsLetter.mockReturnValue(transformedData);

            service.notifyAdsChange(mockNewsletter, SocketEventEnum.NEW_LETTER_CREATED);

            expect(newslettersService.transformNewsLetter).toHaveBeenCalledWith(mockNewsletter);
            expect(mockSocketService.sendDataToRoute).toHaveBeenCalledWith(
                '/newsletter',
                SocketEventEnum.NEW_LETTER_CREATED,
                { payload: [transformedData] },
            );
        });
    });

    describe('validateStatusConstraints', () => {
        describe('DRAFT status', () => {
            it('should pass for DRAFT with MANUAL send mode and no schedule', () => {
                expect(() =>
                    service.validateStatusConstraints({
                        status: NewsletterStatusEnum.DRAFT,
                        sendMode: NewsletterSendModeEnum.MANUAL,
                    }),
                ).not.toThrow();
            });

            it('should throw for DRAFT with non-MANUAL send mode', () => {
                mockErrorHandler.validation.mockImplementation(() => {
                    throw new Error('Validation failed');
                });

                expect(() =>
                    service.validateStatusConstraints({
                        status: NewsletterStatusEnum.DRAFT,
                        sendMode: NewsletterSendModeEnum.IMMEDIATE,
                    }),
                ).toThrow('Validation failed');

                expect(mockErrorHandler.validation).toHaveBeenCalledWith({
                    sendMode: 'DRAFT newsletters must use MANUAL send mode',
                });
            });

            it('should throw for DRAFT with a scheduledAt date', () => {
                mockErrorHandler.validation.mockImplementation(() => {
                    throw new Error('Validation failed');
                });

                expect(() =>
                    service.validateStatusConstraints({
                        status: NewsletterStatusEnum.DRAFT,
                        sendMode: NewsletterSendModeEnum.MANUAL,
                        scheduledAt: new Date('2025-12-31'),
                    }),
                ).toThrow('Validation failed');

                expect(mockErrorHandler.validation).toHaveBeenCalledWith({
                    scheduledAt: 'DRAFT newsletters cannot be scheduled',
                });
            });
        });

        describe('SCHEDULED status', () => {
            it('should pass for SCHEDULED with SCHEDULED send mode and a future date', () => {
                const futureDate = new Date(Date.now() + 86_400_000);

                expect(() =>
                    service.validateStatusConstraints({
                        status: NewsletterStatusEnum.SCHEDULED,
                        sendMode: NewsletterSendModeEnum.SCHEDULED,
                        scheduledAt: futureDate,
                    }),
                ).not.toThrow();
            });

            it('should throw for SCHEDULED with non-SCHEDULED send mode', () => {
                mockErrorHandler.validation.mockImplementation(() => {
                    throw new Error('Validation failed');
                });
                const futureDate = new Date(Date.now() + 86_400_000);

                expect(() =>
                    service.validateStatusConstraints({
                        status: NewsletterStatusEnum.SCHEDULED,
                        sendMode: NewsletterSendModeEnum.MANUAL,
                        scheduledAt: futureDate,
                    }),
                ).toThrow('Validation failed');

                expect(mockErrorHandler.validation).toHaveBeenCalledWith({
                    sendMode: 'SCHEDULED newsletters must use SCHEDULED send mode',
                });
            });

            it('should throw for SCHEDULED without scheduledAt', () => {
                mockErrorHandler.validation.mockImplementation(() => {
                    throw new Error('Validation failed');
                });

                expect(() =>
                    service.validateStatusConstraints({
                        status: NewsletterStatusEnum.SCHEDULED,
                        sendMode: NewsletterSendModeEnum.SCHEDULED,
                    }),
                ).toThrow('Validation failed');

                expect(mockErrorHandler.validation).toHaveBeenCalledWith({
                    scheduledAt: 'scheduledAt is required for SCHEDULED newsletters',
                });
            });

            it('should throw for SCHEDULED with a past date', () => {
                mockErrorHandler.validation.mockImplementation(() => {
                    throw new Error('Validation failed');
                });
                const pastDate = new Date(Date.now() - 86_400_000);

                expect(() =>
                    service.validateStatusConstraints({
                        status: NewsletterStatusEnum.SCHEDULED,
                        sendMode: NewsletterSendModeEnum.SCHEDULED,
                        scheduledAt: pastDate,
                    }),
                ).toThrow('Validation failed');

                expect(mockErrorHandler.validation).toHaveBeenCalledWith({
                    scheduledAt: 'scheduledAt must be a future date',
                });
            });
        });

        describe('PENDING status', () => {
            it('should pass for PENDING with IMMEDIATE send mode and no schedule', () => {
                expect(() =>
                    service.validateStatusConstraints({
                        status: NewsletterStatusEnum.PENDING,
                        sendMode: NewsletterSendModeEnum.IMMEDIATE,
                    }),
                ).not.toThrow();
            });

            it('should throw for PENDING with non-IMMEDIATE send mode', () => {
                mockErrorHandler.validation.mockImplementation(() => {
                    throw new Error('Validation failed');
                });

                expect(() =>
                    service.validateStatusConstraints({
                        status: NewsletterStatusEnum.PENDING,
                        sendMode: NewsletterSendModeEnum.MANUAL,
                    }),
                ).toThrow('Validation failed');

                expect(mockErrorHandler.validation).toHaveBeenCalledWith({
                    sendMode: 'PENDING newsletters must use IMMEDIATE send mode',
                });
            });

            it('should throw for PENDING with a scheduledAt date', () => {
                mockErrorHandler.validation.mockImplementation(() => {
                    throw new Error('Validation failed');
                });

                expect(() =>
                    service.validateStatusConstraints({
                        status: NewsletterStatusEnum.PENDING,
                        sendMode: NewsletterSendModeEnum.IMMEDIATE,
                        scheduledAt: new Date('2025-12-31'),
                    }),
                ).toThrow('Validation failed');

                expect(mockErrorHandler.validation).toHaveBeenCalledWith({
                    scheduledAt: 'PENDING newsletters cannot be scheduled',
                });
            });
        });

        describe('SENT status', () => {
            it('should pass for SENT without a schedule', () => {
                expect(() =>
                    service.validateStatusConstraints({
                        status: NewsletterStatusEnum.SENT,
                        sendMode: NewsletterSendModeEnum.IMMEDIATE,
                    }),
                ).not.toThrow();
            });

            it('should throw for SENT with a scheduledAt date', () => {
                mockErrorHandler.validation.mockImplementation(() => {
                    throw new Error('Validation failed');
                });

                expect(() =>
                    service.validateStatusConstraints({
                        status: NewsletterStatusEnum.SENT,
                        sendMode: NewsletterSendModeEnum.IMMEDIATE,
                        scheduledAt: new Date('2025-12-31'),
                    }),
                ).toThrow('Validation failed');

                expect(mockErrorHandler.validation).toHaveBeenCalledWith({
                    scheduledAt: 'SENT newsletters cannot be scheduled',
                });
            });
        });

        describe('FAILED status', () => {
            it('should pass for FAILED without a schedule', () => {
                expect(() =>
                    service.validateStatusConstraints({
                        status: NewsletterStatusEnum.FAILED,
                        sendMode: NewsletterSendModeEnum.IMMEDIATE,
                    }),
                ).not.toThrow();
            });

            it('should throw for FAILED with a scheduledAt date', () => {
                mockErrorHandler.validation.mockImplementation(() => {
                    throw new Error('Validation failed');
                });

                expect(() =>
                    service.validateStatusConstraints({
                        status: NewsletterStatusEnum.FAILED,
                        sendMode: NewsletterSendModeEnum.IMMEDIATE,
                        scheduledAt: new Date('2025-12-31'),
                    }),
                ).toThrow('Validation failed');

                expect(mockErrorHandler.validation).toHaveBeenCalledWith({
                    scheduledAt: 'FAILED newsletters cannot be scheduled',
                });
            });
        });

        describe('Unhandled status', () => {
            it('should throw a plain Error for an unknown status', () => {
                expect(() =>
                    service.validateStatusConstraints({
                        status: 'UNKNOWN_STATUS' as NewsletterStatusEnum,
                        sendMode: NewsletterSendModeEnum.MANUAL,
                    }),
                ).toThrow('Unhandled status: UNKNOWN_STATUS');
            });
        });
    });

    describe('resolveStatus', () => {
        it('should return DRAFT when status is explicitly DRAFT', () => {
            expect(
                service.resolveStatus({
                    status: NewsletterStatusEnum.DRAFT,
                    scheduledAt: null,
                    sendMode: null,
                }),
            ).toBe(NewsletterStatusEnum.DRAFT);
        });

        it('should return SCHEDULED when scheduledAt is provided', () => {
            expect(
                service.resolveStatus({
                    status: null,
                    scheduledAt: new Date(Date.now() + 86_400_000),
                    sendMode: null,
                }),
            ).toBe(NewsletterStatusEnum.SCHEDULED);
        });

        it('should return PENDING when sendMode is MANUAL', () => {
            expect(
                service.resolveStatus({
                    status: null,
                    scheduledAt: null,
                    sendMode: NewsletterSendModeEnum.MANUAL,
                }),
            ).toBe(NewsletterStatusEnum.PENDING);
        });

        it('should return SENT when sendMode is IMMEDIATE', () => {
            expect(
                service.resolveStatus({
                    status: null,
                    scheduledAt: null,
                    sendMode: NewsletterSendModeEnum.IMMEDIATE,
                }),
            ).toBe(NewsletterStatusEnum.SENT);
        });

        it('should return DRAFT when no condition matches', () => {
            expect(service.resolveStatus({ status: null, scheduledAt: null, sendMode: null })).toBe(
                NewsletterStatusEnum.DRAFT,
            );
        });

        it('should prioritise DRAFT status over scheduledAt and sendMode', () => {
            expect(
                service.resolveStatus({
                    status: NewsletterStatusEnum.DRAFT,
                    scheduledAt: new Date(Date.now() + 86_400_000),
                    sendMode: NewsletterSendModeEnum.IMMEDIATE,
                }),
            ).toBe(NewsletterStatusEnum.DRAFT);
        });

        it('should prioritise scheduledAt over sendMode', () => {
            expect(
                service.resolveStatus({
                    status: null,
                    scheduledAt: new Date(Date.now() + 86_400_000),
                    sendMode: NewsletterSendModeEnum.IMMEDIATE,
                }),
            ).toBe(NewsletterStatusEnum.SCHEDULED);
        });
    });

    describe('activeUserWhere', () => {
        it('should return filter for active and non-deleted users', () => {
            expect(service.activeUserWhere()).toEqual({
                deleted: false,
                status: UserStatusEnum.ACTIVE,
            });
        });
    });

    describe('findAllActiveUsersByRole', () => {
        it('should find all active users by role', async () => {
            const mockUsers = [
                { id: '1', email: 'user1@test.com', fullname: 'User One' },
                { id: '2', email: 'user2@test.com', fullname: 'User Two' },
            ];
            mockUserRepository.find.mockResolvedValue(mockUsers);

            const result = await service.findAllActiveUsersByRole('USER');

            expect(mockUserRepository.find).toHaveBeenCalledWith({
                where: {
                    deleted: false,
                    status: UserStatusEnum.ACTIVE,
                    role: { label: 'USER' },
                },
                select: ['id', 'email', 'fullname'],
            });
            expect(result).toEqual(mockUsers);
        });

        it('should return empty array when no users found', async () => {
            mockUserRepository.find.mockResolvedValue([]);

            const result = await service.findAllActiveUsersByRole('ADMIN');

            expect(result).toEqual([]);
        });
    });

    describe('findActiveUsersByIds', () => {
        it('should find active users by ids and role', async () => {
            const mockUsers = [
                { id: '1', email: 'user1@test.com', fullname: 'User One' },
                { id: '2', email: 'user2@test.com', fullname: 'User Two' },
            ];
            const userIds = ['1', '2'];
            mockUserRepository.find.mockResolvedValue(mockUsers);

            const result = await service.findActiveUsersByIds(userIds, 'USER');

            expect(mockUserRepository.find).toHaveBeenCalledWith({
                where: {
                    id: In(userIds),
                    deleted: false,
                    status: UserStatusEnum.ACTIVE,
                    role: { label: 'USER' },
                },
                select: ['id', 'email', 'fullname'],
            });
            expect(result).toEqual(mockUsers);
        });

        it('should return empty array when no matching users found', async () => {
            mockUserRepository.find.mockResolvedValue([]);

            const result = await service.findActiveUsersByIds(['999'], 'USER');

            expect(result).toEqual([]);
        });
    });

    describe('findPremiumUser', () => {
        it('should find all active users without role filter', async () => {
            const mockUsers = [{ id: '1', email: 'premium@test.com', fullname: 'Premium User' }];
            mockUserRepository.find.mockResolvedValue(mockUsers);

            const result = await service.findPremiumUser();

            expect(mockUserRepository.find).toHaveBeenCalledWith({
                where: {
                    deleted: false,
                    status: UserStatusEnum.ACTIVE,
                },
                select: ['id', 'email', 'fullname'],
            });
            expect(result).toEqual(mockUsers);
        });
    });

    describe('resolveAudienceRecipients', () => {
        it('should resolve ALL_USERS audience', async () => {
            const mockUsers = [
                { id: '1', email: 'user1@test.com', fullname: 'User One' },
                { id: '2', email: 'user2@test.com', fullname: 'User Two' },
            ];
            mockUserRepository.find.mockResolvedValue(mockUsers);

            const result = await service.resolveAudienceRecipients({
                audience: NewsletterAudienceEnum.ALL_USERS,
            });

            expect(mockUserRepository.find).toHaveBeenCalled();
            expect(result).toEqual(mockUsers);
        });

        it('should resolve PREMIUM_USERS audience without role filter', async () => {
            const mockUsers = [{ id: '1', email: 'premium1@test.com', fullname: 'Premium One' }];
            mockUserRepository.find.mockResolvedValue(mockUsers);

            const result = await service.resolveAudienceRecipients({
                audience: NewsletterAudienceEnum.PREMIUM_USERS,
            });

            expect(mockUserRepository.find).toHaveBeenCalledWith({
                where: {
                    deleted: false,
                    status: UserStatusEnum.ACTIVE,
                },
                select: ['id', 'email', 'fullname'],
            });
            expect(result).toEqual(mockUsers);
        });

        it('should resolve CUSTOM_LIST audience with user ids', async () => {
            const mockUsers = [{ id: '1', email: 'user1@test.com', fullname: 'User One' }];
            const customUserIds = ['1', '2'];
            mockUserRepository.find.mockResolvedValue(mockUsers);

            const result = await service.resolveAudienceRecipients({
                audience: NewsletterAudienceEnum.CUSTOM_LIST,
                customUserIds,
            });

            expect(mockUserRepository.find).toHaveBeenCalledWith({
                where: {
                    id: In(customUserIds),
                    deleted: false,
                    status: UserStatusEnum.ACTIVE,
                    role: { label: 'user' },
                },
                select: ['id', 'email', 'fullname'],
            });
            expect(result).toEqual(mockUsers);
        });

        it('should throw validation error for CUSTOM_LIST without user ids', async () => {
            mockErrorHandler.validation.mockImplementation(() => {
                throw new Error('Validation failed');
            });

            await expect(
                service.resolveAudienceRecipients({ audience: NewsletterAudienceEnum.CUSTOM_LIST }),
            ).rejects.toThrow('Validation failed');

            expect(mockErrorHandler.validation).toHaveBeenCalledWith({
                audience: 'CUSTOM_LIST requires at least one user id',
            });
        });

        it('should throw validation error for CUSTOM_LIST with empty ids array', async () => {
            mockErrorHandler.validation.mockImplementation(() => {
                throw new Error('Validation failed');
            });

            await expect(
                service.resolveAudienceRecipients({
                    audience: NewsletterAudienceEnum.CUSTOM_LIST,
                    customUserIds: [],
                }),
            ).rejects.toThrow('Validation failed');

            expect(mockErrorHandler.validation).toHaveBeenCalledWith({
                audience: 'CUSTOM_LIST requires at least one user id',
            });
        });

        it('should call fail for unsupported audience type', async () => {
            await service.resolveAudienceRecipients({
                audience: 'UNSUPPORTED_AUDIENCE' as NewsletterAudienceEnum,
            });

            expect(mockErrorHandler.fail).toHaveBeenCalledWith(
                'Unsupported audience: UNSUPPORTED_AUDIENCE',
                'Unsupported audience: UNSUPPORTED_AUDIENCE',
            );
        });
    });

    describe('sendNewsLByNotification', () => {
        it('should create notification and send it to users', async () => {
            const mockSentBy = Object.assign(new UserEntity(), { id: 'sender-123' });
            const mockUsers = [
                { id: '1', email: 'user1@test.com', fullname: 'User One' } as UserEntity,
                { id: '2', email: 'user2@test.com', fullname: 'User Two' } as UserEntity,
            ];
            const mockNotification = { id: 'notif-123' };

            mockNotifService.createNotification.mockResolvedValue(mockNotification);
            mockNotifService.sendNotificationToUsers.mockResolvedValue(undefined);

            await service.sendNewsLByNotification(
                mockSentBy,
                'Test Newsletter',
                'Newsletter content',
                mockUsers,
            );

            expect(mockNotifService.createNotification).toHaveBeenCalledWith(
                'Test Newsletter',
                'Newsletter content',
                NotificationSubjectTypeEnum.NEWSLETTER,
                { sentBy: mockSentBy },
            );
            expect(mockNotifService.sendNotificationToUsers).toHaveBeenCalledWith(
                mockNotification,
                mockUsers,
            );
        });

        it('should handle empty users array', async () => {
            const mockSentBy = new UserEntity();
            const mockNotification = { id: 'notif-123' };

            mockNotifService.createNotification.mockResolvedValue(mockNotification);
            mockNotifService.sendNotificationToUsers.mockResolvedValue(undefined);

            await service.sendNewsLByNotification(mockSentBy, 'Title', 'Content', []);

            expect(mockNotifService.sendNotificationToUsers).toHaveBeenCalledWith(
                mockNotification,
                [],
            );
        });
    });

    describe('sendNewsLByEmail', () => {
        it('should build template and send email for each user', async () => {
            const mockUsers = [
                { id: '1', email: 'user1@test.com', fullname: 'User One' } as UserEntity,
                { id: '2', email: 'user2@test.com', fullname: 'User Two' } as UserEntity,
            ];
            const mockHtml = '<html lang="">Newsletter</html>';

            mockOtherUtils.buildEmailTemplate.mockReturnValue(mockHtml);
            mockMailerService.sendMail.mockResolvedValue(undefined);

            await service.sendNewsLByEmail('Test Newsletter', 'Newsletter content', mockUsers);

            expect(mockOtherUtils.buildEmailTemplate).toHaveBeenCalledTimes(2);
            expect(mockOtherUtils.buildEmailTemplate).toHaveBeenCalledWith(
                '../../../src/utils/templates/news-letter.hbs',
                {
                    label: 'Test Newsletter',
                    content: 'Newsletter content',
                    fullname: 'User One',
                    currentYear: new Date().getFullYear(),
                },
            );
            expect(mockMailerService.sendMail).toHaveBeenCalledTimes(2);
            expect(mockMailerService.sendMail).toHaveBeenCalledWith(
                'user1@test.com',
                'Newsletter',
                mockHtml,
            );
            expect(mockMailerService.sendMail).toHaveBeenCalledWith(
                'user2@test.com',
                'Newsletter',
                mockHtml,
            );
        });

        it('should not call sendMail for an empty users array', async () => {
            await service.sendNewsLByEmail('Title', 'Content', []);

            expect(mockMailerService.sendMail).not.toHaveBeenCalled();
        });
    });

    describe('sendNewsLetter', () => {
        let mockSentBy: UserEntity;
        let mockNewsletter: NewsletterEntity;

        beforeEach(() => {
            mockSentBy = Object.assign(new UserEntity(), { id: 'sender-123' });
            mockNewsletter = Object.assign(new NewsletterEntity(), {
                id: 'newsletter-123',
                label: 'Test Newsletter',
                content: 'Newsletter content',
                audience: NewsletterAudienceEnum.ALL_USERS,
            });
        });

        it('should send via NOTIFICATION channel and set status to SENT', async () => {
            mockNewsletter.channel = NewsletterChannelEnum.NOTIFICATION;
            const mockUsers = [{ id: '1', email: 'u1@test.com', fullname: 'U1' } as UserEntity];

            mockUserRepository.find.mockResolvedValue(mockUsers);
            mockNotifService.createNotification.mockResolvedValue({ id: 'notif-123' });
            mockNotifService.sendNotificationToUsers.mockResolvedValue(undefined);
            mockNewsletterRepo.update.mockResolvedValue(undefined);

            await service.sendNewsLetter(mockSentBy, mockNewsletter);

            expect(mockNotifService.createNotification).toHaveBeenCalled();
            expect(mockNewsletterRepo.update).toHaveBeenCalledWith(
                { id: 'newsletter-123' },
                { status: NewsletterStatusEnum.SENT },
            );
        });

        it('should send via EMAIL channel and set status to SENT', async () => {
            mockNewsletter.channel = NewsletterChannelEnum.EMAIL;
            const mockUsers = [{ id: '1', email: 'u1@test.com', fullname: 'U1' } as UserEntity];

            mockUserRepository.find.mockResolvedValue(mockUsers);
            mockOtherUtils.buildEmailTemplate.mockReturnValue('<html lang="">ok</html>');
            mockMailerService.sendMail.mockResolvedValue(undefined);
            mockNewsletterRepo.update.mockResolvedValue(undefined);

            await service.sendNewsLetter(mockSentBy, mockNewsletter);

            expect(mockMailerService.sendMail).toHaveBeenCalled();
            expect(mockNewsletterRepo.update).toHaveBeenCalledWith(
                { id: 'newsletter-123' },
                { status: NewsletterStatusEnum.SENT },
            );
        });

        it('should log warning and return without sending when no recipients', async () => {
            mockNewsletter.channel = NewsletterChannelEnum.EMAIL;
            mockUserRepository.find.mockResolvedValue([]);

            await service.sendNewsLetter(mockSentBy, mockNewsletter);

            expect(mockLogger.warn).toHaveBeenCalledWith(
                'No recipients resolved for newsletter newsletter-123',
            );
            expect(mockMailerService.sendMail).not.toHaveBeenCalled();
            expect(mockNewsletterRepo.update).not.toHaveBeenCalled();
        });

        it('should set status to FAILED for an unsupported channel', async () => {
            mockNewsletter.channel = 'UNSUPPORTED_CHANNEL' as NewsletterChannelEnum;
            mockUserRepository.find.mockResolvedValue([
                { id: '1', email: 'u@t.com', fullname: 'U' } as UserEntity,
            ]);

            mockErrorHandler.forbidden.mockImplementation(() => {
                throw new Error('Forbidden');
            });
            mockErrorHandler.fail.mockImplementation(() => {
                throw new Error('Failed');
            });
            mockNewsletterRepo.update.mockResolvedValue(undefined);

            await expect(service.sendNewsLetter(mockSentBy, mockNewsletter)).rejects.toThrow(
                'Failed',
            );

            expect(mockNewsletterRepo.update).toHaveBeenCalledWith(
                { id: 'newsletter-123' },
                { status: NewsletterStatusEnum.FAILED },
            );
            expect(mockErrorHandler.forbidden).toHaveBeenCalledWith(
                'Unsupported newsletter channel: UNSUPPORTED_CHANNEL',
                'Unsupported newsletter channel: UNSUPPORTED_CHANNEL',
            );
        });

        it('should pass customUserIds to resolveAudienceRecipients for CUSTOM_LIST', async () => {
            mockNewsletter.channel = NewsletterChannelEnum.EMAIL;
            mockNewsletter.audience = NewsletterAudienceEnum.CUSTOM_LIST;
            const customUserIds = ['1', '2'];

            jest.spyOn(service, 'resolveAudienceRecipients').mockResolvedValue([
                { id: '1', email: 'u@t.com', fullname: 'U' } as UserEntity,
            ]);
            mockOtherUtils.buildEmailTemplate.mockReturnValue('<html lang="">ok</html>');
            mockMailerService.sendMail.mockResolvedValue(undefined);
            mockNewsletterRepo.update.mockResolvedValue(undefined);

            await service.sendNewsLetter(mockSentBy, mockNewsletter, customUserIds);

            expect(service.resolveAudienceRecipients).toHaveBeenCalledWith({
                audience: NewsletterAudienceEnum.CUSTOM_LIST,
                customUserIds,
            });
            expect(mockNewsletterRepo.update).toHaveBeenCalledWith(
                { id: 'newsletter-123' },
                { status: NewsletterStatusEnum.SENT },
            );
        });

        it('should set status to FAILED when email delivery throws', async () => {
            mockNewsletter.channel = NewsletterChannelEnum.EMAIL;
            mockUserRepository.find.mockResolvedValue([
                { id: '1', email: 'u@t.com', fullname: 'U' } as UserEntity,
            ]);
            mockOtherUtils.buildEmailTemplate.mockReturnValue('<html lang="">ok</html>');
            mockMailerService.sendMail.mockRejectedValue(new Error('SMTP error'));
            mockNewsletterRepo.update.mockResolvedValue(undefined);
            mockErrorHandler.fail.mockImplementation(() => {
                throw new Error('Failed error');
            });

            await expect(service.sendNewsLetter(mockSentBy, mockNewsletter)).rejects.toThrow(
                'Failed error',
            );

            expect(mockNewsletterRepo.update).toHaveBeenCalledWith(
                { id: 'newsletter-123' },
                { status: NewsletterStatusEnum.FAILED },
            );
            expect(mockErrorHandler.fail).toHaveBeenCalledWith(
                'Failed to send newsletter newsletter-123',
                'Error: SMTP error',
            );
        });

        it('should set status to FAILED when audience resolution throws', async () => {
            jest.spyOn(service, 'resolveAudienceRecipients').mockRejectedValue(
                new Error('Audience error'),
            );
            mockNewsletterRepo.update.mockResolvedValue(undefined);
            mockErrorHandler.fail.mockImplementation(() => {
                throw new Error('failed');
            });

            await expect(service.sendNewsLetter(mockSentBy, mockNewsletter)).rejects.toThrow(
                'failed',
            );

            expect(mockNewsletterRepo.update).toHaveBeenCalledWith(
                { id: 'newsletter-123' },
                { status: NewsletterStatusEnum.FAILED },
            );
        });

        it('should set status to FAILED when notification service throws', async () => {
            mockNewsletter.channel = NewsletterChannelEnum.NOTIFICATION;
            mockUserRepository.find.mockResolvedValue([
                { id: '1', email: 'u@t.com', fullname: 'U' } as UserEntity,
            ]);
            mockNotifService.createNotification.mockRejectedValue(new Error('Notif error'));
            mockNewsletterRepo.update.mockResolvedValue(undefined);
            mockErrorHandler.fail.mockImplementation(() => {
                throw new Error('Failed');
            });

            await expect(service.sendNewsLetter(mockSentBy, mockNewsletter)).rejects.toThrow(
                'Failed',
            );

            expect(mockNewsletterRepo.update).toHaveBeenCalledWith(
                { id: 'newsletter-123' },
                { status: NewsletterStatusEnum.FAILED },
            );
        });
    });

    describe('cancelScheduledJob', () => {
        it('should remove the job when it exists', async () => {
            const mockJob = { remove: jest.fn().mockResolvedValue(undefined) };
            mockNewsletterQueue.getJob.mockResolvedValue(mockJob);

            await service.cancelScheduledJob('newsletter-123');

            expect(mockNewsletterQueue.getJob).toHaveBeenCalledWith('newsletter-newsletter-123');
            expect(mockJob.remove).toHaveBeenCalled();
        });

        it('should do nothing when the job does not exist', async () => {
            mockNewsletterQueue.getJob.mockResolvedValue(null);

            await service.cancelScheduledJob('newsletter-123');

            expect(mockNewsletterQueue.getJob).toHaveBeenCalledWith('newsletter-newsletter-123');
        });
    });
});
