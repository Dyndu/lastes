import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DtiPropertyRepository } from './dti-property.repository';
import { DtiPropertyEntity } from '../entities';

describe('DtiPropertyRepository', () => {
    let dtiPropertyRepository: DtiPropertyRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DtiPropertyRepository,
                {
                    provide: getRepositoryToken(DtiPropertyEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        dtiPropertyRepository = module.get<DtiPropertyRepository>(DtiPropertyRepository);
    });

    it('should be defined', () => {
        expect(dtiPropertyRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(dtiPropertyRepository['logger']).toBeDefined();
    });
});
