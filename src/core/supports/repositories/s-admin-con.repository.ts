import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { SAdminConEntity } from '../entities';

@Injectable()
export class SAdminConRepository extends AbstractRepository<SAdminConEntity> {
    protected readonly logger = new Logger(SAdminConRepository.name);

    constructor(
        @InjectRepository(SAdminConEntity)
        sAdminConRepository: Repository<SAdminConEntity>,
        entityManager: EntityManager,
    ) {
        super(sAdminConRepository, entityManager);
    }
}
