import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ERepairsRepository } from './e-repairs.repository';
import { ERepairsEntity } from '../entities';

describe('ERepairsRepository', () => {
    let eRepairsRepository: ERepairsRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ERepairsRepository,
                {
                    provide: getRepositoryToken(ERepairsEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        eRepairsRepository = module.get<ERepairsRepository>(ERepairsRepository);
    });

    it('should be defined', () => {
        expect(eRepairsRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(eRepairsRepository['logger']).toBeDefined();
    });
});
