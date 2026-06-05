import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { HDurationEntity } from '../entities';

@Injectable()
export class HDurationRepository extends AbstractRepository<HDurationEntity> {
    protected readonly logger = new Logger(HDurationRepository.name);

    constructor(
        @InjectRepository(HDurationEntity)
        hDurationRepository: Repository<HDurationEntity>,
        entityManager: EntityManager,
    ) {
        super(hDurationRepository, entityManager);
    }
}
