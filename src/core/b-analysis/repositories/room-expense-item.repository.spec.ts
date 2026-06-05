import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RoomExpenseItemRepository } from './room-expense-item.repository';
import { RoomExpenseItemEntity } from '../entities';

describe('RoomExpenseItemRepository', () => {
    let roomExpenseItemRepository: RoomExpenseItemRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoomExpenseItemRepository,
                {
                    provide: getRepositoryToken(RoomExpenseItemEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        roomExpenseItemRepository =
            module.get<RoomExpenseItemRepository>(RoomExpenseItemRepository);
    });

    it('should be defined', () => {
        expect(roomExpenseItemRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(roomExpenseItemRepository['logger']).toBeDefined();
    });
});
