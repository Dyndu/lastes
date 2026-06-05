import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { MHeaderEntity } from '../entities';

@Injectable()
export class MHeaderRepository extends AbstractRepository<MHeaderEntity> {
    protected readonly logger = new Logger(MHeaderRepository.name);

    constructor(
        @InjectRepository(MHeaderEntity)
        mHeaderRepository: Repository<MHeaderEntity>,
        entityManager: EntityManager,
    ) {
        super(mHeaderRepository, entityManager);
    }
}
