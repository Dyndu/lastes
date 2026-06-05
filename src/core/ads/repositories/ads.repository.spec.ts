import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdsRepository } from './ads.repository';
import { AdsEntity } from '../entities/ads.entity';

describe('AdsRepository', () => {
    let adsRepository: AdsRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdsRepository,
                {
                    provide: getRepositoryToken(AdsEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        adsRepository = module.get<AdsRepository>(AdsRepository);
    });

    it('should be defined', () => {
        expect(adsRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(adsRepository['logger']).toBeDefined();
    });
});
