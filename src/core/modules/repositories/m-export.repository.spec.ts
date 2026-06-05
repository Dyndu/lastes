import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MExportRepository } from './m-export.repository';
import { MExportEntity } from '../entities';

describe('MExportRepository', () => {
    let mExportRepository: MExportRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MExportRepository,
                {
                    provide: getRepositoryToken(MExportEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        mExportRepository = module.get<MExportRepository>(MExportRepository);
    });

    it('should be defined', () => {
        expect(mExportRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(mExportRepository['logger']).toBeDefined();
    });
});
