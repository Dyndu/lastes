import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CCoastRepository } from './c-coast.repository';
import { CCoastEntity } from '../entities';

describe('CCoastRepository', () => {
    let cCoastRepository: CCoastRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CCoastRepository,
                {
                    provide: getRepositoryToken(CCoastEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        cCoastRepository = module.get<CCoastRepository>(CCoastRepository);
    });

    it('should be defined', () => {
        expect(cCoastRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(cCoastRepository['logger']).toBeDefined();
    });
});
