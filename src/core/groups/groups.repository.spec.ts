import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GroupsRepository } from './groups.repository';
import { GroupEntity } from './entities/group.entity';

describe('GroupsRepository', () => {
    let groupRepository: GroupsRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GroupsRepository,
                {
                    provide: getRepositoryToken(GroupEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        groupRepository = module.get<GroupsRepository>(GroupsRepository);
    });

    it('should be defined', () => {
        expect(groupRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(groupRepository['logger']).toBeDefined();
    });
});
