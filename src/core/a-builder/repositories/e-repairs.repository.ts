import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { ERepairsEntity } from '../entities';

@Injectable()
export class ERepairsRepository extends AbstractRepository<ERepairsEntity> {
    protected readonly logger = new Logger(ERepairsRepository.name);

    constructor(
        @InjectRepository(ERepairsEntity)
        eRepairsRepository: Repository<ERepairsEntity>,
        entityManager: EntityManager,
    ) {
        super(eRepairsRepository, entityManager);
    }
}
