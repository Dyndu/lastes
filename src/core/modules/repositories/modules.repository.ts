import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { ModuleEntity } from '../entities';

@Injectable()
export class ModulesRepository extends AbstractRepository<ModuleEntity> {
    protected readonly logger = new Logger(ModulesRepository.name);

    constructor(
        @InjectRepository(ModuleEntity)
        moduleRepository: Repository<ModuleEntity>,
        entityManager: EntityManager,
    ) {
        super(moduleRepository, entityManager);
    }
}
