import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SMetricEntity } from '../entities';
import { SMetricRepository } from './s-metric.repository';

describe('SMetricRepository', () => {
    let sMetricRepository: SMetricRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SMetricRepository,
                {
                    provide: getRepositoryToken(SMetricEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        sMetricRepository = module.get<SMetricRepository>(SMetricRepository);
    });

    it('should be defined', () => {
        expect(sMetricRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(sMetricRepository['logger']).toBeDefined();
    });
});
