import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ModulesRepository } from './modules.repository';
import { ModuleEntity } from '../entities';

describe('ModulesRepository', () => {
    let moduleRepository: ModulesRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ModulesRepository,
                {
                    provide: getRepositoryToken(ModuleEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        moduleRepository = module.get<ModulesRepository>(ModulesRepository);
    });

    it('should be defined', () => {
        expect(moduleRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(moduleRepository['logger']).toBeDefined();
    });
});
