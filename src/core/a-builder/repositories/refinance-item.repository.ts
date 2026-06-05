import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { RefinanceItemEntity } from '../entities';

@Injectable()
export class RefinanceItemRepository extends AbstractRepository<RefinanceItemEntity> {
    protected readonly logger = new Logger(RefinanceItemRepository.name);

    constructor(
        @InjectRepository(RefinanceItemEntity)
        refiItemRepository: Repository<RefinanceItemEntity>,
        entityManager: EntityManager,
    ) {
        super(refiItemRepository, entityManager);
    }
}
