import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../libs/database/abstract.repository';
import { BrAnalyzerEntity } from './entities/br-analyzer.entity';

@Injectable()
export class BrAnalyzerRepository extends AbstractRepository<BrAnalyzerEntity> {
    protected readonly logger = new Logger(BrAnalyzerRepository.name);

    constructor(
        @InjectRepository(BrAnalyzerEntity)
        brAnalyzerRepository: Repository<BrAnalyzerEntity>,
        entityManager: EntityManager,
    ) {
        super(brAnalyzerRepository, entityManager);
    }
}
