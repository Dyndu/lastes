import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { SConEntity } from '../entities';

@Injectable()
export class SConRepository extends AbstractRepository<SConEntity> {
    protected readonly logger = new Logger(SConRepository.name);

    constructor(
        @InjectRepository(SConEntity)
        sConRepository: Repository<SConEntity>,
        entityManager: EntityManager,
    ) {
        super(sConRepository, entityManager);
    }
}
