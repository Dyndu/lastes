import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HDurationRepository } from './h-duration.repository';
import { HDurationEntity } from '../entities';

describe('HDurationRepository', () => {
    let hDurationRepository: HDurationRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HDurationRepository,
                {
                    provide: getRepositoryToken(HDurationEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        hDurationRepository = module.get<HDurationRepository>(HDurationRepository);
    });

    it('should be defined', () => {
        expect(hDurationRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(hDurationRepository['logger']).toBeDefined();
    });
});
