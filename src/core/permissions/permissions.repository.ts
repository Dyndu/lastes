import { Injectable, Logger } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AbstractRepository } from '../../libs/database/abstract.repository';
import { PermissionEntity } from './entities/permission.entity';

@Injectable()
export class PermissionRepository extends AbstractRepository<PermissionEntity> {
    protected readonly logger = new Logger(PermissionRepository.name);

    constructor(
        @InjectRepository(PermissionEntity)
        permissionRepository: Repository<PermissionEntity>,
        entityManager: EntityManager,
    ) {
        super(permissionRepository, entityManager);
    }
}
