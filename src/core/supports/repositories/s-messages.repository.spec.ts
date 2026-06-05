import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SMessagesRepository } from './s-messages.repository';
import { SMessagesEntity } from '../entities';

describe('SMessagesRepository', () => {
    let sMessageRepository: SMessagesRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SMessagesRepository,
                {
                    provide: getRepositoryToken(SMessagesEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        sMessageRepository = module.get<SMessagesRepository>(SMessagesRepository);
    });

    it('should be defined', () => {
        expect(sMessageRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(sMessageRepository['logger']).toBeDefined();
    });
});
