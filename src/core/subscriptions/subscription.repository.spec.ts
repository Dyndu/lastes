import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SubscriptionRepository } from './subscription.repository';
import { SubscriptionEntity } from './entities/subscription.entity';

describe('SubscriptionRepository', () => {
    let subscriptionRepository: SubscriptionRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SubscriptionRepository,
                {
                    provide: getRepositoryToken(SubscriptionEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        subscriptionRepository = module.get<SubscriptionRepository>(SubscriptionRepository);
    });

    it('should be defined', () => {
        expect(subscriptionRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(subscriptionRepository['logger']).toBeDefined();
    });
});
