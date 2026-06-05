import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MHeaderRepository } from './m-header.repository';
import { MHeaderEntity } from '../entities';

describe('MHeaderRepository', () => {
    let mHeaderRepository: MHeaderRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MHeaderRepository,
                {
                    provide: getRepositoryToken(MHeaderEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        mHeaderRepository = module.get<MHeaderRepository>(MHeaderRepository);
    });

    it('should be defined', () => {
        expect(mHeaderRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(mHeaderRepository['logger']).toBeDefined();
    });
});
