import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../libs/database/abstract.repository';
import { RCalculatorEntity } from './entity/r-calculator.entity';

@Injectable()
export class RCalculatorRepository extends AbstractRepository<RCalculatorEntity> {
    protected readonly logger = new Logger(RCalculatorRepository.name);

    constructor(
        @InjectRepository(RCalculatorEntity)
        rehabCalculatorRepository: Repository<RCalculatorEntity>,
        entityManager: EntityManager,
    ) {
        super(rehabCalculatorRepository, entityManager);
    }
}
