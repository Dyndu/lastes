import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { DtiPropertyEntity } from '../entities';

@Injectable()
export class DtiPropertyRepository extends AbstractRepository<DtiPropertyEntity> {
    protected readonly logger = new Logger(DtiPropertyRepository.name);

    constructor(
        @InjectRepository(DtiPropertyEntity)
        dtiPropertyRepository: Repository<DtiPropertyEntity>,
        entityManager: EntityManager,
    ) {
        super(dtiPropertyRepository, entityManager);
    }
}
