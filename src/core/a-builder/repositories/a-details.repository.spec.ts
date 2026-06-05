import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ADetailsRepository } from './a-details.repository';
import { ADetailsEntity } from '../entities';

describe('ADetailsRepository', () => {
    let acquisitionDetailRepository: ADetailsRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ADetailsRepository,
                {
                    provide: getRepositoryToken(ADetailsEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        acquisitionDetailRepository = module.get<ADetailsRepository>(ADetailsRepository);
    });

    it('should be defined', () => {
        expect(acquisitionDetailRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(acquisitionDetailRepository['logger']).toBeDefined();
    });
});
