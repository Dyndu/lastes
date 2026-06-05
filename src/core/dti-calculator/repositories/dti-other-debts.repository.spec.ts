import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DtiOtherDebtsRepository } from './dti-other-debts.repository';
import { DtiOtherDebtsEntity } from '../entities';

describe('DtiOtherDebtsRepository', () => {
    let dtiOtherDebtsRepository: DtiOtherDebtsRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DtiOtherDebtsRepository,
                {
                    provide: getRepositoryToken(DtiOtherDebtsEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        dtiOtherDebtsRepository = module.get<DtiOtherDebtsRepository>(DtiOtherDebtsRepository);
    });

    it('should be defined', () => {
        expect(dtiOtherDebtsRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(dtiOtherDebtsRepository['logger']).toBeDefined();
    });
});
