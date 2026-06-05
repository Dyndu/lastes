import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { SMetricEntity } from '../entities';

@Injectable()
export class SMetricRepository extends AbstractRepository<SMetricEntity> {
    protected readonly logger = new Logger(SMetricRepository.name);

    constructor(
        @InjectRepository(SMetricEntity)
        sMetricRepository: Repository<SMetricEntity>,
        entityManager: EntityManager,
    ) {
        super(sMetricRepository, entityManager);
    }
}
