import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../libs/database/abstract.repository';
import { RoleEntity } from './entities/role.entity';

@Injectable()
export class RolesRepository extends AbstractRepository<RoleEntity> {
    protected readonly logger = new Logger(RolesRepository.name);

    constructor(
        @InjectRepository(RoleEntity)
        roleRepository: Repository<RoleEntity>,
        entityManager: EntityManager,
    ) {
        super(roleRepository, entityManager);
    }
}
