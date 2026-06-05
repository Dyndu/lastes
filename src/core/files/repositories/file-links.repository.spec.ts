import { Test, TestingModule } from '@nestjs/testing';
import { FilesRepository } from './files.repository';
import { FileEntity } from '../entities/file.entity';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('FilesRepository', () => {
    let repository: FilesRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FilesRepository,
                {
                    provide: getRepositoryToken(FileEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        repository = module.get<FilesRepository>(FilesRepository);
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(repository['logger']).toBeDefined();
    });
});
