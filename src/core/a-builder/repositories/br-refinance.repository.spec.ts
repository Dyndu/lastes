import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BrRefinanceRepository } from './br-refinance.repository';
import { BrRefinanceEntity } from '../entities';

describe('BrRefinanceRepository', () => {
    let brRefinanceRepository: BrRefinanceRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BrRefinanceRepository,
                {
                    provide: getRepositoryToken(BrRefinanceEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        brRefinanceRepository = module.get<BrRefinanceRepository>(BrRefinanceRepository);
    });

    it('should be defined', () => {
        expect(brRefinanceRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(brRefinanceRepository['logger']).toBeDefined();
    });
});
