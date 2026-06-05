import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { ORepairsEntity } from '../entities';

@Injectable()
export class ORepairsRepository extends AbstractRepository<ORepairsEntity> {
    protected readonly logger = new Logger(ORepairsRepository.name);

    constructor(
        @InjectRepository(ORepairsEntity)
        oRepairsRepository: Repository<ORepairsEntity>,
        entityManager: EntityManager,
    ) {
        super(oRepairsRepository, entityManager);
    }
}
