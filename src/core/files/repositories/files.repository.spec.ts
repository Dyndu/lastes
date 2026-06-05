import { Test, TestingModule } from '@nestjs/testing';
import { FileLinksRepository } from './file-links.repository';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FileLinksEntity } from '../entities/file-links.entity';

describe('FileLinksRepository', () => {
    let repository: FileLinksRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FileLinksRepository,
                {
                    provide: getRepositoryToken(FileLinksEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        repository = module.get<FileLinksRepository>(FileLinksRepository);
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(repository['logger']).toBeDefined();
    });
});
