import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../libs/database/abstract.repository';
import { MCalculatorEntity } from './entities/m-calculator.entity';

@Injectable()
export class MCalculatorRepository extends AbstractRepository<MCalculatorEntity> {
    protected readonly logger = new Logger(MCalculatorRepository.name);

    constructor(
        @InjectRepository(MCalculatorEntity)
        mCalculatorRepository: Repository<MCalculatorEntity>,
        entityManager: EntityManager,
    ) {
        super(mCalculatorRepository, entityManager);
    }
}
