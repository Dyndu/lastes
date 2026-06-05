import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { DtiOtherIncomeEntity } from '../entities';

@Injectable()
export class DtiOtherIncomeRepository extends AbstractRepository<DtiOtherIncomeEntity> {
    protected readonly logger = new Logger(DtiOtherIncomeRepository.name);

    constructor(
        @InjectRepository(DtiOtherIncomeEntity)
        dtiOtherIncomeRepository: Repository<DtiOtherIncomeEntity>,
        entityManager: EntityManager,
    ) {
        super(dtiOtherIncomeRepository, entityManager);
    }
}
