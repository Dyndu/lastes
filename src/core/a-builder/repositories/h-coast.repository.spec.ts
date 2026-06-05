import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HCoastRepository } from './h-coast.repository';
import { HCoastEntity } from '../entities';

describe('HCoastRepository', () => {
    let hCoastRepository: HCoastRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HCoastRepository,
                {
                    provide: getRepositoryToken(HCoastEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        hCoastRepository = module.get<HCoastRepository>(HCoastRepository);
    });

    it('should be defined', () => {
        expect(hCoastRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(hCoastRepository['logger']).toBeDefined();
    });
});
