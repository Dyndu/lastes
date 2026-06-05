import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../libs/database/abstract.repository';
import { WholesaleEntity } from './entities/wholesale.entity';

@Injectable()
export class WholesaleRepository extends AbstractRepository<WholesaleEntity> {
    protected readonly logger = new Logger(WholesaleRepository.name);

    constructor(
        @InjectRepository(WholesaleEntity)
        wholesaleRepository: Repository<WholesaleEntity>,
        entityManager: EntityManager,
    ) {
        super(wholesaleRepository, entityManager);
    }
}
