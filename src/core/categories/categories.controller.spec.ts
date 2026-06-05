import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';
import { PermissionsGuard, JwtAuthGuard } from '../../common/guard';

describe('CategoriesController', () => {
    let controller: CategoriesController;
    let service: CategoriesService;

    const mockCategoriesService = {
        allCategories: jest.fn(),
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

    const mockCategories = [
        {
            id: '1',
            name: 'Category 1',
            description: 'Test category 1',
            deletedAt: null,
        },
        {
            id: '2',
            name: 'Category 2',
            description: 'Test category 2',
            deletedAt: null,
        },
    ];

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CategoriesController],
            providers: [
                {
                    provide: CategoriesService,
                    useValue: mockCategoriesService,
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

        controller = module.get<CategoriesController>(CategoriesController);
        service = module.get<CategoriesService>(CategoriesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('allCats', () => {
        it('should return all non-deleted categories', async () => {
            mockCategoriesService.allCategories.mockResolvedValue(mockCategories);

            const result = await controller.allCats();

            expect(result).toEqual(mockCategories);
            expect(service.allCategories).toHaveBeenCalledTimes(1);
            expect(service.allCategories).toHaveBeenCalledWith();
        });

        it('should return empty array when no categories exist', async () => {
            mockCategoriesService.allCategories.mockResolvedValue([]);

            const result = await controller.allCats();

            expect(result).toEqual([]);
            expect(service.allCategories).toHaveBeenCalledTimes(1);
        });

        it('should propagate service errors', async () => {
            const error = new Error('Database connection failed');
            mockCategoriesService.allCategories.mockRejectedValue(error);

            await expect(controller.allCats()).rejects.toThrow('Database connection failed');
            expect(service.allCategories).toHaveBeenCalledTimes(1);
        });

        it('should handle service returning null or undefined', async () => {
            mockCategoriesService.allCategories.mockResolvedValue(null);

            const result = await controller.allCats();

            expect(result).toBeNull();
            expect(service.allCategories).toHaveBeenCalledTimes(1);
        });

        it('should call service method without parameters', async () => {
            mockCategoriesService.allCategories.mockResolvedValue(mockCategories);

            await controller.allCats();

            expect(service.allCategories).toHaveBeenCalledWith();
        });

        it('should handle large number of categories', async () => {
            const largeArray = Array.from({ length: 1000 }, (_, i) => ({
                id: `${i}`,
                name: `Category ${i}`,
                description: `Test category ${i}`,
                deletedAt: null,
            }));

            mockCategoriesService.allCategories.mockResolvedValue(largeArray);

            const result = await controller.allCats();

            expect(result).toHaveLength(1000);
            expect(service.allCategories).toHaveBeenCalledTimes(1);
        });
    });

    describe('Controller metadata', () => {
        it('should have correct controller path', () => {
            const path = Reflect.getMetadata('path', CategoriesController);
            expect(path).toBe('g-categories');
        });

        it('should have GET method metadata on allCats', () => {
            const path = Reflect.getMetadata('path', controller.allCats);
            expect(path).toBeDefined();
        });
    });

    describe('Service integration', () => {
        it('should have CategoriesService injected', () => {
            expect(service).toBeDefined();
            expect(service).toBe(mockCategoriesService);
        });

        it('should call correct service method', async () => {
            mockCategoriesService.allCategories.mockResolvedValue([]);

            await controller.allCats();

            expect(mockCategoriesService.allCategories).toHaveBeenCalled();
        });
    });

    describe('Error handling', () => {
        it('should handle timeout errors', async () => {
            const timeoutError = new Error('Request timeout');
            mockCategoriesService.allCategories.mockRejectedValue(timeoutError);

            await expect(controller.allCats()).rejects.toThrow('Request timeout');
        });

        it('should handle validation errors', async () => {
            const validationError = new Error('Validation failed');
            mockCategoriesService.allCategories.mockRejectedValue(validationError);

            await expect(controller.allCats()).rejects.toThrow('Validation failed');
        });

        it('should maintain service call count on error', async () => {
            mockCategoriesService.allCategories.mockRejectedValue(new Error('Test error'));

            try {
                await controller.allCats();
            } catch (error) {}

            expect(service.allCategories).toHaveBeenCalledTimes(1);
        });
    });

    describe('Response handling', () => {
        it('should return categories with correct structure', async () => {
            mockCategoriesService.allCategories.mockResolvedValue(mockCategories);

            const result = await controller.allCats();

            expect(Array.isArray(result)).toBe(true);
            result.forEach((category) => {
                expect(category).toHaveProperty('id');
                expect(category).toHaveProperty('name');
                expect(category).toHaveProperty('description');
                expect(category).toHaveProperty('deletedAt');
            });
        });

        it('should not modify service response', async () => {
            const originalData = [...mockCategories];
            mockCategoriesService.allCategories.mockResolvedValue(mockCategories);

            const result = await controller.allCats();

            expect(result).toEqual(originalData);
        });
    });
});
