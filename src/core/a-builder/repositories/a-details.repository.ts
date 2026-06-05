import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { ADetailsEntity } from '../entities';

@Injectable()
export class ADetailsRepository extends AbstractRepository<ADetailsEntity> {
    protected readonly logger = new Logger(ADetailsRepository.name);

    constructor(
        @InjectRepository(ADetailsEntity)
        acquisitionDetailRepository: Repository<ADetailsEntity>,
        entityManager: EntityManager,
    ) {
        super(acquisitionDetailRepository, entityManager);
    }
}
