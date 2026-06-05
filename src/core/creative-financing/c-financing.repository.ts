import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../libs/database/abstract.repository';
import { CFinancingEntity } from './entities/c-financing.entity';

@Injectable()
export class CFinancingRepository extends AbstractRepository<CFinancingEntity> {
    protected readonly logger = new Logger(CFinancingRepository.name);

    constructor(
        @InjectRepository(CFinancingEntity)
        cFinancingRepository: Repository<CFinancingEntity>,
        entityManager: EntityManager,
    ) {
        super(cFinancingRepository, entityManager);
    }
}
