import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CouponRedemptionRepository } from './coupon-redemption.repository';
import { CouponRedemptionEntity } from '../entities';

describe('CouponRedemptionRepository', () => {
    let couponRedemptionRepository: CouponRedemptionRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CouponRedemptionRepository,
                {
                    provide: getRepositoryToken(CouponRedemptionEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        couponRedemptionRepository = module.get<CouponRedemptionRepository>(
            CouponRedemptionRepository,
        );
    });

    it('should be defined', () => {
        expect(couponRedemptionRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(couponRedemptionRepository['logger']).toBeDefined();
    });
});
