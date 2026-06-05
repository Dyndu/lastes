import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { RAnalysisParamsEntity } from '../entities';

@Injectable()
export class RAnalysisParamsRepository extends AbstractRepository<RAnalysisParamsEntity> {
    protected readonly logger = new Logger(RAnalysisParamsRepository.name);

    constructor(
        @InjectRepository(RAnalysisParamsEntity)
        rAnalysisParamRepository: Repository<RAnalysisParamsEntity>,
        entityManager: EntityManager,
    ) {
        super(rAnalysisParamRepository, entityManager);
    }
}
