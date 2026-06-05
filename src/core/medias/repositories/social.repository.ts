import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { SocialEntity } from '../entities';

@Injectable()
export class SocialRepository extends AbstractRepository<SocialEntity> {
    protected readonly logger = new Logger(SocialRepository.name);

    constructor(
        @InjectRepository(SocialEntity)
        socialRepository: Repository<SocialEntity>,
        entityManager: EntityManager,
    ) {
        super(socialRepository, entityManager);
    }
}
