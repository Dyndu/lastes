import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { NewslettersService } from './newsletters.service';
import { PreNewslettersService } from './pre-newsletters.service';
import { NewslettersRepository } from '../newsletters.repository';
import { CacheService } from '../../../helpers/cache/cache.service';
import { SocketService } from '../../../helpers/socket/socket.service';
import { OtherUtils } from '../../../utils/services/tools';
import { EnvConfigService } from '../../../utils/services/config';
import { UsersRepository } from '../../users/repositories';
import { MailerService } from '../../../libs/mailer/services';
import { NotificationsService } from '../../notifications/services';
import { ErrorHandlerService } from '../../../common/response';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { NewsletterEntity } from '../entities/newsletter.entity';
import { UserEntity } from '../../users/entities/user.entity';
import {
    NewsletterChannelEnum,
    NewsletterSendModeEnum,
    NewsletterStatusEnum,
    NewsletterAudienceEnum,
    SocketEventEnum,
} from '../../../common/enum';
import { NewsCreateDto } from '../dto/news-create.dto';
import { NewsUpdateDto } from '../dto/news-update.dto';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

/**
 * Flush all pending setImmediate callbacks and the microtask queue they spawn.
 * Call this after triggering a method that uses setImmediate internally.
 */
async function flushSetImmediate(): Promise<void> {
    await new Promise<void>((resolve) => setImmediate(resolve));
    await Promise.resolve();
    await Promise.resolve();
}

