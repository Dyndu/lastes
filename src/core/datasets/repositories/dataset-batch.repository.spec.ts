import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DatasetBatchRepository } from './dataset-batch.repository';
import { DatasetBatchEntity } from '../entities/dataset-batch.entity';

describe('DatasetBatchRepository', () => {
    let repository: DatasetBatchRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DatasetBatchRepository,
                {
                    provide: getRepositoryToken(DatasetBatchEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        repository = module.get<DatasetBatchRepository>(DatasetBatchRepository);
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(repository['logger']).toBeDefined();
    });
});
