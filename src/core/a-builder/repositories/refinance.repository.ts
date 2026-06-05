import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { RefinanceEntity } from '../entities';

@Injectable()
export class RefinanceRepository extends AbstractRepository<RefinanceEntity> {
    protected readonly logger = new Logger(RefinanceRepository.name);

    constructor(
        @InjectRepository(RefinanceEntity)
        refinanceRepository: Repository<RefinanceEntity>,
        entityManager: EntityManager,
    ) {
        super(refinanceRepository, entityManager);
    }
}
