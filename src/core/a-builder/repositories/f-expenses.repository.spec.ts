import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FExpensesRepository } from './f-expenses.repository';
import { FExpensesEntity } from '../entities';

describe('FExpensesRepository', () => {
    let eRepairsRepository: FExpensesRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FExpensesRepository,
                {
                    provide: getRepositoryToken(FExpensesEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        eRepairsRepository = module.get<FExpensesRepository>(FExpensesRepository);
    });

    it('should be defined', () => {
        expect(eRepairsRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(eRepairsRepository['logger']).toBeDefined();
    });
});
