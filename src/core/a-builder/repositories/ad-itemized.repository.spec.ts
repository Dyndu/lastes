import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdItemizedRepository } from './ad-itemized.repository';
import { AdItemizedEntity } from '../entities';

describe('AdItemizedRepository', () => {
    let adItemizedRepository: AdItemizedRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdItemizedRepository,
                {
                    provide: getRepositoryToken(AdItemizedEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        adItemizedRepository = module.get<AdItemizedRepository>(AdItemizedRepository);
    });

    it('should be defined', () => {
        expect(adItemizedRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(adItemizedRepository['logger']).toBeDefined();
    });
});
