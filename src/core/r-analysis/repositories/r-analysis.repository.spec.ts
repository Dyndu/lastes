import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RAnalysisRepository } from './r-analysis.repository';
import { RAnalysisEntity } from '../entities';

describe('RAnalysisRepository', () => {
    let acquisitionDetailRepository: RAnalysisRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RAnalysisRepository,
                {
                    provide: getRepositoryToken(RAnalysisEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        acquisitionDetailRepository = module.get<RAnalysisRepository>(RAnalysisRepository);
    });

    it('should be defined', () => {
        expect(acquisitionDetailRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(acquisitionDetailRepository['logger']).toBeDefined();
    });
});
