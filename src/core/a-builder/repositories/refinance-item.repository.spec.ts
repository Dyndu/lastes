import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RefinanceItemRepository } from './refinance-item.repository';
import { RefinanceItemEntity } from '../entities';

describe('RefinanceItemRepository', () => {
    let refiItemRepository: RefinanceItemRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RefinanceItemRepository,
                {
                    provide: getRepositoryToken(RefinanceItemEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        refiItemRepository = module.get<RefinanceItemRepository>(RefinanceItemRepository);
    });

    it('should be defined', () => {
        expect(refiItemRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(refiItemRepository['logger']).toBeDefined();
    });
});
