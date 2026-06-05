import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { DtiEIncomeEntity } from '../entities';

@Injectable()
export class DtiEIncomeRepository extends AbstractRepository<DtiEIncomeEntity> {
    protected readonly logger = new Logger(DtiEIncomeRepository.name);

    constructor(
        @InjectRepository(DtiEIncomeEntity)
        dtiEIncomeRepository: Repository<DtiEIncomeEntity>,
        entityManager: EntityManager,
    ) {
        super(dtiEIncomeRepository, entityManager);
    }
}
