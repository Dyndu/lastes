import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { AnalysisUsageEntity } from '../entities';

@Injectable()
export class AnalysisUsageRepository extends AbstractRepository<AnalysisUsageEntity> {
    protected readonly logger = new Logger(AnalysisUsageRepository.name);

    constructor(
        @InjectRepository(AnalysisUsageEntity)
        analysisUsageRepository: Repository<AnalysisUsageEntity>,
        entityManager: EntityManager,
    ) {
        super(analysisUsageRepository, entityManager);
    }
}
