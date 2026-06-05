import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IStrategyRepository } from './i-strategy.repository';
import { IStrategyEntity } from './entities/i-strategy.entity';

describe('IStrategyRepository', () => {
    let iStrategyRepository: IStrategyRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                IStrategyRepository,
                {
                    provide: getRepositoryToken(IStrategyEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        iStrategyRepository = module.get<IStrategyRepository>(IStrategyRepository);
    });

    it('should be defined', () => {
        expect(iStrategyRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(iStrategyRepository['logger']).toBeDefined();
    });
});
