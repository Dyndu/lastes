import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RoomCategoryRepository } from './room-category.repository';
import { RoomCategoryEntity } from '../entities';

describe('RoomCategoryRepository', () => {
    let roomCategoryRepository: RoomCategoryRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoomCategoryRepository,
                {
                    provide: getRepositoryToken(RoomCategoryEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        roomCategoryRepository = module.get<RoomCategoryRepository>(RoomCategoryRepository);
    });

    it('should be defined', () => {
        expect(roomCategoryRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(roomCategoryRepository['logger']).toBeDefined();
    });
});
