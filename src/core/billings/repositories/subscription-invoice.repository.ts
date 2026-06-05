import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { SubscriptionInvoiceEntity } from '../entities';

@Injectable()
export class SubscriptionInvoiceRepository extends AbstractRepository<SubscriptionInvoiceEntity> {
    protected readonly logger = new Logger(SubscriptionInvoiceRepository.name);

    constructor(
        @InjectRepository(SubscriptionInvoiceEntity)
        sInvoiceRepository: Repository<SubscriptionInvoiceEntity>,
        entityManager: EntityManager,
    ) {
        super(sInvoiceRepository, entityManager);
    }
}
