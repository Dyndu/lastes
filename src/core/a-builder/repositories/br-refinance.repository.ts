import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { BrRefinanceEntity } from '../entities';

@Injectable()
export class BrRefinanceRepository extends AbstractRepository<BrRefinanceEntity> {
    protected readonly logger = new Logger(BrRefinanceRepository.name);

    constructor(
        @InjectRepository(BrRefinanceEntity)
        brRefinanceRepository: Repository<BrRefinanceEntity>,
        entityManager: EntityManager,
    ) {
        super(brRefinanceRepository, entityManager);
    }
}
