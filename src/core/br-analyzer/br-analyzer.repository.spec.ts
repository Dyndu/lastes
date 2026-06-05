import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BrAnalyzerRepository } from './br-analyzer.repository';
import { BrAnalyzerEntity } from './entities/br-analyzer.entity';

describe('BrAnalyzerRepository', () => {
    let brAnalyzerRepository: BrAnalyzerRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BrAnalyzerRepository,
                {
                    provide: getRepositoryToken(BrAnalyzerEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        brAnalyzerRepository = module.get<BrAnalyzerRepository>(BrAnalyzerRepository);
    });

    it('should be defined', () => {
        expect(brAnalyzerRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(brAnalyzerRepository['logger']).toBeDefined();
    });
});
