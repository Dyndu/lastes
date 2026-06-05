import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../libs/database/abstract.repository';
import { UserSessionEntity } from './entities/user-session.entity';

@Injectable()
export class UserSessionRepository extends AbstractRepository<UserSessionEntity> {
    protected readonly logger = new Logger(UserSessionRepository.name);

    constructor(
        @InjectRepository(UserSessionEntity)
        uSessionRepository: Repository<UserSessionEntity>,
        entityManager: EntityManager,
    ) {
        super(uSessionRepository, entityManager);
    }
}
