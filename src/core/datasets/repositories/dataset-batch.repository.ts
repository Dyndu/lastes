import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { DatasetBatchEntity } from '../entities/dataset-batch.entity';

@Injectable()
export class DatasetBatchRepository extends AbstractRepository<DatasetBatchEntity> {
    protected readonly logger = new Logger(DatasetBatchRepository.name);
    constructor(
        @InjectRepository(DatasetBatchEntity)
        datasetBatchRepository: Repository<DatasetBatchEntity>,
        entityManager: EntityManager,
    ) {
        super(datasetBatchRepository, entityManager);
    }
}
