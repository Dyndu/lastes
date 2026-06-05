import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SubscriptionInvoiceRepository } from './subscription-invoice.repository';
import { SubscriptionInvoiceEntity } from '../entities';

describe('SubscriptionInvoiceRepository', () => {
    let sInvoiceRepository: SubscriptionInvoiceRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SubscriptionInvoiceRepository,
                {
                    provide: getRepositoryToken(SubscriptionInvoiceEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        sInvoiceRepository = module.get<SubscriptionInvoiceRepository>(
            SubscriptionInvoiceRepository,
        );
    });

    it('should be defined', () => {
        expect(sInvoiceRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(sInvoiceRepository['logger']).toBeDefined();
    });
});
