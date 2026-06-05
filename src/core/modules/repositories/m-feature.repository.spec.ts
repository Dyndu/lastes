import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MFeatureRepository } from './m-feature.repository';
import { MFeatureEntity } from '../entities';

describe('MFeatureRepository', () => {
    let mFeatureRepository: MFeatureRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MFeatureRepository,
                {
                    provide: getRepositoryToken(MFeatureEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        mFeatureRepository = module.get<MFeatureRepository>(MFeatureRepository);
    });

    it('should be defined', () => {
        expect(mFeatureRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(mFeatureRepository['logger']).toBeDefined();
    });
});
