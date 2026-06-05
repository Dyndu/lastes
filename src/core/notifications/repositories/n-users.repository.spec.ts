import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NUsersRepository } from './n-users.repository';
import { NUsersEntity } from '../entities/n-users.entity';

describe('NUsersRepository', () => {
    let nUserRepo: NUsersRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NUsersRepository,
                {
                    provide: getRepositoryToken(NUsersEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        nUserRepo = module.get<NUsersRepository>(NUsersRepository);
    });

    it('should be defined', () => {
        expect(nUserRepo).toBeDefined();
    });

    it('should have a logger', () => {
        expect(nUserRepo['logger']).toBeDefined();
    });
});
