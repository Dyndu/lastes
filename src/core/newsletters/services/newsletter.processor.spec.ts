import { Test, TestingModule } from '@nestjs/testing';
import { NewsletterProcessor } from './newsletter.processor';
import { NewslettersService } from './newsletters.service';
import { Job } from 'bullmq';
import {
    NewsletterChannelEnum,
    NewsletterAudienceEnum,
    NewsletterStatusEnum,
    NewsletterSendModeEnum,
} from '../../../common/enum';

const mockNews = {
    id: 'newsletter-id-123',
    label: 'Test Newsletter',
    channel: NewsletterChannelEnum.EMAIL,
    audience: NewsletterAudienceEnum.ALL_USERS,
    status: NewsletterStatusEnum.SCHEDULED,
    sendMode: NewsletterSendModeEnum.SCHEDULED,
};

const mockSAdmin = {
    id: 'admin-id-123',
    email: 'admin@test.com',
    fullname: 'Super Admin',
};

const mockNlService = {
    logger: {
        info: jest.fn(),
    },
    preNLService: {
        retrieveNewLetterByCriteria: jest.fn(),
        sendNewsLetter: jest.fn(),
        cancelScheduledJob: jest.fn(),
    },
    userRepository: {
        findOne: jest.fn(),
    },
    config: {
        sAdminRole: 'super-admin',
    },
    cacheService: {
        deleteKeysByBase: jest.fn(),
    },
    errorHandler: {
        notFound: jest.fn(),
    },
};

describe('NewsletterProcessor', () => {
    let processor: NewsletterProcessor;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NewsletterProcessor,
                { provide: NewslettersService, useValue: mockNlService },
            ],
        }).compile();

        processor = module.get<NewsletterProcessor>(NewsletterProcessor);

        jest.clearAllMocks();
    });

    const makeJob = (data: { newsletterId: string; usersIds?: string[] }) =>
        ({ data }) as Job<{ newsletterId: string; usersIds?: string[] }>;

    describe('process()', () => {
        it('should process job successfully without usersIds', async () => {
            mockNlService.preNLService.retrieveNewLetterByCriteria.mockResolvedValue(mockNews);
            mockNlService.userRepository.findOne.mockResolvedValue(mockSAdmin);
            mockNlService.preNLService.sendNewsLetter.mockResolvedValue(undefined);
            mockNlService.cacheService.deleteKeysByBase.mockResolvedValue(undefined);
            mockNlService.preNLService.cancelScheduledJob.mockResolvedValue(undefined);

            const result = await processor.process(makeJob({ newsletterId: 'newsletter-id-123' }));

            expect(result).toEqual({ message: 'Newsletter process executed successfully' });
            expect(mockNlService.preNLService.retrieveNewLetterByCriteria).toHaveBeenCalledWith({
                id: 'newsletter-id-123',
            });
            expect(mockNlService.userRepository.findOne).toHaveBeenCalledWith({
                where: { role: { label: 'super-admin' } },
            });
            expect(mockNlService.preNLService.sendNewsLetter).toHaveBeenCalledWith(
                mockSAdmin,
                mockNews,
                undefined,
            );
            expect(mockNlService.cacheService.deleteKeysByBase).toHaveBeenCalledWith('newsletter');
            expect(mockNlService.preNLService.cancelScheduledJob).toHaveBeenCalledWith(
                'newsletter-id-123',
            );
        });

        it('should process job successfully with usersIds', async () => {
            const usersIds = ['user-1', 'user-2'];
            mockNlService.preNLService.retrieveNewLetterByCriteria.mockResolvedValue(mockNews);
            mockNlService.userRepository.findOne.mockResolvedValue(mockSAdmin);
            mockNlService.preNLService.sendNewsLetter.mockResolvedValue(undefined);
            mockNlService.cacheService.deleteKeysByBase.mockResolvedValue(undefined);
            mockNlService.preNLService.cancelScheduledJob.mockResolvedValue(undefined);

            const result = await processor.process(
                makeJob({ newsletterId: 'newsletter-id-123', usersIds }),
            );

            expect(result).toEqual({ message: 'Newsletter process executed successfully' });
            expect(mockNlService.preNLService.sendNewsLetter).toHaveBeenCalledWith(
                mockSAdmin,
                mockNews,
                usersIds,
            );
        });

        it('should throw when newsletter is not found', async () => {
            mockNlService.preNLService.retrieveNewLetterByCriteria.mockRejectedValue(
                new Error('Newsletter not found'),
            );

            await expect(
                processor.process(makeJob({ newsletterId: 'invalid-id' })),
            ).rejects.toThrow('Newsletter not found');

            expect(mockNlService.preNLService.sendNewsLetter).not.toHaveBeenCalled();
            expect(mockNlService.cacheService.deleteKeysByBase).not.toHaveBeenCalled();
        });

        it('should throw when sendNewsLetter fails', async () => {
            mockNlService.preNLService.retrieveNewLetterByCriteria.mockResolvedValue(mockNews);
            mockNlService.userRepository.findOne.mockResolvedValue(mockSAdmin);
            mockNlService.preNLService.sendNewsLetter.mockRejectedValue(new Error('Send failed'));

            await expect(
                processor.process(makeJob({ newsletterId: 'newsletter-id-123' })),
            ).rejects.toThrow('Send failed');

            expect(mockNlService.cacheService.deleteKeysByBase).not.toHaveBeenCalled();
            expect(mockNlService.preNLService.cancelScheduledJob).not.toHaveBeenCalled();
        });
    });
});
