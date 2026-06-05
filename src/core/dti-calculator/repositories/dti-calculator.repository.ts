import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { DtiCalculatorEntity } from '../entities';

@Injectable()
export class DtiCalculatorRepository extends AbstractRepository<DtiCalculatorEntity> {
    protected readonly logger = new Logger(DtiCalculatorRepository.name);

    constructor(
        @InjectRepository(DtiCalculatorEntity)
        dtiCalculatorRepository: Repository<DtiCalculatorEntity>,
        entityManager: EntityManager,
    ) {
        super(dtiCalculatorRepository, entityManager);
    }
}
