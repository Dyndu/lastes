import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HCoastItemizedEntity } from '../entities';
import { HCoastItemizedRepository } from './h-coast-itemized.repository';

describe('HCoastItemizedRepository', () => {
    let hCoastItemizedRepository: HCoastItemizedRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HCoastItemizedRepository,
                {
                    provide: getRepositoryToken(HCoastItemizedEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        hCoastItemizedRepository = module.get<HCoastItemizedRepository>(HCoastItemizedRepository);
    });

    it('should be defined', () => {
        expect(hCoastItemizedRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(hCoastItemizedRepository['logger']).toBeDefined();
    });
});
