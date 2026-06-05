import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { SMessagesEntity } from '../entities';

@Injectable()
export class SMessagesRepository extends AbstractRepository<SMessagesEntity> {
    protected readonly logger = new Logger(SMessagesRepository.name);

    constructor(
        @InjectRepository(SMessagesEntity)
        sMessageRepository: Repository<SMessagesEntity>,
        entityManager: EntityManager,
    ) {
        super(sMessageRepository, entityManager);
    }
}
