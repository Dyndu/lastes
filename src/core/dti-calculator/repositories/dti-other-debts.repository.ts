import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { DtiOtherDebtsEntity } from '../entities';

@Injectable()
export class DtiOtherDebtsRepository extends AbstractRepository<DtiOtherDebtsEntity> {
    protected readonly logger = new Logger(DtiOtherDebtsRepository.name);

    constructor(
        @InjectRepository(DtiOtherDebtsEntity)
        dtiOtherDebtsRepository: Repository<DtiOtherDebtsEntity>,
        entityManager: EntityManager,
    ) {
        super(dtiOtherDebtsRepository, entityManager);
    }
}
