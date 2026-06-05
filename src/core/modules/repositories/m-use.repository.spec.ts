import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MUseEntity } from '../entities';
import { MUseRepository } from './m-use.repository';

describe('MUseRepository', () => {
    let mUseRepository: MUseRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MUseRepository,
                {
                    provide: getRepositoryToken(MUseEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        mUseRepository = module.get<MUseRepository>(MUseRepository);
    });

    it('should be defined', () => {
        expect(mUseRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(mUseRepository['logger']).toBeDefined();
    });
});
