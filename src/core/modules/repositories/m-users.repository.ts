import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { MUsersEntity } from '../entities';

@Injectable()
export class MUsersRepository extends AbstractRepository<MUsersEntity> {
    protected readonly logger = new Logger(MUsersRepository.name);

    constructor(
        @InjectRepository(MUsersEntity)
        mUsersRepository: Repository<MUsersEntity>,
        entityManager: EntityManager,
    ) {
        super(mUsersRepository, entityManager);
    }
}
