import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RDurationRepository } from './r-duration.repository';
import { RDurationEntity } from '../entities';

describe('RDurationRepository', () => {
    let rDurationRepository: RDurationRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RDurationRepository,
                {
                    provide: getRepositoryToken(RDurationEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        rDurationRepository = module.get<RDurationRepository>(RDurationRepository);
    });

    it('should be defined', () => {
        expect(rDurationRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(rDurationRepository['logger']).toBeDefined();
    });
});
