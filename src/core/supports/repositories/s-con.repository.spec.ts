import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SConRepository } from './s-con.repository';
import { SConEntity } from '../entities';

describe('SConRepository', () => {
    let sConRepository: SConRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SConRepository,
                {
                    provide: getRepositoryToken(SConEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        sConRepository = module.get<SConRepository>(SConRepository);
    });

    it('should be defined', () => {
        expect(sConRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(sConRepository['logger']).toBeDefined();
    });
});
