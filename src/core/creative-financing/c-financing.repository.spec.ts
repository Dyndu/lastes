import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CFinancingRepository } from './c-financing.repository';
import { CFinancingEntity } from './entities/c-financing.entity';

describe('CFinancingRepository', () => {
    let cFinancingRepository: CFinancingRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CFinancingRepository,
                {
                    provide: getRepositoryToken(CFinancingEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        cFinancingRepository = module.get<CFinancingRepository>(CFinancingRepository);
    });

    it('should be defined', () => {
        expect(cFinancingRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(cFinancingRepository['logger']).toBeDefined();
    });
});
