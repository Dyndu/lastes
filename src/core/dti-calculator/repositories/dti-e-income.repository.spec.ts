import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DtiEIncomeRepository } from './dti-e-income.repository';
import { DtiEIncomeEntity } from '../entities';

describe('DtiEIncomeRepository', () => {
    let dtiEIncomeRepository: DtiEIncomeRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DtiEIncomeRepository,
                {
                    provide: getRepositoryToken(DtiEIncomeEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        dtiEIncomeRepository = module.get<DtiEIncomeRepository>(DtiEIncomeRepository);
    });

    it('should be defined', () => {
        expect(dtiEIncomeRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(dtiEIncomeRepository['logger']).toBeDefined();
    });
});
