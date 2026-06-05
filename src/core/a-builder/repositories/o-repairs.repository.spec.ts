import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ORepairsRepository } from './o-repairs.repository';
import { ORepairsEntity } from '../entities';

describe('ORepairsRepository', () => {
    let oRepairsRepository: ORepairsRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ORepairsRepository,
                {
                    provide: getRepositoryToken(ORepairsEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        oRepairsRepository = module.get<ORepairsRepository>(ORepairsRepository);
    });

    it('should be defined', () => {
        expect(oRepairsRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(oRepairsRepository['logger']).toBeDefined();
    });
});
