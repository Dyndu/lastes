import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalysisRepository } from './analysis.repository';
import { AnalysisEntity } from '../entities';

describe('AnalysisRepository', () => {
    let analysisRepository: AnalysisRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AnalysisRepository,
                {
                    provide: getRepositoryToken(AnalysisEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        analysisRepository = module.get<AnalysisRepository>(AnalysisRepository);
    });

    it('should be defined', () => {
        expect(analysisRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(analysisRepository['logger']).toBeDefined();
    });
});
