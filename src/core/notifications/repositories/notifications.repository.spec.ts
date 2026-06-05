import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsRepository } from './notifications.repository';
import { NotificationEntity } from '../entities/notification.entity';

describe('NotificationsRepository', () => {
    let notifsRepo: NotificationsRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationsRepository,
                {
                    provide: getRepositoryToken(NotificationEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        notifsRepo = module.get<NotificationsRepository>(NotificationsRepository);
    });

    it('should be defined', () => {
        expect(notifsRepo).toBeDefined();
    });

    it('should have a logger', () => {
        expect(notifsRepo['logger']).toBeDefined();
    });
});
