import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SocialRepository } from './social.repository';
import { SocialEntity } from '../entities';

describe('SocialRepository', () => {
    let socialRepository: SocialRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SocialRepository,
                {
                    provide: getRepositoryToken(SocialEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        socialRepository = module.get<SocialRepository>(SocialRepository);
    });

    it('should be defined', () => {
        expect(socialRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(socialRepository['logger']).toBeDefined();
    });
});
