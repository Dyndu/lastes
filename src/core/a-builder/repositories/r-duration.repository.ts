import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { RDurationEntity } from '../entities';

@Injectable()
export class RDurationRepository extends AbstractRepository<RDurationEntity> {
    protected readonly logger = new Logger(RDurationRepository.name);

    constructor(
        @InjectRepository(RDurationEntity)
        rDurationRepository: Repository<RDurationEntity>,
        entityManager: EntityManager,
    ) {
        super(rDurationRepository, entityManager);
    }
}
