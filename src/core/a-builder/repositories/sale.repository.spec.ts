import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SaleRepository } from './sale.repository';
import { SaleEntity } from '../entities';

describe('SaleRepository', () => {
    let saleRepository: SaleRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SaleRepository,
                {
                    provide: getRepositoryToken(SaleEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        saleRepository = module.get<SaleRepository>(SaleRepository);
    });

    it('should be defined', () => {
        expect(saleRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(saleRepository['logger']).toBeDefined();
    });
});
