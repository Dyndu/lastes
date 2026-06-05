import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RAnalysisParamsRepository } from './r-analysis-params.repository';
import { RAnalysisParamsEntity } from '../entities';

describe('RAnalysisParamsRepository', () => {
    let rAnalysisParamRepository: RAnalysisParamsRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RAnalysisParamsRepository,
                {
                    provide: getRepositoryToken(RAnalysisParamsEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        rAnalysisParamRepository = module.get<RAnalysisParamsRepository>(RAnalysisParamsRepository);
    });

    it('should be defined', () => {
        expect(rAnalysisParamRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(rAnalysisParamRepository['logger']).toBeDefined();
    });
});
