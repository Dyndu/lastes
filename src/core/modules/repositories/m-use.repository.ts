import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { MUseEntity } from '../entities';

@Injectable()
export class MUseRepository extends AbstractRepository<MUseEntity> {
    protected readonly logger = new Logger(MUseRepository.name);

    constructor(
        @InjectRepository(MUseEntity)
        mUseRepository: Repository<MUseEntity>,
        entityManager: EntityManager,
    ) {
        super(mUseRepository, entityManager);
    }
}
