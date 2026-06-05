import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { NUsersEntity } from '../entities/n-users.entity';

@Injectable()
export class NUsersRepository extends AbstractRepository<NUsersEntity> {
    protected readonly logger = new Logger(NUsersRepository.name);
    constructor(
        @InjectRepository(NUsersEntity)
        nUserRepository: Repository<NUsersEntity>,
        entityManager: EntityManager,
    ) {
        super(nUserRepository, entityManager);
    }
}
