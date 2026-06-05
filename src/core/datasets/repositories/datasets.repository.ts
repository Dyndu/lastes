import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { DatasetEntity } from '../entities/dataset.entity';

@Injectable()
export class DatasetsRepository extends AbstractRepository<DatasetEntity> {
    protected readonly logger = new Logger(DatasetsRepository.name);
    constructor(
        @InjectRepository(DatasetEntity)
        datasetRepository: Repository<DatasetEntity>,
        entityManager: EntityManager,
    ) {
        super(datasetRepository, entityManager);
    }
}
