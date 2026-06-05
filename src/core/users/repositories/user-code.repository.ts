import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { UsersCodeEntity } from '../entities/user-code.entity';

@Injectable()
export class UsersCodeRepository extends AbstractRepository<UsersCodeEntity> {
    protected readonly logger = new Logger(UsersCodeRepository.name);
    constructor(
        @InjectRepository(UsersCodeEntity)
        usersCodeRepository: Repository<UsersCodeEntity>,
        entityManager: EntityManager,
    ) {
        super(usersCodeRepository, entityManager);
    }

    async save(userCodeEntity: UsersCodeEntity): Promise<UsersCodeEntity> {
        return this.entityManager.save(userCodeEntity);
    }
}
