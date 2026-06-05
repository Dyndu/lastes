import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MediasRepository } from './medias.repository';
import { MediaEntity } from '../entities';

describe('MediasRepository', () => {
    let mediaRepository: MediasRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MediasRepository,
                {
                    provide: getRepositoryToken(MediaEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        mediaRepository = module.get<MediasRepository>(MediasRepository);
    });

    it('should be defined', () => {
        expect(mediaRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(mediaRepository['logger']).toBeDefined();
    });
});
