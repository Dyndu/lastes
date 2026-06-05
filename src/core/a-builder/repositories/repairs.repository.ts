import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { RepairsEntity } from '../entities';

@Injectable()
export class RepairsRepository extends AbstractRepository<RepairsEntity> {
    protected readonly logger = new Logger(RepairsRepository.name);

    constructor(
        @InjectRepository(RepairsEntity)
        repairsRepository: Repository<RepairsEntity>,
        entityManager: EntityManager,
    ) {
        super(repairsRepository, entityManager);
    }
}
