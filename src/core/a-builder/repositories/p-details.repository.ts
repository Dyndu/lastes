import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { PDetailsEntity } from '../entities';

@Injectable()
export class PDetailsRepository extends AbstractRepository<PDetailsEntity> {
    protected readonly logger = new Logger(PDetailsRepository.name);

    constructor(
        @InjectRepository(PDetailsEntity)
        pDetailsRepository: Repository<PDetailsEntity>,
        entityManager: EntityManager,
    ) {
        super(pDetailsRepository, entityManager);
    }
}
