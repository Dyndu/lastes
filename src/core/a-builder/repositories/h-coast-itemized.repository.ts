import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { HCoastItemizedEntity } from '../entities';

@Injectable()
export class HCoastItemizedRepository extends AbstractRepository<HCoastItemizedEntity> {
    protected readonly logger = new Logger(HCoastItemizedRepository.name);

    constructor(
        @InjectRepository(HCoastItemizedEntity)
        hCoastItemizedRepository: Repository<HCoastItemizedEntity>,
        entityManager: EntityManager,
    ) {
        super(hCoastItemizedRepository, entityManager);
    }
}
