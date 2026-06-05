import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserGuideLikeEntity } from '../entities';
import { UserGuideLikeRepository } from './user-guide-like.repository';

describe('UserGuideLikeRepository', () => {
    let userGuideLikeRepository: UserGuideLikeRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserGuideLikeRepository,
                {
                    provide: getRepositoryToken(UserGuideLikeEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        userGuideLikeRepository = module.get<UserGuideLikeRepository>(UserGuideLikeRepository);
    });

    it('should be defined', () => {
        expect(userGuideLikeRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(userGuideLikeRepository['logger']).toBeDefined();
    });
});
