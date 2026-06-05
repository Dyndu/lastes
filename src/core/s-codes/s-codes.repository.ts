import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../libs/database/abstract.repository';
import { SCodeEntity } from './entities/s-code.entity';

@Injectable()
export class SCodesRepository extends AbstractRepository<SCodeEntity> {
    protected readonly logger = new Logger(SCodesRepository.name);

    constructor(
        @InjectRepository(SCodeEntity)
        sCodeRepository: Repository<SCodeEntity>,
        entityManager: EntityManager,
    ) {
        super(sCodeRepository, entityManager);
    }
}
