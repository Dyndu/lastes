import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { FExpensesEntity } from '../entities';

@Injectable()
export class FExpensesRepository extends AbstractRepository<FExpensesEntity> {
    protected readonly logger = new Logger(FExpensesRepository.name);

    constructor(
        @InjectRepository(FExpensesEntity)
        fExpensesRepository: Repository<FExpensesEntity>,
        entityManager: EntityManager,
    ) {
        super(fExpensesRepository, entityManager);
    }
}
