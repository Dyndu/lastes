import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { UnitEntity } from '../entities';

@Injectable()
export class UnitsRepository extends AbstractRepository<UnitEntity> {
    protected readonly logger = new Logger(UnitsRepository.name);

    constructor(
        @InjectRepository(UnitEntity)
        unitRepository: Repository<UnitEntity>,
        entityManager: EntityManager,
    ) {
        super(unitRepository, entityManager);
    }
}
