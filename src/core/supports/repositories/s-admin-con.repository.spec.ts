import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SAdminConRepository } from './s-admin-con.repository';
import { SAdminConEntity } from '../entities';

describe('SAdminConRepository', () => {
    let sAdminConRepository: SAdminConRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SAdminConRepository,
                {
                    provide: getRepositoryToken(SAdminConEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        sAdminConRepository = module.get<SAdminConRepository>(SAdminConRepository);
    });

    it('should be defined', () => {
        expect(sAdminConRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(sAdminConRepository['logger']).toBeDefined();
    });
});
