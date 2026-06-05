import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { DtiCardEntity } from '../entities';

@Injectable()
export class DtiCardRepository extends AbstractRepository<DtiCardEntity> {
    protected readonly logger = new Logger(DtiCardRepository.name);

    constructor(
        @InjectRepository(DtiCardEntity)
        dtiCardRepository: Repository<DtiCardEntity>,
        entityManager: EntityManager,
    ) {
        super(dtiCardRepository, entityManager);
    }
}
