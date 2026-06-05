import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ABuilderRepository } from './a-builder.repository';
import { ABuilderEntity } from '../entities';

describe('ABuilderRepository', () => {
    let acquisitionDetailRepository: ABuilderRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ABuilderRepository,
                {
                    provide: getRepositoryToken(ABuilderEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        acquisitionDetailRepository = module.get<ABuilderRepository>(ABuilderRepository);
    });

    it('should be defined', () => {
        expect(acquisitionDetailRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(acquisitionDetailRepository['logger']).toBeDefined();
    });
});
