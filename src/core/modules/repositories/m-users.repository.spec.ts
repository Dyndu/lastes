import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MUsersRepository } from './m-users.repository';
import { MUsersEntity } from '../entities';

describe('MUsersRepository', () => {
    let mUsersRepository: MUsersRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MUsersRepository,
                {
                    provide: getRepositoryToken(MUsersEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        mUsersRepository = module.get<MUsersRepository>(MUsersRepository);
    });

    it('should be defined', () => {
        expect(mUsersRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(mUsersRepository['logger']).toBeDefined();
    });
});