describe('NewslettersService', () => {
    let service: NewslettersService;
    let preNLService: jest.Mocked<PreNewslettersService>;
    let newLetterRepo: jest.Mocked<NewslettersRepository>;
    let cacheService: jest.Mocked<CacheService>;
    let userRepository: jest.Mocked<UsersRepository>;
    let errorHandler: jest.Mocked<ErrorHandlerService>;
    let logger: jest.Mocked<Logger>;
    let newsletterQueue: { add: jest.Mock };

    beforeEach(async () => {
        const mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
        } as any;

        const mockPreNLService = {
            retrieveNewsLettersQuery: jest.fn(),
            retrieveNewLetterByCriteria: jest.fn(),
            ensureLabelUnique: jest.fn(),
            ensureLabelUniqueForUpdate: jest.fn(),
            resolveStatus: jest.fn(),
            validateStatusConstraints: jest.fn(),
            buildNewLetterEntity: jest.fn(),
            updateNewsLetter: jest.fn(),
            notifyAdsChange: jest.fn(),
            scheduleInvalidateNewsCache: jest.fn(),
            sendNewsLetter: jest.fn(),
            cancelScheduledJob: jest.fn(),
        } as any;

        const mockNewLetterRepo = {
            create: jest.fn(),
            delete: jest.fn(),
        } as any;

        const mockCacheService = {
            generateRedisKey: jest.fn(),
            retrieveGenericPaginated: jest.fn(),
        } as any;

        const mockUserRepository = {
            findOne: jest.fn(),
        } as any;

        const mockErrorHandler = {
            notFound: jest.fn(),
        } as any;

        const mockNewsletterQueue = {
            add: jest.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NewslettersService,
                { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
                { provide: PreNewslettersService, useValue: mockPreNLService },
                { provide: NewslettersRepository, useValue: mockNewLetterRepo },
                { provide: CacheService, useValue: mockCacheService },
                { provide: SocketService, useValue: {} },
                { provide: OtherUtils, useValue: {} },
                { provide: EnvConfigService, useValue: {} },
                { provide: UsersRepository, useValue: mockUserRepository },
                { provide: MailerService, useValue: {} },
                { provide: NotificationsService, useValue: {} },
                { provide: ErrorHandlerService, useValue: mockErrorHandler },
                { provide: getQueueToken('newsletter'), useValue: mockNewsletterQueue },
            ],
        }).compile();

        service = module.get<NewslettersService>(NewslettersService);
        logger = module.get(WINSTON_MODULE_PROVIDER);
        preNLService = module.get(PreNewslettersService) as jest.Mocked<PreNewslettersService>;
        newLetterRepo = module.get(NewslettersRepository) as jest.Mocked<NewslettersRepository>;
        cacheService = module.get(CacheService) as jest.Mocked<CacheService>;
        userRepository = module.get(UsersRepository) as jest.Mocked<UsersRepository>;
        errorHandler = module.get(ErrorHandlerService) as jest.Mocked<ErrorHandlerService>;
        newsletterQueue = module.get(getQueueToken('newsletter'));

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ── transformNewsLetter ───────────────────────────────────────────────────

    describe('transformNewsLetter', () => {
        it('should transform a newsletter entity to the simplified shape', () => {
            const scheduledAt = new Date(Date.now() + 86_400_000);
            const newsletter = Object.assign(new NewsletterEntity(), {
                id: '123',
                label: 'Test Newsletter',
                content: 'Test Content',
                audience: NewsletterAudienceEnum.ALL_USERS,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                scheduledAt,
                status: NewsletterStatusEnum.DRAFT,
            });

            expect(service.transformNewsLetter(newsletter)).toEqual({
                id: '123',
                label: 'Test Newsletter',
                content: 'Test Content',
                recipient: NewsletterAudienceEnum.ALL_USERS,
                deliver_time: NewsletterSendModeEnum.IMMEDIATE,
                sentAt: scheduledAt,
                status: NewsletterStatusEnum.DRAFT,
            });
        });

        it('should expose sentAt as undefined when scheduledAt is absent', () => {
            const newsletter = Object.assign(new NewsletterEntity(), {
                id: '456',
                label: 'Newsletter',
                content: 'Content',
                audience: NewsletterAudienceEnum.CUSTOM_LIST,
                sendMode: NewsletterSendModeEnum.MANUAL,
                status: NewsletterStatusEnum.SENT,
            });

            expect(service.transformNewsLetter(newsletter).sentAt).toBeUndefined();
        });
    });

    // ── transformNewLetters ───────────────────────────────────────────────────

    describe('transformNewLetters', () => {
        it('should map an array of entities through transformNewsLetter', () => {
            const newsletter1 = Object.assign(new NewsletterEntity(), {
                id: '1',
                label: 'Newsletter 1',
                content: 'Content 1',
                audience: NewsletterAudienceEnum.ALL_USERS,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                status: NewsletterStatusEnum.PENDING,
            });
            const newsletter2 = Object.assign(new NewsletterEntity(), {
                id: '2',
                label: 'Newsletter 2',
                content: 'Content 2',
                audience: NewsletterAudienceEnum.CUSTOM_LIST,
                sendMode: NewsletterSendModeEnum.SCHEDULED,
                status: NewsletterStatusEnum.SCHEDULED,
            });

            const result = service.transformNewLetters([newsletter1, newsletter2]);

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('1');
            expect(result[1].id).toBe('2');
        });

        it('should return an empty array for empty input', () => {
            expect(service.transformNewLetters([])).toEqual([]);
        });
    });

    describe('getAllNewsletters', () => {
        it('should retrieve newsletters with all filters', async () => {
            const mockTransformed = [{ id: '1', label: 'Newsletter 1', content: 'Content 1' }];

            cacheService.generateRedisKey.mockReturnValue('newsletter:key');
            cacheService.retrieveGenericPaginated.mockResolvedValue(mockTransformed);

            const result = await service.getAllNewsletters(1, 10, {
                channel: NewsletterChannelEnum.EMAIL,
                status: NewsletterStatusEnum.DRAFT,
                searchTerm: 'test',
            });

            expect(logger.info).toHaveBeenCalledWith(
                'Getting all newsletters from cache or database',
            );
            expect(cacheService.generateRedisKey).toHaveBeenCalledWith('newsletter', {
                channel: NewsletterChannelEnum.EMAIL,
                status: NewsletterStatusEnum.DRAFT,
                search: 'test',
            });
            expect(cacheService.retrieveGenericPaginated).toHaveBeenCalled();
            expect(result).toEqual(mockTransformed);
        });

        it('should generate cache key without optional filters', async () => {
            cacheService.generateRedisKey.mockReturnValue('newsletter:key');
            cacheService.retrieveGenericPaginated.mockResolvedValue([]);

            await service.getAllNewsletters(1, 10, { channel: NewsletterChannelEnum.EMAIL });

            expect(cacheService.generateRedisKey).toHaveBeenCalledWith('newsletter', {
                channel: NewsletterChannelEnum.EMAIL,
            });
        });

        it('should lowercase searchTerm in the cache key', async () => {
            cacheService.generateRedisKey.mockReturnValue('newsletter:key');
            cacheService.retrieveGenericPaginated.mockResolvedValue([]);

            await service.getAllNewsletters(1, 10, {
                channel: NewsletterChannelEnum.EMAIL,
                searchTerm: 'UPPERCASE SEARCH',
            });

            expect(cacheService.generateRedisKey).toHaveBeenCalledWith('newsletter', {
                channel: NewsletterChannelEnum.EMAIL,
                search: 'uppercase search',
            });
        });

        it('should invoke retrieveNewsLettersQuery via the queryFn callback', async () => {
            cacheService.generateRedisKey.mockReturnValue('newsletter:key');
            cacheService.retrieveGenericPaginated.mockImplementation(
                async (_baseKey, _page, _limit, filters, queryCallback, transformCallback) => {
                    await queryCallback(0, 10, filters);
                    return transformCallback([new NewsletterEntity()]);
                },
            );

            await service.getAllNewsletters(1, 10, { channel: NewsletterChannelEnum.EMAIL });

            expect(preNLService.retrieveNewsLettersQuery).toHaveBeenCalled();
        });
    });

    describe('newsLetterDetails', () => {
        it('should log, retrieve by id and return the transformed newsletter', async () => {
            const mockNewsletter = Object.assign(new NewsletterEntity(), {
                id: '123',
                label: 'Test',
                content: 'Content',
                audience: NewsletterAudienceEnum.ALL_USERS,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                status: NewsletterStatusEnum.DRAFT,
            });
            preNLService.retrieveNewLetterByCriteria.mockResolvedValue(mockNewsletter);

            const result = await service.newsLetterDetails('123');

            expect(logger.info).toHaveBeenCalledWith('Getting newsletter details with id: 123');
            expect(preNLService.retrieveNewLetterByCriteria).toHaveBeenCalledWith({ id: '123' });
            expect(result.id).toBe('123');
        });
    });

    describe('getSender', () => {
        it('should return the user when found and not deleted', async () => {
            const mockUser = Object.assign(new UserEntity(), {
                id: 'user-123',
                email: 'test@example.com',
            });
            userRepository.findOne.mockResolvedValue(mockUser);

            const result = await service.getSender('user-123');

            expect(userRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'user-123', deleted: false },
            });
            expect(result).toEqual(mockUser);
        });

        it('should call errorHandler.notFound when user does not exist', async () => {
            userRepository.findOne.mockResolvedValue(null);
            errorHandler.notFound.mockImplementation(() => {
                throw new Error('User not found');
            });

            await expect(service.getSender('non-existent')).rejects.toThrow('User not found');
            expect(errorHandler.notFound).toHaveBeenCalledWith('User not found', 'User not found');
        });

        it('should query only non-deleted users', async () => {
            userRepository.findOne.mockResolvedValue(new UserEntity());

            await service.getSender('user-123');

            expect(userRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'user-123', deleted: false },
            });
        });
    });

    describe('handlePostSave', () => {
        let mockNewsletter: NewsletterEntity;
        let mockSentBy: UserEntity;

        beforeEach(() => {
            mockNewsletter = Object.assign(new NewsletterEntity(), {
                id: '123',
                sendMode: NewsletterSendModeEnum.MANUAL,
            });
            mockSentBy = Object.assign(new UserEntity(), { id: 'user-123' });

            preNLService.notifyAdsChange.mockImplementation(() => {});
            preNLService.scheduleInvalidateNewsCache.mockResolvedValue(undefined);
            preNLService.sendNewsLetter.mockResolvedValue(undefined);
            newsletterQueue.add.mockResolvedValue(undefined);
        });

        it('should call notifyAdsChange synchronously before returning', async () => {
            await service.handlePostSave(
                mockNewsletter,
                mockSentBy,
                SocketEventEnum.NEW_LETTER_CREATED,
            );

            expect(preNLService.notifyAdsChange).toHaveBeenCalledWith(
                mockNewsletter,
                SocketEventEnum.NEW_LETTER_CREATED,
            );
        });

        it('should work with NEW_LETTER_UPDATED event', async () => {
            await service.handlePostSave(
                mockNewsletter,
                mockSentBy,
                SocketEventEnum.NEW_LETTER_UPDATED,
            );

            expect(preNLService.notifyAdsChange).toHaveBeenCalledWith(
                mockNewsletter,
                SocketEventEnum.NEW_LETTER_UPDATED,
            );
        });

        it('should schedule cache invalidation inside setImmediate', async () => {
            await service.handlePostSave(
                mockNewsletter,
                mockSentBy,
                SocketEventEnum.NEW_LETTER_CREATED,
            );

            await flushSetImmediate();

            expect(preNLService.scheduleInvalidateNewsCache).toHaveBeenCalledTimes(1);
        });

        it('should not call sendNewsLetter when sendMode is MANUAL', async () => {
            mockNewsletter.sendMode = NewsletterSendModeEnum.MANUAL;

            await service.handlePostSave(
                mockNewsletter,
                mockSentBy,
                SocketEventEnum.NEW_LETTER_CREATED,
            );

            await flushSetImmediate();

            expect(preNLService.sendNewsLetter).not.toHaveBeenCalled();
        });

        it('should send newsletter and invalidate cache twice when sendMode is IMMEDIATE', async () => {
            mockNewsletter.sendMode = NewsletterSendModeEnum.IMMEDIATE;

            await service.handlePostSave(
                mockNewsletter,
                mockSentBy,
                SocketEventEnum.NEW_LETTER_CREATED,
            );

            await flushSetImmediate();

            expect(preNLService.sendNewsLetter).toHaveBeenCalledWith(
                mockSentBy,
                mockNewsletter,
                undefined,
            );
            expect(preNLService.scheduleInvalidateNewsCache).toHaveBeenCalledTimes(2);
        });

        it('should forward usersIds to sendNewsLetter when provided', async () => {
            mockNewsletter.sendMode = NewsletterSendModeEnum.IMMEDIATE;
            const usersIds = ['user1', 'user2', 'user3'];

            await service.handlePostSave(
                mockNewsletter,
                mockSentBy,
                SocketEventEnum.NEW_LETTER_CREATED,
                usersIds,
            );

            await flushSetImmediate();

            expect(preNLService.sendNewsLetter).toHaveBeenCalledWith(
                mockSentBy,
                mockNewsletter,
                usersIds,
            );
        });

        it('should forward an empty usersIds array to sendNewsLetter', async () => {
            mockNewsletter.sendMode = NewsletterSendModeEnum.IMMEDIATE;

            await service.handlePostSave(
                mockNewsletter,
                mockSentBy,
                SocketEventEnum.NEW_LETTER_CREATED,
                [],
            );

            await flushSetImmediate();

            expect(preNLService.sendNewsLetter).toHaveBeenCalledWith(
                mockSentBy,
                mockNewsletter,
                [],
            );
        });

        it('should add a delayed job to the queue when SCHEDULED and scheduledAt is in the future', async () => {
            const futureDate = new Date(Date.now() + 3_600_000);
            mockNewsletter.sendMode = NewsletterSendModeEnum.SCHEDULED;
            mockNewsletter.scheduledAt = futureDate;

            await service.handlePostSave(
                mockNewsletter,
                mockSentBy,
                SocketEventEnum.NEW_LETTER_UPDATED,
            );

            await flushSetImmediate();

            expect(preNLService.sendNewsLetter).not.toHaveBeenCalled();
            expect(newsletterQueue.add).toHaveBeenCalledWith(
                'send-newsletter',
                { newsletterId: '123' },
                expect.objectContaining({
                    jobId: 'newsletter-123',
                    // attempts: 1 matches the service source
                    attempts: 1,
                    backoff: { type: 'exponential', delay: 5000 },
                }),
            );
        });

        it('should NOT add a job when sendMode is SCHEDULED but scheduledAt is in the past', async () => {
            mockNewsletter.sendMode = NewsletterSendModeEnum.SCHEDULED;
            mockNewsletter.scheduledAt = new Date(Date.now() - 1_000);

            await service.handlePostSave(
                mockNewsletter,
                mockSentBy,
                SocketEventEnum.NEW_LETTER_UPDATED,
            );

            await flushSetImmediate();

            expect(newsletterQueue.add).not.toHaveBeenCalled();
        });

        it('should NOT add a job when sendMode is SCHEDULED but scheduledAt is absent', async () => {
            mockNewsletter.sendMode = NewsletterSendModeEnum.SCHEDULED;
            mockNewsletter.scheduledAt = undefined!;

            await service.handlePostSave(
                mockNewsletter,
                mockSentBy,
                SocketEventEnum.NEW_LETTER_UPDATED,
            );

            await flushSetImmediate();

            expect(newsletterQueue.add).not.toHaveBeenCalled();
        });
    });

    describe('createNewsletter', () => {
        let mockCreateDto: NewsCreateDto;
        let mockSentBy: UserEntity;
        let mockNewsletter: NewsletterEntity;

        beforeEach(() => {
            mockCreateDto = {
                label: 'Test Newsletter',
                content: 'Test Content',
                channel: NewsletterChannelEnum.EMAIL,
                status: NewsletterStatusEnum.DRAFT,
                sendMode: NewsletterSendModeEnum.MANUAL,
                audience: NewsletterAudienceEnum.ALL_USERS,
            };

            mockSentBy = Object.assign(new UserEntity(), { id: 'user-123' });
            mockNewsletter = Object.assign(new NewsletterEntity(), {
                id: '123',
                label: 'Test Newsletter',
                sendMode: NewsletterSendModeEnum.MANUAL,
            });

            userRepository.findOne.mockResolvedValue(mockSentBy);
            preNLService.ensureLabelUnique.mockResolvedValue(undefined);
            preNLService.resolveStatus.mockReturnValue(NewsletterStatusEnum.DRAFT);
            preNLService.validateStatusConstraints.mockImplementation(() => {});
            preNLService.buildNewLetterEntity.mockReturnValue(mockNewsletter);
            newLetterRepo.create.mockResolvedValue(mockNewsletter);
            preNLService.notifyAdsChange.mockImplementation(() => {});
            preNLService.scheduleInvalidateNewsCache.mockResolvedValue(undefined);
        });

        it('should log the creation with DTO data', async () => {
            await service.createNewsletter('user-123', mockCreateDto);

            expect(logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Create news letter with data'),
            );
        });

        it('should retrieve the sender', async () => {
            await service.createNewsletter('user-123', mockCreateDto);

            expect(userRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'user-123', deleted: false },
            });
        });

        it('should ensure label uniqueness', async () => {
            await service.createNewsletter('user-123', mockCreateDto);

            expect(preNLService.ensureLabelUnique).toHaveBeenCalledWith('Test Newsletter');
        });

        it('should resolve status with correct payload', async () => {
            await service.createNewsletter('user-123', mockCreateDto);

            expect(preNLService.resolveStatus).toHaveBeenCalledWith({
                status: NewsletterStatusEnum.DRAFT,
                scheduledAt: undefined,
                sendMode: NewsletterSendModeEnum.MANUAL,
            });
        });

        it('should validate status constraints', async () => {
            await service.createNewsletter('user-123', mockCreateDto);

            expect(preNLService.validateStatusConstraints).toHaveBeenCalledWith({
                status: NewsletterStatusEnum.DRAFT,
                sendMode: NewsletterSendModeEnum.MANUAL,
                scheduledAt: undefined,
            });
        });

        it('should validate status constraints including scheduledAt when provided', async () => {
            const futureDate = new Date(Date.now() + 86_400_000);
            preNLService.resolveStatus.mockReturnValue(NewsletterStatusEnum.SCHEDULED);

            await service.createNewsletter('user-123', {
                ...mockCreateDto,
                scheduledAt: futureDate,
            });

            expect(preNLService.validateStatusConstraints).toHaveBeenCalledWith({
                status: NewsletterStatusEnum.SCHEDULED,
                sendMode: NewsletterSendModeEnum.MANUAL,
                scheduledAt: futureDate,
            });
        });

        it('should call buildNewLetterEntity with trimmed label and content', async () => {
            await service.createNewsletter('user-123', {
                ...mockCreateDto,
                label: '  Test Newsletter  ',
                content: '  Test Content  ',
            });

            expect(preNLService.buildNewLetterEntity).toHaveBeenCalledWith(
                {
                    label: 'Test Newsletter',
                    content: 'Test Content',
                    channel: NewsletterChannelEnum.EMAIL,
                    status: NewsletterStatusEnum.DRAFT,
                    audience: NewsletterAudienceEnum.ALL_USERS,
                    sendMode: NewsletterSendModeEnum.MANUAL,
                },
                { scheduledAt: undefined },
            );
        });

        it('should persist the new newsletter via repo.create', async () => {
            await service.createNewsletter('user-123', mockCreateDto);

            expect(newLetterRepo.create).toHaveBeenCalledWith(mockNewsletter);
        });

        it('should call handlePostSave with the correct event and no usersIds', async () => {
            const spy = jest.spyOn(service, 'handlePostSave');

            await service.createNewsletter('user-123', mockCreateDto);

            expect(spy).toHaveBeenCalledWith(
                mockNewsletter,
                mockSentBy,
                SocketEventEnum.NEW_LETTER_CREATED,
                undefined,
            );
        });

        it('should forward usersIds to handlePostSave when provided', async () => {
            const spy = jest.spyOn(service, 'handlePostSave');

            await service.createNewsletter('user-123', {
                ...mockCreateDto,
                usersIds: ['user1', 'user2'],
            });

            expect(spy).toHaveBeenCalledWith(
                mockNewsletter,
                mockSentBy,
                SocketEventEnum.NEW_LETTER_CREATED,
                ['user1', 'user2'],
            );
        });

        it('should forward an empty usersIds array to handlePostSave', async () => {
            const spy = jest.spyOn(service, 'handlePostSave');

            await service.createNewsletter('user-123', { ...mockCreateDto, usersIds: [] });

            expect(spy).toHaveBeenCalledWith(
                mockNewsletter,
                mockSentBy,
                SocketEventEnum.NEW_LETTER_CREATED,
                [],
            );
        });

        it('should return a success message', async () => {
            const result = await service.createNewsletter('user-123', mockCreateDto);

            expect(result).toEqual({ message: 'News letter created successfully.' });
        });

        it('should support NOTIFICATION channel', async () => {
            await service.createNewsletter('user-123', {
                ...mockCreateDto,
                channel: NewsletterChannelEnum.NOTIFICATION,
            });

            expect(preNLService.buildNewLetterEntity).toHaveBeenCalledWith(
                expect.objectContaining({ channel: NewsletterChannelEnum.NOTIFICATION }),
                expect.any(Object),
            );
        });

        it('should forward scheduledAt to buildNewLetterEntity', async () => {
            const futureDate = new Date(Date.now() + 86_400_000);
            preNLService.resolveStatus.mockReturnValue(NewsletterStatusEnum.SCHEDULED);

            await service.createNewsletter('user-123', {
                ...mockCreateDto,
                sendMode: NewsletterSendModeEnum.SCHEDULED,
                scheduledAt: futureDate,
            });

            expect(preNLService.buildNewLetterEntity).toHaveBeenCalledWith(expect.any(Object), {
                scheduledAt: futureDate,
            });
        });
    });

    describe('updateNewsletter', () => {
        let mockUpdateDto: NewsUpdateDto;
        let mockSentBy: UserEntity;
        let mockExistingNewsletter: NewsletterEntity;
        let mockUpdatedNewsletter: NewsletterEntity;

        beforeEach(() => {
            mockUpdateDto = {
                label: 'Updated Newsletter',
                content: 'Updated Content',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
            };

            mockSentBy = Object.assign(new UserEntity(), { id: 'user-123' });
            mockExistingNewsletter = Object.assign(new NewsletterEntity(), {
                id: '123',
                label: 'Old Newsletter',
                status: NewsletterStatusEnum.DRAFT,
                sendMode: NewsletterSendModeEnum.MANUAL,
            });
            mockUpdatedNewsletter = Object.assign(new NewsletterEntity(), {
                id: '123',
                label: 'Updated Newsletter',
            });

            userRepository.findOne.mockResolvedValue(mockSentBy);
            preNLService.retrieveNewLetterByCriteria
                .mockResolvedValueOnce(mockExistingNewsletter)
                .mockResolvedValueOnce(mockUpdatedNewsletter);
            preNLService.ensureLabelUniqueForUpdate.mockResolvedValue(undefined);
            preNLService.resolveStatus.mockReturnValue(NewsletterStatusEnum.PENDING);
            preNLService.validateStatusConstraints.mockImplementation(() => {});
            preNLService.updateNewsLetter.mockResolvedValue(undefined!);
            preNLService.notifyAdsChange.mockImplementation(() => {});
            preNLService.scheduleInvalidateNewsCache.mockResolvedValue(undefined);
            preNLService.cancelScheduledJob.mockResolvedValue(undefined);
        });

        it('should log the update with DTO data', async () => {
            await service.updateNewsletter('user-123', '123', mockUpdateDto);

            expect(logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Update news letter with data'),
            );
        });

        it('should retrieve sender and existing newsletter in parallel', async () => {
            await service.updateNewsletter('user-123', '123', mockUpdateDto);

            expect(userRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'user-123', deleted: false },
            });
            expect(preNLService.retrieveNewLetterByCriteria).toHaveBeenCalledWith({ id: '123' });
        });

        it('should check label uniqueness when label is provided', async () => {
            await service.updateNewsletter('user-123', '123', mockUpdateDto);

            expect(preNLService.ensureLabelUniqueForUpdate).toHaveBeenCalledWith(
                'Updated Newsletter',
                mockExistingNewsletter,
            );
        });

        it('should skip label uniqueness check when label is not provided', async () => {
            await service.updateNewsletter('user-123', '123', { content: 'Updated Content' });

            expect(preNLService.ensureLabelUniqueForUpdate).not.toHaveBeenCalled();
        });

        it('should fall back to the existing sendMode when not provided in DTO', async () => {
            preNLService.resolveStatus.mockReturnValue(NewsletterStatusEnum.DRAFT);

            await service.updateNewsletter('user-123', '123', { content: 'New Content' });

            expect(preNLService.resolveStatus).toHaveBeenCalledWith({
                status: undefined,
                scheduledAt: undefined,
                sendMode: NewsletterSendModeEnum.MANUAL,
            });
        });

        it('should validate status constraints with resolved status and normalised scheduledAt', async () => {
            await service.updateNewsletter('user-123', '123', mockUpdateDto);

            expect(preNLService.validateStatusConstraints).toHaveBeenCalledWith({
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                scheduledAt: null,
            });
        });

        it('should normalise scheduledAt to null when sendMode changes away from SCHEDULED', async () => {
            await service.updateNewsletter('user-123', '123', {
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                scheduledAt: new Date(Date.now() + 86_400_000),
            });

            expect(preNLService.updateNewsLetter).toHaveBeenCalledWith(
                mockExistingNewsletter,
                expect.objectContaining({ scheduledAt: null }),
            );
        });

        it('should preserve scheduledAt when sendMode stays SCHEDULED', async () => {
            const futureDate = new Date(Date.now() + 86_400_000);
            preNLService.resolveStatus.mockReturnValue(NewsletterStatusEnum.SCHEDULED);

            await service.updateNewsletter('user-123', '123', {
                sendMode: NewsletterSendModeEnum.SCHEDULED,
                scheduledAt: futureDate,
            });

            expect(preNLService.updateNewsLetter).toHaveBeenCalledWith(
                mockExistingNewsletter,
                expect.objectContaining({ scheduledAt: futureDate }),
            );
        });

        it('should call updateNewsLetter with all provided fields', async () => {
            await service.updateNewsletter('user-123', '123', mockUpdateDto);

            expect(preNLService.updateNewsLetter).toHaveBeenCalledWith(mockExistingNewsletter, {
                label: 'Updated Newsletter',
                content: 'Updated Content',
                channel: undefined,
                status: NewsletterStatusEnum.PENDING,
                scheduledAt: null,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                audience: undefined,
            });
        });

        it('should re-fetch the newsletter after the update', async () => {
            await service.updateNewsletter('user-123', '123', mockUpdateDto);

            expect(preNLService.retrieveNewLetterByCriteria).toHaveBeenCalledTimes(2);
            expect(preNLService.retrieveNewLetterByCriteria).toHaveBeenNthCalledWith(2, {
                id: '123',
            });
        });

        it('should cancel any existing scheduled job before post-save', async () => {
            await service.updateNewsletter('user-123', '123', mockUpdateDto);

            expect(preNLService.cancelScheduledJob).toHaveBeenCalledWith('123');
        });

        it('should call handlePostSave with no usersIds', async () => {
            const spy = jest.spyOn(service, 'handlePostSave');

            await service.updateNewsletter('user-123', '123', mockUpdateDto);

            expect(spy).toHaveBeenCalledWith(
                mockUpdatedNewsletter,
                mockSentBy,
                SocketEventEnum.NEW_LETTER_UPDATED,
                undefined,
            );
        });

        it('should forward usersIds to handlePostSave when provided', async () => {
            const spy = jest.spyOn(service, 'handlePostSave');

            await service.updateNewsletter('user-123', '123', {
                ...mockUpdateDto,
                usersIds: ['user1', 'user2'],
            });

            expect(spy).toHaveBeenCalledWith(
                mockUpdatedNewsletter,
                mockSentBy,
                SocketEventEnum.NEW_LETTER_UPDATED,
                ['user1', 'user2'],
            );
        });

        it('should forward an empty usersIds array to handlePostSave', async () => {
            const spy = jest.spyOn(service, 'handlePostSave');

            await service.updateNewsletter('user-123', '123', { ...mockUpdateDto, usersIds: [] });

            expect(spy).toHaveBeenCalledWith(
                mockUpdatedNewsletter,
                mockSentBy,
                SocketEventEnum.NEW_LETTER_UPDATED,
                [],
            );
        });

        it('should return a success message', async () => {
            const result = await service.updateNewsletter('user-123', '123', mockUpdateDto);

            expect(result).toEqual({ message: 'News letter updated successfully.' });
        });

        it('should handle all updatable fields at once', async () => {
            const futureDate = new Date(Date.now() + 86_400_000);
            preNLService.resolveStatus.mockReturnValue(NewsletterStatusEnum.SCHEDULED);

            await service.updateNewsletter('user-123', '123', {
                label: 'Full Update',
                content: 'Full Content',
                channel: NewsletterChannelEnum.NOTIFICATION,
                status: NewsletterStatusEnum.SCHEDULED,
                sendMode: NewsletterSendModeEnum.SCHEDULED,
                audience: NewsletterAudienceEnum.CUSTOM_LIST,
                scheduledAt: futureDate,
            });

            expect(preNLService.updateNewsLetter).toHaveBeenCalledWith(mockExistingNewsletter, {
                label: 'Full Update',
                content: 'Full Content',
                channel: NewsletterChannelEnum.NOTIFICATION,
                status: NewsletterStatusEnum.SCHEDULED,
                scheduledAt: futureDate,
                sendMode: NewsletterSendModeEnum.SCHEDULED,
                audience: NewsletterAudienceEnum.CUSTOM_LIST,
            });
        });
    });

    describe('deleteNewLetter', () => {
        let mockNewsletter: NewsletterEntity;

        beforeEach(() => {
            mockNewsletter = Object.assign(new NewsletterEntity(), { id: '123' });

            preNLService.retrieveNewLetterByCriteria.mockResolvedValue(mockNewsletter);
            preNLService.cancelScheduledJob.mockResolvedValue(undefined);
            newLetterRepo.delete.mockResolvedValue({ affected: 1 } as any);
            preNLService.notifyAdsChange.mockImplementation(() => {});
            preNLService.scheduleInvalidateNewsCache.mockResolvedValue(undefined);
        });

        it('should log deletion with the newsletter id', async () => {
            await service.deleteNewLetter('123');

            expect(logger.info).toHaveBeenCalledWith('Delete a news letter with id: 123');
        });

        it('should retrieve the newsletter before deletion', async () => {
            await service.deleteNewLetter('123');

            expect(preNLService.retrieveNewLetterByCriteria).toHaveBeenCalledWith({ id: '123' });
        });

        it('should cancel any scheduled job before deleting', async () => {
            await service.deleteNewLetter('123');

            expect(preNLService.cancelScheduledJob).toHaveBeenCalledWith('123');
        });

        it('should delete the newsletter from the repository', async () => {
            await service.deleteNewLetter('123');

            expect(newLetterRepo.delete).toHaveBeenCalledWith({ id: '123' });
        });

        it('should notify ads change with the DELETE event', async () => {
            await service.deleteNewLetter('123');

            expect(preNLService.notifyAdsChange).toHaveBeenCalledWith(
                mockNewsletter,
                SocketEventEnum.NEW_LETTER_DELETED,
            );
        });

        it('should invalidate cache after deletion', async () => {
            await service.deleteNewLetter('123');

            expect(preNLService.scheduleInvalidateNewsCache).toHaveBeenCalledTimes(1);
        });

        it('should return a success message', async () => {
            const result = await service.deleteNewLetter('123');

            expect(result).toEqual({ message: 'News letter deleted successfully.' });
        });

        it('should execute all operations in the correct order', async () => {
            const callOrder: string[] = [];

            preNLService.retrieveNewLetterByCriteria.mockImplementation(async () => {
                callOrder.push('retrieve');
                return mockNewsletter;
            });
            preNLService.cancelScheduledJob.mockImplementation(async () => {
                callOrder.push('cancelJob');
            });
            newLetterRepo.delete.mockImplementation(async () => {
                callOrder.push('delete');
                return { affected: 1 } as any;
            });
            preNLService.notifyAdsChange.mockImplementation(() => {
                callOrder.push('notify');
            });
            preNLService.scheduleInvalidateNewsCache.mockImplementation(async () => {
                callOrder.push('invalidate');
            });

            await service.deleteNewLetter('123');

            expect(callOrder).toEqual(['retrieve', 'cancelJob', 'delete', 'notify', 'invalidate']);
        });
    });
});
