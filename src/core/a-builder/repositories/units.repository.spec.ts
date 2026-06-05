import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnitsRepository } from './units.repository';
import { UnitEntity } from '../entities';

describe('UnitsRepository', () => {
    let unitRepository: UnitsRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UnitsRepository,
                {
                    provide: getRepositoryToken(UnitEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        unitRepository = module.get<UnitsRepository>(UnitsRepository);
    });

    it('should be defined', () => {
        expect(unitRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(unitRepository['logger']).toBeDefined();
    });
});
