import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../libs/database/abstract.repository';
import { IStrategyEntity } from './entities/i-strategy.entity';

@Injectable()
export class IStrategyRepository extends AbstractRepository<IStrategyEntity> {
    protected readonly logger = new Logger(IStrategyRepository.name);

    constructor(
        @InjectRepository(IStrategyEntity)
        iStrategyRepository: Repository<IStrategyEntity>,
        entityManager: EntityManager,
    ) {
        super(iStrategyRepository, entityManager);
    }
}
