import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../libs/database/abstract.repository';
import { SubscriptionEntity } from './entities/subscription.entity';

@Injectable()
export class SubscriptionRepository extends AbstractRepository<SubscriptionEntity> {
    protected readonly logger = new Logger(SubscriptionRepository.name);

    constructor(
        @InjectRepository(SubscriptionEntity)
        subscriptionRepository: Repository<SubscriptionEntity>,
        entityManager: EntityManager,
    ) {
        super(subscriptionRepository, entityManager);
    }
}
