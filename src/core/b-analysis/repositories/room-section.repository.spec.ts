import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RoomSectionRepository } from './room-section.repository';
import { RoomSectionEntity } from '../entities';

describe('RoomSectionRepository', () => {
    let roomSectionRepository: RoomSectionRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoomSectionRepository,
                {
                    provide: getRepositoryToken(RoomSectionEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        roomSectionRepository = module.get<RoomSectionRepository>(RoomSectionRepository);
    });

    it('should be defined', () => {
        expect(roomSectionRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(roomSectionRepository['logger']).toBeDefined();
    });
});
