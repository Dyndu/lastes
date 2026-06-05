import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PermissionEntity } from './entities/permission.entity';
import { PermissionRepository } from './permissions.repository';

describe('PermissionRepository', () => {
    let permRepository: PermissionRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PermissionRepository,
                {
                    provide: getRepositoryToken(PermissionEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        permRepository = module.get<PermissionRepository>(PermissionRepository);
    });

    it('should be defined', () => {
        expect(permRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(permRepository['logger']).toBeDefined();
    });
});
