import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FFlipRepository } from './f-flip.repository';
import { FFlipEntity } from './entity/f-flip.entity';

describe('FFlipRepository', () => {
    let fFlipRepository: FFlipRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FFlipRepository,
                {
                    provide: getRepositoryToken(FFlipEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        fFlipRepository = module.get<FFlipRepository>(FFlipRepository);
    });

    it('should be defined', () => {
        expect(fFlipRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(fFlipRepository['logger']).toBeDefined();
    });
});
