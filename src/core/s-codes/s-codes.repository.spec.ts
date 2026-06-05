import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SCodesRepository } from './s-codes.repository';
import { SCodeEntity } from './entities/s-code.entity';

describe('SCodesRepository', () => {
    let repository: SCodesRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SCodesRepository,
                {
                    provide: getRepositoryToken(SCodeEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        repository = module.get<SCodesRepository>(SCodesRepository);
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(repository['logger']).toBeDefined();
    });
});
