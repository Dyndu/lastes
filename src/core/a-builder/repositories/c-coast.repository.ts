import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { CCoastEntity } from '../entities';

@Injectable()
export class CCoastRepository extends AbstractRepository<CCoastEntity> {
    protected readonly logger = new Logger(CCoastRepository.name);

    constructor(
        @InjectRepository(CCoastEntity)
        cCoastRepository: Repository<CCoastEntity>,
        entityManager: EntityManager,
    ) {
        super(cCoastRepository, entityManager);
    }
}
