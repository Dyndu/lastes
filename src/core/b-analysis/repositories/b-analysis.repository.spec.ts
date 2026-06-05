import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BAnalysisRepository } from './b-analysis.repository';
import { BAnalysisEntity } from '../entities';

describe('BAnalysisRepository', () => {
    let bAnalysisRepository: BAnalysisRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BAnalysisRepository,
                {
                    provide: getRepositoryToken(BAnalysisEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        bAnalysisRepository = module.get<BAnalysisRepository>(BAnalysisRepository);
    });

    it('should be defined', () => {
        expect(bAnalysisRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(bAnalysisRepository['logger']).toBeDefined();
    });
});
