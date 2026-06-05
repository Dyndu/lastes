import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { MetricsEntity } from '../entities';

@Injectable()
export class MetricsRepository extends AbstractRepository<MetricsEntity> {
    protected readonly logger = new Logger(MetricsRepository.name);

    constructor(
        @InjectRepository(MetricsEntity)
        raMetricsRepository: Repository<MetricsEntity>,
        entityManager: EntityManager,
    ) {
        super(raMetricsRepository, entityManager);
    }
}
