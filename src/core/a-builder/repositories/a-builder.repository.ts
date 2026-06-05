import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { ABuilderEntity } from '../entities';

@Injectable()
export class ABuilderRepository extends AbstractRepository<ABuilderEntity> {
    protected readonly logger = new Logger(ABuilderRepository.name);

    constructor(
        @InjectRepository(ABuilderEntity)
        analysisBuilderRepository: Repository<ABuilderEntity>,
        entityManager: EntityManager,
    ) {
        super(analysisBuilderRepository, entityManager);
    }
}
