import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MetricsRepository } from './metrics.repository';
import { MetricsEntity } from '../entities';

describe('MetricsRepository', () => {
    let MetricRepository: MetricsRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MetricsRepository,
                {
                    provide: getRepositoryToken(MetricsEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        MetricRepository = module.get<MetricsRepository>(MetricsRepository);
    });

    it('should be defined', () => {
        expect(MetricRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(MetricRepository['logger']).toBeDefined();
    });
});
