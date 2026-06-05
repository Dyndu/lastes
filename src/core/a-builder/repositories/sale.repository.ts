import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { SaleEntity } from '../entities';

@Injectable()
export class SaleRepository extends AbstractRepository<SaleEntity> {
    protected readonly logger = new Logger(SaleRepository.name);

    constructor(
        @InjectRepository(SaleEntity)
        saleRepository: Repository<SaleEntity>,
        entityManager: EntityManager,
    ) {
        super(saleRepository, entityManager);
    }
}
