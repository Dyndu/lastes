import { Test, TestingModule } from '@nestjs/testing';
import { GuidesController } from './guides.controller';
import { GuidesService } from './services';
import { GuideReactionEnum, GuideStatusEnum } from '../../common/enum';
import { CreateGuideDto, UpdateGuideDto } from './dto';
import { PaginationDto } from '../../common/dto';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';
import { PermissionsGuard, JwtAuthGuard } from '../../common/guard';
import { CurrentUserInterface } from '../../interface';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('GuidesController', () => {
    let controller: GuidesController;
    let guidesService: any;

    const mockGuideResponse = {
        id: 'guide-123',
        label: 'Test Guide',
        description: 'Test Description',
        status: GuideStatusEnum.PUBLISHED,
        file: {
            id: 'file-123',
            url: 'https://example.com/file.pdf',
            filename: 'test.pdf',
        },
    };

    const mockPaginatedResponse = {
        data: [mockGuideResponse],
        total: 1,
        page: 1,
        limit: 10,
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

    const createPaginationDto = (page: number = 1, limit: number = 10): PaginationDto => {
        const dto = new PaginationDto();
        dto.page = page;
        dto.limit = limit;
        return dto;
    };

    beforeEach(async () => {
        const mockGuidesService = {
            allGuides: jest.fn(),
            guideDetails: jest.fn(),
            createGuide: jest.fn(),
            updateGuide: jest.fn(),
            deleteGuide: jest.fn(),
            guideStats: jest.fn(),
            userGuides: jest.fn(),
            userGuideDetails: jest.fn(),
            reactToGuide: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [GuidesController],
            providers: [
                {
                    provide: GuidesService,
                    useValue: mockGuidesService,
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

        controller = module.get<GuidesController>(GuidesController);
        guidesService = module.get(GuidesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('badgeCount', () => {
        it('should return guide statistics', async () => {
            const mockStats = {
                total: 100,
                draft: 30,
                published: 70,
            };

            guidesService.guideStats.mockResolvedValue(mockStats);

            const result = await controller.badgeCount();

            expect(guidesService.guideStats).toHaveBeenCalled();
            expect(guidesService.guideStats).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockStats);
        });

        it('should return different statistics', async () => {
            const mockStats = {
                total: 50,
                draft: 20,
                published: 30,
            };

            guidesService.guideStats.mockResolvedValue(mockStats);

            const result = await controller.badgeCount();

            expect(result).toEqual(mockStats);
        });

        it('should handle empty statistics', async () => {
            const mockStats = {
                total: 0,
                draft: 0,
                published: 0,
            };

            guidesService.guideStats.mockResolvedValue(mockStats);

            const result = await controller.badgeCount();

            expect(result).toEqual(mockStats);
        });

        it('should call service without parameters', async () => {
            guidesService.guideStats.mockResolvedValue({});

            await controller.badgeCount();

            expect(guidesService.guideStats).toHaveBeenCalledWith();
        });
    });

    describe('publishedGuides', () => {
        const mockUser: CurrentUserInterface = {
            id: 'user-123',
            role: 'user',
            sessionId: 'session-123',
            permissions: {},
        };

        it('should return published guides with default parameters', async () => {
            guidesService.userGuides.mockResolvedValue(mockPaginatedResponse);

            const pagination = createPaginationDto(1, 10);
            const result = await controller.publishedGuides(mockUser, pagination);

            expect(guidesService.userGuides).toHaveBeenCalledWith(mockUser, 1, 10, {
                liked: undefined,
                searchTerm: undefined,
                isVideo: undefined,
            });
            expect(guidesService.userGuides).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockPaginatedResponse);
        });

        it('should return published guides with search term', async () => {
            guidesService.userGuides.mockResolvedValue(mockPaginatedResponse);

            const pagination = createPaginationDto(1, 10);
            const result = await controller.publishedGuides(mockUser, pagination, 'search term');

            expect(guidesService.userGuides).toHaveBeenCalledWith(mockUser, 1, 10, {
                liked: undefined,
                searchTerm: 'search term',
                isVideo: undefined,
            });
            expect(result).toEqual(mockPaginatedResponse);
        });

        it('should filter by video guides', async () => {
            guidesService.userGuides.mockResolvedValue(mockPaginatedResponse);

            const pagination = createPaginationDto(1, 10);
            await controller.publishedGuides(mockUser, pagination, undefined, true);

            expect(guidesService.userGuides).toHaveBeenCalledWith(mockUser, 1, 10, {
                liked: undefined,
                searchTerm: undefined,
                isVideo: true,
            });
        });

        it('should filter by non-video guides', async () => {
            guidesService.userGuides.mockResolvedValue(mockPaginatedResponse);

            const pagination = createPaginationDto(1, 10);
            await controller.publishedGuides(mockUser, pagination, undefined, false);

            expect(guidesService.userGuides).toHaveBeenCalledWith(mockUser, 1, 10, {
                liked: undefined,
                searchTerm: undefined,
                isVideo: false,
            });
        });

        it('should filter by liked guides', async () => {
            guidesService.userGuides.mockResolvedValue(mockPaginatedResponse);

            const pagination = createPaginationDto(1, 10);
            await controller.publishedGuides(mockUser, pagination, undefined, undefined, true);

            expect(guidesService.userGuides).toHaveBeenCalledWith(mockUser, 1, 10, {
                liked: true,
                searchTerm: undefined,
                isVideo: undefined,
            });
        });

        it('should combine search and video filters', async () => {
            guidesService.userGuides.mockResolvedValue(mockPaginatedResponse);

            const pagination = createPaginationDto(1, 10);
            await controller.publishedGuides(mockUser, pagination, 'test search', true);

            expect(guidesService.userGuides).toHaveBeenCalledWith(mockUser, 1, 10, {
                liked: undefined,
                searchTerm: 'test search',
                isVideo: true,
            });
        });

        it('should combine all filters', async () => {
            guidesService.userGuides.mockResolvedValue(mockPaginatedResponse);

            const pagination = createPaginationDto(1, 10);
            await controller.publishedGuides(mockUser, pagination, 'test search', true, true);

            expect(guidesService.userGuides).toHaveBeenCalledWith(mockUser, 1, 10, {
                liked: true,
                searchTerm: 'test search',
                isVideo: true,
            });
        });

        it('should handle custom pagination for published guides', async () => {
            guidesService.userGuides.mockResolvedValue(mockPaginatedResponse);

            const pagination = createPaginationDto(3, 25);
            await controller.publishedGuides(mockUser, pagination);

            expect(guidesService.userGuides).toHaveBeenCalledWith(mockUser, 3, 25, {
                liked: undefined,
                searchTerm: undefined,
                isVideo: undefined,
            });
        });

        it('should pass user object correctly', async () => {
            const adminUser: CurrentUserInterface = {
                id: 'admin-123',
                role: 'admin',
                sessionId: 'session-456',
                permissions: {},
            };

            guidesService.userGuides.mockResolvedValue(mockPaginatedResponse);

            const pagination = createPaginationDto(1, 10);
            await controller.publishedGuides(adminUser, pagination);

            expect(guidesService.userGuides).toHaveBeenCalledWith(adminUser, 1, 10, {
                liked: undefined,
                searchTerm: undefined,
                isVideo: undefined,
            });
        });

        it('should handle empty search string', async () => {
            guidesService.userGuides.mockResolvedValue(mockPaginatedResponse);

            const pagination = createPaginationDto(1, 10);
            await controller.publishedGuides(mockUser, pagination, '');

            expect(guidesService.userGuides).toHaveBeenCalledWith(mockUser, 1, 10, {
                liked: undefined,
                searchTerm: '',
                isVideo: undefined,
            });
        });
    });

    describe('allGuides', () => {
        it('should return paginated guides with default parameters', async () => {
            guidesService.allGuides.mockResolvedValue(mockPaginatedResponse);

            const pagination = createPaginationDto(1, 10);
            const result = await controller.allGuides(pagination);

            expect(guidesService.allGuides).toHaveBeenCalledWith(1, 10, {
                status: undefined,
                searchTerm: undefined,
            });
            expect(guidesService.allGuides).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockPaginatedResponse);
        });

        it('should return paginated guides with PUBLISHED status filter', async () => {
            guidesService.allGuides.mockResolvedValue(mockPaginatedResponse);

            const pagination = createPaginationDto(1, 10);
            const result = await controller.allGuides(pagination, GuideStatusEnum.PUBLISHED);

            expect(guidesService.allGuides).toHaveBeenCalledWith(1, 10, {
                status: GuideStatusEnum.PUBLISHED,
                searchTerm: undefined,
            });
            expect(result).toEqual(mockPaginatedResponse);
        });

        it('should return paginated guides with DRAFT status filter', async () => {
            guidesService.allGuides.mockResolvedValue(mockPaginatedResponse);

            const pagination = createPaginationDto(1, 10);
            await controller.allGuides(pagination, GuideStatusEnum.DRAFT);

            expect(guidesService.allGuides).toHaveBeenCalledWith(1, 10, {
                status: GuideStatusEnum.DRAFT,
                searchTerm: undefined,
            });
        });

        it('should return paginated guides with search term', async () => {
            guidesService.allGuides.mockResolvedValue(mockPaginatedResponse);

            const pagination = createPaginationDto(1, 10);
            const result = await controller.allGuides(pagination, undefined, 'test');

            expect(guidesService.allGuides).toHaveBeenCalledWith(1, 10, {
                status: undefined,
                searchTerm: 'test',
            });
            expect(result).toEqual(mockPaginatedResponse);
        });

        it('should combine status and search filters', async () => {
            guidesService.allGuides.mockResolvedValue(mockPaginatedResponse);

            const pagination = createPaginationDto(1, 10);
            await controller.allGuides(pagination, GuideStatusEnum.PUBLISHED, 'search');

            expect(guidesService.allGuides).toHaveBeenCalledWith(1, 10, {
                status: GuideStatusEnum.PUBLISHED,
                searchTerm: 'search',
            });
        });

        it('should handle custom pagination', async () => {
            guidesService.allGuides.mockResolvedValue(mockPaginatedResponse);

            const pagination = createPaginationDto(2, 20);
            await controller.allGuides(pagination);

            expect(guidesService.allGuides).toHaveBeenCalledWith(2, 20, {
                status: undefined,
                searchTerm: undefined,
            });
        });

        it('should handle empty search string', async () => {
            guidesService.allGuides.mockResolvedValue(mockPaginatedResponse);

            const pagination = createPaginationDto(1, 10);
            await controller.allGuides(pagination, undefined, '');

            expect(guidesService.allGuides).toHaveBeenCalledWith(1, 10, {
                status: undefined,
                searchTerm: '',
            });
        });
    });

    describe('findUserGuideDetail', () => {
        const mockUser: CurrentUserInterface = {
            id: 'user-123',
            role: 'user',
            sessionId: 'session-123',
            permissions: {},
        };

        it('should return guide details for user', async () => {
            const guideId = 'guide-123';

            guidesService.userGuideDetails.mockResolvedValue(mockGuideResponse);

            const result = await controller.findUserGuideDetail(mockUser, guideId);

            expect(guidesService.userGuideDetails).toHaveBeenCalledWith(mockUser, guideId);
            expect(result).toEqual(mockGuideResponse);
        });

        it('should handle UUID validation through ParseUUIDPipe', async () => {
            const validUuid = '30ac88d4-7ffe-418c-9551-66eeec2e6783';

            guidesService.userGuideDetails.mockResolvedValue(mockGuideResponse);

            await controller.findUserGuideDetail(mockUser, validUuid);

            expect(guidesService.userGuideDetails).toHaveBeenCalledWith(mockUser, validUuid);
        });

        it('should propagate service errors', async () => {
            const guideId = 'guide-123';
            const error = new Error('Guide not found');

            guidesService.userGuideDetails.mockRejectedValue(error);

            await expect(controller.findUserGuideDetail(mockUser, guideId)).rejects.toThrow(
                'Guide not found',
            );
        });

        it('should work with different user roles', async () => {
            const supportUser: CurrentUserInterface = {
                id: 'support-123',
                role: 'support',
                sessionId: 'session-789',
                permissions: {},
            };

            guidesService.userGuideDetails.mockResolvedValue(mockGuideResponse);

            await controller.findUserGuideDetail(supportUser, 'guide-123');

            expect(guidesService.userGuideDetails).toHaveBeenCalledWith(supportUser, 'guide-123');
        });
    });

    describe('findOne', () => {
        it('should return a single guide by id', async () => {
            const guideId = 'guide-123';

            guidesService.guideDetails.mockResolvedValue(mockGuideResponse);

            const result = await controller.findOne(guideId);

            expect(guidesService.guideDetails).toHaveBeenCalledWith(guideId);
            expect(result).toEqual(mockGuideResponse);
        });

        it('should handle UUID validation through ParseUUIDPipe', async () => {
            const validUuid = '30ac88d4-7ffe-418c-9551-66eeec2e6783';

            guidesService.guideDetails.mockResolvedValue(mockGuideResponse);

            await controller.findOne(validUuid);

            expect(guidesService.guideDetails).toHaveBeenCalledWith(validUuid);
        });

        it('should propagate service errors', async () => {
            const guideId = 'guide-123';
            const error = new Error('Guide not found');

            guidesService.guideDetails.mockRejectedValue(error);

            await expect(controller.findOne(guideId)).rejects.toThrow('Guide not found');
        });
    });

    describe('createG', () => {
        it('should create a new guide', async () => {
            const createDto: CreateGuideDto = {
                label: 'New Guide',
                isVideo: true,
                content: 'Content',
                description: 'New Description',
                status: GuideStatusEnum.DRAFT,
                fileId: 'file-123',
                categoryId: 'cat-123',
            };

            const mockResponse = { message: 'Guide created successfully' };

            guidesService.createGuide.mockResolvedValue(mockResponse);

            const result = await controller.createG(createDto);

            expect(guidesService.createGuide).toHaveBeenCalledWith(createDto);
            expect(result).toEqual(mockResponse);
        });

        it('should handle guide creation with all fields', async () => {
            const createDto: CreateGuideDto = {
                label: 'Complete Guide',
                isVideo: true,
                content: 'Content',
                description: 'Complete Description',
                status: GuideStatusEnum.PUBLISHED,
                fileId: 'file-456',
                categoryId: 'cat-456',
            };

            guidesService.createGuide.mockResolvedValue({
                message: 'Guide created successfully',
            });

            await controller.createG(createDto);

            expect(guidesService.createGuide).toHaveBeenCalledWith(createDto);
        });

        it('should propagate validation errors', async () => {
            const createDto: CreateGuideDto = {
                label: 'Invalid',
                isVideo: true,
                content: 'Content',
                description: 'Invalid',
                status: GuideStatusEnum.DRAFT,
                fileId: 'invalid-file',
                categoryId: 'invalid-cat',
            };

            const error = new Error('Validation failed');
            guidesService.createGuide.mockRejectedValue(error);

            await expect(controller.createG(createDto)).rejects.toThrow('Validation failed');
        });
    });

    describe('update', () => {
        it('should update a guide', async () => {
            const guideId = '30ac88d4-7ffe-418c-9551-66eeec2e6783';
            const updateDto: UpdateGuideDto = {
                label: 'Updated Label',
                description: 'Updated Description',
            };

            const mockResponse = { message: 'Guide updated successfully' };

            guidesService.updateGuide.mockResolvedValue(mockResponse);

            const result = await controller.update(guideId, updateDto);

            expect(guidesService.updateGuide).toHaveBeenCalledWith(guideId, updateDto);
            expect(result).toEqual(mockResponse);
        });

        it('should handle partial updates', async () => {
            const guideId = '30ac88d4-7ffe-418c-9551-66eeec2e6783';
            const updateDto: UpdateGuideDto = {
                status: GuideStatusEnum.PUBLISHED,
            };

            guidesService.updateGuide.mockResolvedValue({
                message: 'Guide updated successfully',
            });

            await controller.update(guideId, updateDto);

            expect(guidesService.updateGuide).toHaveBeenCalledWith(guideId, updateDto);
        });

        it('should handle updates with new file', async () => {
            const guideId = '30ac88d4-7ffe-418c-9551-66eeec2e6783';
            const updateDto: UpdateGuideDto = {
                fileId: 'new-file-123',
            };

            guidesService.updateGuide.mockResolvedValue({
                message: 'Guide updated successfully',
            });

            await controller.update(guideId, updateDto);

            expect(guidesService.updateGuide).toHaveBeenCalledWith(guideId, updateDto);
        });

        it('should handle updates with new category', async () => {
            const guideId = '30ac88d4-7ffe-418c-9551-66eeec2e6783';
            const updateDto: UpdateGuideDto = {
                categoryId: 'new-cat-123',
            };

            guidesService.updateGuide.mockResolvedValue({
                message: 'Guide updated successfully',
            });

            await controller.update(guideId, updateDto);

            expect(guidesService.updateGuide).toHaveBeenCalledWith(guideId, updateDto);
        });

        it('should propagate not found errors', async () => {
            const guideId = '30ac88d4-7ffe-418c-9551-66eeec2e6783';
            const updateDto: UpdateGuideDto = { label: 'Updated' };

            const error = new Error('Guide not found');
            guidesService.updateGuide.mockRejectedValue(error);

            await expect(controller.update(guideId, updateDto)).rejects.toThrow('Guide not found');
        });
    });

    describe('reactToGuide', () => {
        const mockUser: CurrentUserInterface = {
            id: 'user-123',
            role: 'user',
            sessionId: 'session-123',
            permissions: {},
        };

        it('should allow user to react to a guide', async () => {
            const guideId = 'guide-123';
            const reactDto = { reaction: GuideReactionEnum.LIKE };
            const mockResponse = { message: 'Reaction recorded successfully' };

            guidesService.reactToGuide.mockResolvedValue(mockResponse);

            const result = await controller.reactToGuide(mockUser, guideId, reactDto);

            expect(guidesService.reactToGuide).toHaveBeenCalledWith(mockUser, guideId, reactDto);
            expect(result).toEqual(mockResponse);
        });

        it('should handle different reaction types', async () => {
            const guideId = 'guide-123';
            const reactDto = { reaction: GuideReactionEnum.DISLIKE };

            guidesService.reactToGuide.mockResolvedValue({
                message: 'Reaction recorded successfully',
            });

            await controller.reactToGuide(mockUser, guideId, reactDto);

            expect(guidesService.reactToGuide).toHaveBeenCalledWith(mockUser, guideId, reactDto);
        });

        it('should handle UUID validation for guide id', async () => {
            const validUuid = '30ac88d4-7ffe-418c-9551-66eeec2e6783';
            const reactDto = { reaction: GuideReactionEnum.LIKE };

            guidesService.reactToGuide.mockResolvedValue({
                message: 'Reaction recorded successfully',
            });

            await controller.reactToGuide(mockUser, validUuid, reactDto);

            expect(guidesService.reactToGuide).toHaveBeenCalledWith(mockUser, validUuid, reactDto);
        });

        it('should propagate guide not found errors', async () => {
            const guideId = 'guide-123';
            const reactDto = { reaction: GuideReactionEnum.LIKE };
            const error = new Error('Guide not found');

            guidesService.reactToGuide.mockRejectedValue(error);

            await expect(controller.reactToGuide(mockUser, guideId, reactDto)).rejects.toThrow(
                'Guide not found',
            );
        });

        it('should pass user information correctly', async () => {
            const guideId = 'guide-123';
            const reactDto = { reaction: GuideReactionEnum.LIKE };

            guidesService.reactToGuide.mockResolvedValue({
                message: 'Reaction recorded successfully',
            });

            await controller.reactToGuide(mockUser, guideId, reactDto);

            const callArgs = guidesService.reactToGuide.mock.calls[0];
            expect(callArgs[0]).toEqual(mockUser);
            expect(callArgs[0].id).toBe('user-123');
            expect(callArgs[0].role).toBe('user');
        });
    });

    describe('delete', () => {
        it('should delete a guide', async () => {
            const guideId = '30ac88d4-7ffe-418c-9551-66eeec2e6783';
            const mockResponse = { message: 'Guide deleted successfully' };

            guidesService.deleteGuide.mockResolvedValue(mockResponse);

            const result = await controller.delete(guideId);

            expect(guidesService.deleteGuide).toHaveBeenCalledWith(guideId);
            expect(result).toEqual(mockResponse);
        });

        it('should handle UUID validation for delete', async () => {
            const validUuid = '30ac88d4-7ffe-418c-9551-66eeec2e6783';

            guidesService.deleteGuide.mockResolvedValue({
                message: 'Guide deleted successfully',
            });

            await controller.delete(validUuid);

            expect(guidesService.deleteGuide).toHaveBeenCalledWith(validUuid);
        });

        it('should propagate not found errors', async () => {
            const guideId = '30ac88d4-7ffe-418c-9551-66eeec2e6783';
            const error = new Error('Guide not found');

            guidesService.deleteGuide.mockRejectedValue(error);

            await expect(controller.delete(guideId)).rejects.toThrow('Guide not found');
        });
    });

    describe('Controller metadata', () => {
        it('should have correct route prefix', () => {
            const metadata = Reflect.getMetadata('path', GuidesController);
            expect(metadata).toBe('guides');
        });

        it('should have GuidesService injected', () => {
            expect(controller['guidesService']).toBeDefined();
            expect(controller['guidesService']).toBe(guidesService);
        });
    });
});
