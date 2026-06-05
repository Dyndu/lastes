import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { MediaEntity } from '../entities';

@Injectable()
export class MediasRepository extends AbstractRepository<MediaEntity> {
    protected readonly logger = new Logger(MediasRepository.name);

    constructor(
        @InjectRepository(MediaEntity)
        mediaRepository: Repository<MediaEntity>,
        entityManager: EntityManager,
    ) {
        super(mediaRepository, entityManager);
    }
}
