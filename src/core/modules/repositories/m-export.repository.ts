import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { MExportEntity } from '../entities';

@Injectable()
export class MExportRepository extends AbstractRepository<MExportEntity> {
    protected readonly logger = new Logger(MExportRepository.name);

    constructor(
        @InjectRepository(MExportEntity)
        mExportRepository: Repository<MExportEntity>,
        entityManager: EntityManager,
    ) {
        super(mExportRepository, entityManager);
    }
}
