import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CategoriesRepository } from './categories.repository';
import { CategoryEntity } from './entities/category.entity';

describe('CategoriesRepository', () => {
    let repository: CategoriesRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CategoriesRepository,
                {
                    provide: getRepositoryToken(CategoryEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        repository = module.get<CategoriesRepository>(CategoriesRepository);
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(repository['logger']).toBeDefined();
    });
});
