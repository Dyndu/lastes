import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UsersRepository extends AbstractRepository<UserEntity> {
    protected readonly logger = new Logger(UsersRepository.name);

    constructor(
        @InjectRepository(UserEntity)
        userRepository: Repository<UserEntity>,
        entityManager: EntityManager,
    ) {
        super(userRepository, entityManager);
    }
}
