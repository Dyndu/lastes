import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RepairsRepository } from './repairs.repository';
import { RepairsEntity } from '../entities';

describe('RepairsRepository', () => {
    let repairsRepository: RepairsRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RepairsRepository,
                {
                    provide: getRepositoryToken(RepairsEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        repairsRepository = module.get<RepairsRepository>(RepairsRepository);
    });

    it('should be defined', () => {
        expect(repairsRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(repairsRepository['logger']).toBeDefined();
    });
});
