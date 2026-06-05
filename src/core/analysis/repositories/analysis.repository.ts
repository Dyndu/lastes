import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { AnalysisEntity } from '../entities';

@Injectable()
export class AnalysisRepository extends AbstractRepository<AnalysisEntity> {
    protected readonly logger = new Logger(AnalysisRepository.name);

    constructor(
        @InjectRepository(AnalysisEntity)
        analysisRepository: Repository<AnalysisEntity>,
        entityManager: EntityManager,
    ) {
        super(analysisRepository, entityManager);
    }
}
