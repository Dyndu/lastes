import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { UserGuideLikeEntity } from '../entities';

@Injectable()
export class UserGuideLikeRepository extends AbstractRepository<UserGuideLikeEntity> {
    protected readonly logger = new Logger(UserGuideLikeRepository.name);

    constructor(
        @InjectRepository(UserGuideLikeEntity)
        userGuideLikeRepository: Repository<UserGuideLikeEntity>,
        entityManager: EntityManager,
    ) {
        super(userGuideLikeRepository, entityManager);
    }
}
