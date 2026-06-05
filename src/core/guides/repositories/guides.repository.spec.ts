import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GuidesRepository } from './guides.repository';
import { GuideEntity } from '../entities';

describe('GuidesRepository', () => {
    let guideRepository: GuidesRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GuidesRepository,
                {
                    provide: getRepositoryToken(GuideEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        guideRepository = module.get<GuidesRepository>(GuidesRepository);
    });

    it('should be defined', () => {
        expect(guideRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(guideRepository['logger']).toBeDefined();
    });
});
