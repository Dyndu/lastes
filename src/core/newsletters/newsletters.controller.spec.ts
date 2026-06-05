import { Test, TestingModule } from '@nestjs/testing';
import { NewslettersController } from './newsletters.controller';
import { NewslettersService } from './services/newsletters.service';
import {
    NewsletterAudienceEnum,
    NewsletterChannelEnum,
    NewsletterSendModeEnum,
    NewsletterStatusEnum,
} from '../../common/enum';
import { PaginationDto } from '../../common/dto';
import { NewsCreateDto } from './dto/news-create.dto';
import { NewsUpdateDto } from './dto/news-update.dto';
import type { CurrentUserInterface } from '../../interface';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';
import { PermissionsGuard, JwtAuthGuard } from '../../common/guard';

describe('NewslettersController', () => {
    let controller: NewslettersController;
    let service: NewslettersService;

    const mockNewslettersService = {
        getAllNewsletters: jest.fn(),
        newsLetterDetails: jest.fn(),
        createNewsletter: jest.fn(),
        updateNewsletter: jest.fn(),
        deleteNewLetter: jest.fn(),
    };

    const mockEnvConfigService = {
        sAdminRole: 'superadmin',
        adminRole: 'admin',
        userRole: 'user',
        supportRole: 'support',
    };

    const mockErrorHandlerService = {
        forbidden: jest.fn((_message, userMessage) => {
            throw new Error(userMessage);
        }),
    };

    const mockReflector = {
        get: jest.fn(),
    };

    const mockCurrentUser: CurrentUserInterface = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
    } as any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [NewslettersController],
            providers: [
                {
                    provide: NewslettersService,
                    useValue: mockNewslettersService,
                },
                {
                    provide: EnvConfigService,
                    useValue: mockEnvConfigService,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
                {
                    provide: Reflector,
                    useValue: mockReflector,
                },
                {
                    provide: JwtAuthGuard,
                    useValue: { canActivate: jest.fn(() => true) },
                },
                {
                    provide: PermissionsGuard,
                    useValue: { canActivate: jest.fn(() => true) },
                },
            ],
        }).compile();

        controller = module.get<NewslettersController>(NewslettersController);
        service = module.get<NewslettersService>(NewslettersService);

        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Controller Definition', () => {
        it('should be defined', () => {
            expect(controller).toBeDefined();
        });

        it('should have nlService injected', () => {
            expect(controller['nlService']).toBe(service);
        });
    });

    describe('GET / - nonDeletedNews', () => {
        it('should retrieve all newsletters with pagination and channel filter', async () => {
            const paginationDto = new PaginationDto();
            paginationDto.page = 1;
            paginationDto.limit = 10;

            const channel = NewsletterChannelEnum.EMAIL;
            const expectedResult = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
            };

            mockNewslettersService.getAllNewsletters.mockResolvedValue(expectedResult);

            const result = await controller.nonDeletedNews(paginationDto, channel);

            expect(result).toEqual(expectedResult);
            expect(service.getAllNewsletters).toHaveBeenCalledWith(1, 10, {
                channel,
                status: undefined,
                searchTerm: undefined,
            });
            expect(service.getAllNewsletters).toHaveBeenCalledTimes(1);
        });

        it('should retrieve newsletters with status filter', async () => {
            const paginationDto = new PaginationDto();
            paginationDto.page = 2;
            paginationDto.limit = 20;

            const channel = NewsletterChannelEnum.EMAIL;
            const status = NewsletterStatusEnum.DRAFT;
            const expectedResult = {
                data: [{ id: '1', title: 'Test Newsletter' }],
                total: 1,
                page: 2,
                limit: 20,
            };

            mockNewslettersService.getAllNewsletters.mockResolvedValue(expectedResult);

            const result = await controller.nonDeletedNews(paginationDto, channel, status);

            expect(result).toEqual(expectedResult);
            expect(service.getAllNewsletters).toHaveBeenCalledWith(2, 20, {
                channel,
                status,
                searchTerm: undefined,
            });
        });

        it('should retrieve newsletters with search term', async () => {
            const paginationDto = new PaginationDto();
            const channel = NewsletterChannelEnum.EMAIL;
            const search = 'test search';
            const expectedResult = {
                data: [{ id: '1', title: 'Test Newsletter' }],
                total: 1,
                page: 1,
                limit: 10,
            };

            mockNewslettersService.getAllNewsletters.mockResolvedValue(expectedResult);

            const result = await controller.nonDeletedNews(
                paginationDto,
                channel,
                undefined,
                search,
            );

            expect(result).toEqual(expectedResult);
            expect(service.getAllNewsletters).toHaveBeenCalledWith(1, 10, {
                channel,
                status: undefined,
                searchTerm: search,
            });
        });

        it('should retrieve newsletters with all filters', async () => {
            const paginationDto = new PaginationDto();
            paginationDto.page = 3;
            paginationDto.limit = 15;

            const channel = NewsletterChannelEnum.EMAIL;
            const status = NewsletterStatusEnum.PENDING;
            const search = 'newsletter';
            const expectedResult = {
                data: [],
                total: 0,
                page: 3,
                limit: 15,
            };

            mockNewslettersService.getAllNewsletters.mockResolvedValue(expectedResult);

            const result = await controller.nonDeletedNews(paginationDto, channel, status, search);

            expect(result).toEqual(expectedResult);
            expect(service.getAllNewsletters).toHaveBeenCalledWith(3, 15, {
                channel,
                status,
                searchTerm: search,
            });
        });

        it('should use default pagination values when not provided', async () => {
            const paginationDto = new PaginationDto();
            const channel = NewsletterChannelEnum.EMAIL;

            mockNewslettersService.getAllNewsletters.mockResolvedValue({
                data: [],
                total: 0,
                page: 1,
                limit: 10,
            });

            await controller.nonDeletedNews(paginationDto, channel);

            expect(service.getAllNewsletters).toHaveBeenCalledWith(1, 10, {
                channel,
                status: undefined,
                searchTerm: undefined,
            });
        });

        it('should handle different channel types', async () => {
            const paginationDto = new PaginationDto();
            const channels = Object.values(NewsletterChannelEnum);

            for (const channel of channels) {
                mockNewslettersService.getAllNewsletters.mockResolvedValue({
                    data: [],
                    total: 0,
                    page: 1,
                    limit: 10,
                });

                await controller.nonDeletedNews(paginationDto, channel);

                expect(service.getAllNewsletters).toHaveBeenCalledWith(
                    1,
                    10,
                    expect.objectContaining({ channel }),
                );
            }
        });
    });

    describe('GET /:id - findOne', () => {
        it('should retrieve newsletter details by id', async () => {
            const newsletterId = '123e4567-e89b-12d3-a456-426614174000';
            const expectedResult = {
                id: newsletterId,
                title: 'Test Newsletter',
                content: 'Test content',
            };

            mockNewslettersService.newsLetterDetails.mockResolvedValue(expectedResult);

            const result = await controller.findOne(newsletterId);

            expect(result).toEqual(expectedResult);
            expect(service.newsLetterDetails).toHaveBeenCalledWith(newsletterId);
            expect(service.newsLetterDetails).toHaveBeenCalledTimes(1);
        });

        it('should handle different valid UUIDs', async () => {
            const newsletterIds = [
                '123e4567-e89b-12d3-a456-426614174000',
                '987fcdeb-51a2-43f7-b123-9876543210ab',
                'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
            ];

            for (const id of newsletterIds) {
                mockNewslettersService.newsLetterDetails.mockResolvedValue({
                    id,
                    title: 'Test',
                });

                await controller.findOne(id);

                expect(service.newsLetterDetails).toHaveBeenCalledWith(id);
            }
        });

        it('should propagate service errors', async () => {
            const newsletterId = '123e4567-e89b-12d3-a456-426614174000';
            const error = new Error('Newsletter not found');

            mockNewslettersService.newsLetterDetails.mockRejectedValue(error);

            await expect(controller.findOne(newsletterId)).rejects.toThrow('Newsletter not found');
            expect(service.newsLetterDetails).toHaveBeenCalledWith(newsletterId);
        });
    });

    describe('POST / - createNewsLetter', () => {
        it('should create a new newsletter', async () => {
            const createDto: NewsCreateDto = {
                label: 'New Newsletter',
                content: 'Newsletter content',
                status: NewsletterStatusEnum.SCHEDULED,
                channel: NewsletterChannelEnum.EMAIL,
                sendMode: NewsletterSendModeEnum.MANUAL,
                audience: NewsletterAudienceEnum.PREMIUM_USERS,
            } as NewsCreateDto;

            const expectedResult = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                ...createDto,
            };

            mockNewslettersService.createNewsletter.mockResolvedValue(expectedResult);

            const result = await controller.createNewsLetter(mockCurrentUser, createDto);

            expect(result).toEqual(expectedResult);
            expect(service.createNewsletter).toHaveBeenCalledWith(mockCurrentUser.id, createDto);
            expect(service.createNewsletter).toHaveBeenCalledTimes(1);
        });

        it('should create newsletter with different user ids', async () => {
            const users = [
                { id: '111e4567-e89b-12d3-a456-426614174000' },
                { id: '222e4567-e89b-12d3-a456-426614174000' },
                { id: '333e4567-e89b-12d3-a456-426614174000' },
            ] as CurrentUserInterface[];

            const createDto: NewsCreateDto = {
                label: 'Test',
                content: 'Content',
            } as NewsCreateDto;

            for (const user of users) {
                mockNewslettersService.createNewsletter.mockResolvedValue({
                    id: 'newsletter-id',
                    ...createDto,
                });

                await controller.createNewsLetter(user, createDto);

                expect(service.createNewsletter).toHaveBeenCalledWith(user.id, createDto);
            }
        });

        it('should propagate validation errors from service', async () => {
            const createDto: NewsCreateDto = {
                label: '',
                content: '',
            } as NewsCreateDto;

            const error = new Error('Validation failed');
            mockNewslettersService.createNewsletter.mockRejectedValue(error);

            await expect(controller.createNewsLetter(mockCurrentUser, createDto)).rejects.toThrow(
                'Validation failed',
            );

            expect(service.createNewsletter).toHaveBeenCalledWith(mockCurrentUser.id, createDto);
        });

        it('should handle service errors during creation', async () => {
            const createDto: NewsCreateDto = {
                label: 'Test',
            } as NewsCreateDto;

            const error = new Error('Database error');
            mockNewslettersService.createNewsletter.mockRejectedValue(error);

            await expect(controller.createNewsLetter(mockCurrentUser, createDto)).rejects.toThrow(
                'Database error',
            );
        });
    });

    describe('PATCH /update/:id - updateNewLetter', () => {
        it('should update an existing newsletter', async () => {
            const newsletterId = '123e4567-e89b-12d3-a456-426614174000';
            const updateDto: NewsUpdateDto = {
                title: 'Updated Newsletter',
                content: 'Updated content',
            } as NewsUpdateDto;

            const expectedResult = {
                id: newsletterId,
                ...updateDto,
            };

            mockNewslettersService.updateNewsletter.mockResolvedValue(expectedResult);

            const result = await controller.updateNewLetter(
                mockCurrentUser,
                newsletterId,
                updateDto,
            );

            expect(result).toEqual(expectedResult);
            expect(service.updateNewsletter).toHaveBeenCalledWith(
                mockCurrentUser.id,
                newsletterId,
                updateDto,
            );
            expect(service.updateNewsletter).toHaveBeenCalledTimes(1);
        });

        it('should update newsletter with partial data', async () => {
            const newsletterId = '123e4567-e89b-12d3-a456-426614174000';
            const updateDto: NewsUpdateDto = {
                title: 'Updated Title Only',
            } as NewsUpdateDto;

            mockNewslettersService.updateNewsletter.mockResolvedValue({
                id: newsletterId,
                ...updateDto,
            });

            await controller.updateNewLetter(mockCurrentUser, newsletterId, updateDto);

            expect(service.updateNewsletter).toHaveBeenCalledWith(
                mockCurrentUser.id,
                newsletterId,
                updateDto,
            );
        });

        it('should handle different user ids during update', async () => {
            const newsletterId = '123e4567-e89b-12d3-a456-426614174000';
            const updateDto: NewsUpdateDto = {
                title: 'Updated',
            } as NewsUpdateDto;

            const users = [
                { id: 'user-1' },
                { id: 'user-2' },
                { id: 'user-3' },
            ] as CurrentUserInterface[];

            for (const user of users) {
                mockNewslettersService.updateNewsletter.mockResolvedValue({
                    id: newsletterId,
                });

                await controller.updateNewLetter(user, newsletterId, updateDto);

                expect(service.updateNewsletter).toHaveBeenCalledWith(
                    user.id,
                    newsletterId,
                    updateDto,
                );
            }
        });

        it('should propagate not found errors', async () => {
            const newsletterId = '123e4567-e89b-12d3-a456-426614174000';
            const updateDto: NewsUpdateDto = {
                title: 'Updated',
            } as NewsUpdateDto;

            const error = new Error('Newsletter not found');
            mockNewslettersService.updateNewsletter.mockRejectedValue(error);

            await expect(
                controller.updateNewLetter(mockCurrentUser, newsletterId, updateDto),
            ).rejects.toThrow('Newsletter not found');

            expect(service.updateNewsletter).toHaveBeenCalledWith(
                mockCurrentUser.id,
                newsletterId,
                updateDto,
            );
        });

        it('should propagate validation errors', async () => {
            const newsletterId = '123e4567-e89b-12d3-a456-426614174000';
            const updateDto: NewsUpdateDto = {} as NewsUpdateDto;

            const error = new Error('Invalid update data');
            mockNewslettersService.updateNewsletter.mockRejectedValue(error);

            await expect(
                controller.updateNewLetter(mockCurrentUser, newsletterId, updateDto),
            ).rejects.toThrow('Invalid update data');
        });
    });

    describe('DELETE /:id - deleteNewsLetter', () => {
        it('should delete a newsletter by id', async () => {
            const newsletterId = '123e4567-e89b-12d3-a456-426614174000';
            const expectedResult = {
                success: true,
                message: 'Newsletter deleted successfully',
            };

            mockNewslettersService.deleteNewLetter.mockResolvedValue(expectedResult);

            const result = await controller.deleteNewsLetter(newsletterId);

            expect(result).toEqual(expectedResult);
            expect(service.deleteNewLetter).toHaveBeenCalledWith(newsletterId);
            expect(service.deleteNewLetter).toHaveBeenCalledTimes(1);
        });

        it('should handle deletion of multiple newsletters', async () => {
            const newsletterIds = [
                '111e4567-e89b-12d3-a456-426614174000',
                '222e4567-e89b-12d3-a456-426614174000',
                '333e4567-e89b-12d3-a456-426614174000',
            ];

            for (const id of newsletterIds) {
                mockNewslettersService.deleteNewLetter.mockResolvedValue({
                    success: true,
                });

                await controller.deleteNewsLetter(id);

                expect(service.deleteNewLetter).toHaveBeenCalledWith(id);
            }

            expect(service.deleteNewLetter).toHaveBeenCalledTimes(newsletterIds.length);
        });

        it('should propagate not found errors during deletion', async () => {
            const newsletterId = '123e4567-e89b-12d3-a456-426614174000';
            const error = new Error('Newsletter not found');

            mockNewslettersService.deleteNewLetter.mockRejectedValue(error);

            await expect(controller.deleteNewsLetter(newsletterId)).rejects.toThrow(
                'Newsletter not found',
            );

            expect(service.deleteNewLetter).toHaveBeenCalledWith(newsletterId);
        });

        it('should handle service errors during deletion', async () => {
            const newsletterId = '123e4567-e89b-12d3-a456-426614174000';
            const error = new Error('Database connection failed');

            mockNewslettersService.deleteNewLetter.mockRejectedValue(error);

            await expect(controller.deleteNewsLetter(newsletterId)).rejects.toThrow(
                'Database connection failed',
            );
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle empty pagination dto', async () => {
            const paginationDto = new PaginationDto();
            const channel = NewsletterChannelEnum.EMAIL;

            mockNewslettersService.getAllNewsletters.mockResolvedValue({
                data: [],
                total: 0,
                page: 1,
                limit: 10,
            });

            await controller.nonDeletedNews(paginationDto, channel);

            expect(service.getAllNewsletters).toHaveBeenCalledWith(1, 10, expect.any(Object));
        });

        it('should handle concurrent requests', async () => {
            const paginationDto = new PaginationDto();
            const channel = NewsletterChannelEnum.EMAIL;

            mockNewslettersService.getAllNewsletters.mockResolvedValue({
                data: [],
                total: 0,
            });

            const promises = Array(5)
                .fill(null)
                .map(() => controller.nonDeletedNews(paginationDto, channel));

            await Promise.all(promises);

            expect(service.getAllNewsletters).toHaveBeenCalledTimes(5);
        });

        it('should handle service returning null', async () => {
            const newsletterId = '123e4567-e89b-12d3-a456-426614174000';

            mockNewslettersService.newsLetterDetails.mockResolvedValue(null);

            const result = await controller.findOne(newsletterId);

            expect(result).toBeNull();
        });

        it('should handle service returning undefined', async () => {
            const newsletterId = '123e4567-e89b-12d3-a456-426614174000';

            mockNewslettersService.newsLetterDetails.mockResolvedValue(undefined);

            const result = await controller.findOne(newsletterId);

            expect(result).toBeUndefined();
        });
    });

    describe('Service Integration', () => {
        it('should properly inject NewslettersService', () => {
            expect(controller['nlService']).toBeDefined();
            expect(controller['nlService']).toBe(service);
        });

        it('should call service methods with correct parameters', async () => {
            const paginationDto = new PaginationDto();
            paginationDto.page = 5;
            paginationDto.limit = 25;
            const channel = NewsletterChannelEnum.EMAIL;
            const status = NewsletterStatusEnum.SENT;
            const search = 'test';

            mockNewslettersService.getAllNewsletters.mockResolvedValue({});

            await controller.nonDeletedNews(paginationDto, channel, status, search);

            expect(service.getAllNewsletters).toHaveBeenCalledWith(5, 25, {
                channel,
                status,
                searchTerm: search,
            });
        });
    });

    describe('Decorator Coverage', () => {
        it('should have Controller decorator with correct path', () => {
            const metadata = Reflect.getMetadata('path', NewslettersController);
            expect(metadata).toBe('newsletter');
        });

        it('should have correct method decorators', () => {
            const methods = [
                'nonDeletedNews',
                'findOne',
                'createNewsLetter',
                'updateNewLetter',
                'deleteNewsLetter',
            ];

            methods.forEach((method) => {
                expect(controller[method]).toBeDefined();
            });
        });
    });

    describe('DTO Validation Coverage', () => {
        it('should work with valid PaginationDto values', async () => {
            const validPages = [1, 5, 10, 100];
            const validLimits = [1, 10, 50, 100];
            const channel = NewsletterChannelEnum.EMAIL;

            for (const page of validPages) {
                for (const limit of validLimits) {
                    const dto = new PaginationDto();
                    dto.page = page;
                    dto.limit = limit;

                    mockNewslettersService.getAllNewsletters.mockResolvedValue({});

                    await controller.nonDeletedNews(dto, channel);

                    expect(service.getAllNewsletters).toHaveBeenCalledWith(
                        page,
                        limit,
                        expect.any(Object),
                    );
                }
            }
        });
    });

    describe('Return Value Coverage', () => {
        it('should return exact service response for getAllNewsletters', async () => {
            const paginationDto = new PaginationDto();
            const channel = NewsletterChannelEnum.EMAIL;
            const serviceResponse = {
                data: [{ id: '1' }, { id: '2' }],
                total: 2,
                page: 1,
                limit: 10,
                hasMore: false,
            };

            mockNewslettersService.getAllNewsletters.mockResolvedValue(serviceResponse);

            const result = await controller.nonDeletedNews(paginationDto, channel);

            expect(result).toBe(serviceResponse);
        });

        it('should return exact service response for findOne', async () => {
            const newsletterId = '123e4567-e89b-12d3-a456-426614174000';
            const serviceResponse = {
                id: newsletterId,
                title: 'Test',
                createdAt: new Date(),
            };

            mockNewslettersService.newsLetterDetails.mockResolvedValue(serviceResponse);

            const result = await controller.findOne(newsletterId);

            expect(result).toBe(serviceResponse);
        });

        it('should return exact service response for createNewsLetter', async () => {
            const createDto: NewsCreateDto = { label: 'Test' } as NewsCreateDto;
            const serviceResponse = { id: '123', ...createDto };

            mockNewslettersService.createNewsletter.mockResolvedValue(serviceResponse);

            const result = await controller.createNewsLetter(mockCurrentUser, createDto);

            expect(result).toBe(serviceResponse);
        });

        it('should return exact service response for updateNewLetter', async () => {
            const newsletterId = '123e4567-e89b-12d3-a456-426614174000';
            const updateDto: NewsUpdateDto = {
                title: 'Updated',
            } as NewsUpdateDto;
            const serviceResponse = { id: newsletterId, ...updateDto };

            mockNewslettersService.updateNewsletter.mockResolvedValue(serviceResponse);

            const result = await controller.updateNewLetter(
                mockCurrentUser,
                newsletterId,
                updateDto,
            );

            expect(result).toBe(serviceResponse);
        });

        it('should return exact service response for deleteNewsLetter', async () => {
            const newsletterId = '123e4567-e89b-12d3-a456-426614174000';
            const serviceResponse = { deleted: true, id: newsletterId };

            mockNewslettersService.deleteNewLetter.mockResolvedValue(serviceResponse);

            const result = await controller.deleteNewsLetter(newsletterId);

            expect(result).toBe(serviceResponse);
        });
    });
});
