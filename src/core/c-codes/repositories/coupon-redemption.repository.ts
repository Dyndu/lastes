import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { CouponRedemptionEntity } from '../entities';

@Injectable()
export class CouponRedemptionRepository extends AbstractRepository<CouponRedemptionEntity> {
    protected readonly logger = new Logger(CouponRedemptionRepository.name);

    constructor(
        @InjectRepository(CouponRedemptionEntity)
        couponRedemptionRepository: Repository<CouponRedemptionEntity>,
        entityManager: EntityManager,
    ) {
        super(couponRedemptionRepository, entityManager);
    }
}
