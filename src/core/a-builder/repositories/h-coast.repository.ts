import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { HCoastEntity } from '../entities';

@Injectable()
export class HCoastRepository extends AbstractRepository<HCoastEntity> {
    protected readonly logger = new Logger(HCoastRepository.name);

    constructor(
        @InjectRepository(HCoastEntity)
        hCoastRepository: Repository<HCoastEntity>,
        entityManager: EntityManager,
    ) {
        super(hCoastRepository, entityManager);
    }
}
