import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { BAnalysisEntity } from '../entities';

@Injectable()
export class BAnalysisRepository extends AbstractRepository<BAnalysisEntity> {
    protected readonly logger = new Logger(BAnalysisRepository.name);

    constructor(
        @InjectRepository(BAnalysisEntity)
        bAnalysisRepository: Repository<BAnalysisEntity>,
        entityManager: EntityManager,
    ) {
        super(bAnalysisRepository, entityManager);
    }
}
