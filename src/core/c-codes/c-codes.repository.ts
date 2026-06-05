import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../libs/database/abstract.repository';
import { CCodeEntity } from './entities/c-code.entity';

@Injectable()
export class CCodesRepository extends AbstractRepository<CCodeEntity> {
    protected readonly logger = new Logger(CCodesRepository.name);

    constructor(
        @InjectRepository(CCodeEntity)
        couponCodeRepository: Repository<CCodeEntity>,
        entityManager: EntityManager,
    ) {
        super(couponCodeRepository, entityManager);
    }
}
