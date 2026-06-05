import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { CategoriesService } from './categories.service';
import { CategoriesRepository } from './categories.repository';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';
import { OtherUtils } from '../../utils/services/tools';
import { CategoryEntity } from './entities/category.entity';

describe('CategoriesService', () => {
    let service: CategoriesService;
    let categoriesRepository: jest.Mocked<CategoriesRepository>;
    let logger: any;

    beforeEach(async () => {
        logger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const categoriesRepositoryMock = {
            find: jest.fn(),
        };

        const errorHandlerMock = {
            notFound: jest.fn(),
        };

        const otherUtilsMock = {
            formatCriteria: jest.fn(),
        };

        const envConfigServiceMock = {
            gCFinance: 'Finance',
            gCREstate: 'Real Estate',
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CategoriesService,
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: logger,
                },
                {
                    provide: CategoriesRepository,
                    useValue: categoriesRepositoryMock,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: errorHandlerMock,
                },
                {
                    provide: OtherUtils,
                    useValue: otherUtilsMock,
                },
                {
                    provide: EnvConfigService,
                    useValue: envConfigServiceMock,
                },
            ],
        }).compile();

        service = module.get<CategoriesService>(CategoriesService);
        categoriesRepository = module.get(CategoriesRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('transform', () => {
        it('should transform a category entities to simplified object', () => {
            const category = {
                id: 1,
                label: 'Finance',
                deleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any;

            const result = service.transform(category);

            expect(result).toEqual({
                id: 1,
                label: 'Finance',
            });
        });

        it('should only include id and label in transformed object', () => {
            const category = {
                id: 5,
                label: 'Real Estate',
                deleted: false,
                someOtherProperty: 'value',
            } as any;

            const result = service.transform(category);

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('label');
            expect(result).not.toHaveProperty('deleted');
            expect(result).not.toHaveProperty('someOtherProperty');
        });
    });

    describe('transformCats', () => {
        it('should transform an array of categories', () => {
            const categories = [
                { id: 1, label: 'Finance', deleted: false },
                { id: 2, label: 'Real Estate', deleted: false },
                { id: 3, label: 'Technology', deleted: false },
            ] as any[];

            const result = service.transformCats(categories);

            expect(result).toEqual([
                { id: 1, label: 'Finance' },
                { id: 2, label: 'Real Estate' },
                { id: 3, label: 'Technology' },
            ]);
            expect(result).toHaveLength(3);
        });

        it('should return empty array when given empty array', () => {
            const categories = [] as CategoryEntity[];

            const result = service.transformCats(categories);

            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });

        it('should transform single category in array', () => {
            const categories = [{ id: 1, label: 'Finance', deleted: false }] as any[];

            const result = service.transformCats(categories);

            expect(result).toEqual([{ id: 1, label: 'Finance' }]);
            expect(result).toHaveLength(1);
        });
    });

    describe('allCategories', () => {
        it('should retrieve and transform all non-deleted categories', async () => {
            const mockCategories = [
                { id: 1, label: 'Finance', deleted: false },
                { id: 2, label: 'Real Estate', deleted: false },
                { id: 3, label: 'Technology', deleted: false },
            ] as any[];

            categoriesRepository.find.mockResolvedValue(mockCategories);

            const result = await service.allCategories();

            expect(logger.info).toHaveBeenCalledWith('Retrieve all permissions');
            expect(categoriesRepository.find).toHaveBeenCalledWith({
                where: { deleted: false },
            });
            expect(result).toEqual([
                { id: 1, label: 'Finance' },
                { id: 2, label: 'Real Estate' },
                { id: 3, label: 'Technology' },
            ]);
        });

        it('should return empty array when no categories exist', async () => {
            categoriesRepository.find.mockResolvedValue([]);

            const result = await service.allCategories();

            expect(logger.info).toHaveBeenCalledWith('Retrieve all permissions');
            expect(categoriesRepository.find).toHaveBeenCalledWith({
                where: { deleted: false },
            });
            expect(result).toEqual([]);
        });

        it('should filter out deleted categories', async () => {
            categoriesRepository.find.mockResolvedValue([]);

            await service.allCategories();

            expect(categoriesRepository.find).toHaveBeenCalledWith({
                where: { deleted: false },
            });
        });

        it('should transform categories correctly when only one exists', async () => {
            const mockCategories = [{ id: 1, label: 'Finance', deleted: false }] as any[];

            categoriesRepository.find.mockResolvedValue(mockCategories);

            const result = await service.allCategories();

            expect(result).toEqual([{ id: 1, label: 'Finance' }]);
            expect(result).toHaveLength(1);
        });

        it('should log info message before retrieving categories', async () => {
            categoriesRepository.find.mockResolvedValue([]);

            await service.allCategories();

            expect(logger.info).toHaveBeenCalledTimes(1);
            expect(logger.info).toHaveBeenCalledWith('Retrieve all permissions');
        });

        it('should handle categories with additional properties correctly', async () => {
            const mockCategories = [
                {
                    id: 1,
                    label: 'Finance',
                    deleted: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    extraField: 'should be removed',
                },
            ] as any[];

            categoriesRepository.find.mockResolvedValue(mockCategories);

            const result = await service.allCategories();

            expect(result).toEqual([{ id: 1, label: 'Finance' }]);
            expect(result[0]).not.toHaveProperty('deleted');
            expect(result[0]).not.toHaveProperty('createdAt');
            expect(result[0]).not.toHaveProperty('extraField');
        });
    });
});
