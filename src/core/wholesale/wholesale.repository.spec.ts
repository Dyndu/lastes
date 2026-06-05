import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WholesaleRepository } from './wholesale.repository';
import { WholesaleEntity } from './entities/wholesale.entity';

describe('WholesaleRepository', () => {
    let wholesaleRepository: WholesaleRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WholesaleRepository,
                {
                    provide: getRepositoryToken(WholesaleEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        wholesaleRepository = module.get<WholesaleRepository>(WholesaleRepository);
    });

    it('should be defined', () => {
        expect(wholesaleRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(wholesaleRepository['logger']).toBeDefined();
    });
});
