import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IRepairsRepository } from './i-repairs.repository';
import { IRepairsEntity } from '../entities';

describe('IRepairsRepository', () => {
    let iRepairsRepository: IRepairsRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                IRepairsRepository,
                {
                    provide: getRepositoryToken(IRepairsEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        iRepairsRepository = module.get<IRepairsRepository>(IRepairsRepository);
    });

    it('should be defined', () => {
        expect(iRepairsRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(iRepairsRepository['logger']).toBeDefined();
    });
});
