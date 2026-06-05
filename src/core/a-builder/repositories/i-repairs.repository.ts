import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { IRepairsEntity } from '../entities';

@Injectable()
export class IRepairsRepository extends AbstractRepository<IRepairsEntity> {
    protected readonly logger = new Logger(IRepairsRepository.name);

    constructor(
        @InjectRepository(IRepairsEntity)
        iRepairsRepository: Repository<IRepairsEntity>,
        entityManager: EntityManager,
    ) {
        super(iRepairsRepository, entityManager);
    }
}
