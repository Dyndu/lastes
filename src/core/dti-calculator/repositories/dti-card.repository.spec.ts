import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DtiCardRepository } from './dti-card.repository';
import { DtiCardEntity } from '../entities';

describe('DtiCardRepository', () => {
    let dtiCardRepository: DtiCardRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DtiCardRepository,
                {
                    provide: getRepositoryToken(DtiCardEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        dtiCardRepository = module.get<DtiCardRepository>(DtiCardRepository);
    });

    it('should be defined', () => {
        expect(dtiCardRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(dtiCardRepository['logger']).toBeDefined();
    });
});
