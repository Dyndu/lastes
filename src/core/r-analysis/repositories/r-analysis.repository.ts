import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { RAnalysisEntity } from '../entities';

@Injectable()
export class RAnalysisRepository extends AbstractRepository<RAnalysisEntity> {
    protected readonly logger = new Logger(RAnalysisRepository.name);

    constructor(
        @InjectRepository(RAnalysisEntity)
        rentalAnalysisRepository: Repository<RAnalysisEntity>,
        entityManager: EntityManager,
    ) {
        super(rentalAnalysisRepository, entityManager);
    }
}
