import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RefinanceRepository } from './refinance.repository';
import { RefinanceEntity } from '../entities';

describe('RefinanceRepository', () => {
    let refinanceRepository: RefinanceRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RefinanceRepository,
                {
                    provide: getRepositoryToken(RefinanceEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        refinanceRepository = module.get<RefinanceRepository>(RefinanceRepository);
    });

    it('should be defined', () => {
        expect(refinanceRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(refinanceRepository['logger']).toBeDefined();
    });
});
