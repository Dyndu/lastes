import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PDetailsRepository } from './p-details.repository';
import { PDetailsEntity } from '../entities';

describe('PDetailsRepository', () => {
    let pDetailsRepository: PDetailsRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PDetailsRepository,
                {
                    provide: getRepositoryToken(PDetailsEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        pDetailsRepository = module.get<PDetailsRepository>(PDetailsRepository);
    });

    it('should be defined', () => {
        expect(pDetailsRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(pDetailsRepository['logger']).toBeDefined();
    });
});
