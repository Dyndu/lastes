import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { AdItemizedEntity } from '../entities';

@Injectable()
export class AdItemizedRepository extends AbstractRepository<AdItemizedEntity> {
    protected readonly logger = new Logger(AdItemizedRepository.name);

    constructor(
        @InjectRepository(AdItemizedEntity)
        adItemizedRepository: Repository<AdItemizedEntity>,
        entityManager: EntityManager,
    ) {
        super(adItemizedRepository, entityManager);
    }
}
