import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DtiOtherIncomeRepository } from './dti-other-income.repository';
import { DtiOtherIncomeEntity } from '../entities';

describe('DtiOtherIncomeRepository', () => {
    let dtiOtherIncomeRepository: DtiOtherIncomeRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DtiOtherIncomeRepository,
                {
                    provide: getRepositoryToken(DtiOtherIncomeEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        dtiOtherIncomeRepository = module.get<DtiOtherIncomeRepository>(DtiOtherIncomeRepository);
    });

    it('should be defined', () => {
        expect(dtiOtherIncomeRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(dtiOtherIncomeRepository['logger']).toBeDefined();
    });
});
