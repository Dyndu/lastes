import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { MFeatureEntity } from '../entities';

@Injectable()
export class MFeatureRepository extends AbstractRepository<MFeatureEntity> {
    protected readonly logger = new Logger(MFeatureRepository.name);

    constructor(
        @InjectRepository(MFeatureEntity)
        mFeatureRepository: Repository<MFeatureEntity>,
        entityManager: EntityManager,
    ) {
        super(mFeatureRepository, entityManager);
    }
}
