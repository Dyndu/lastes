import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { FooterInfoEntity } from '../entities';

@Injectable()
export class FooterInfoRepository extends AbstractRepository<FooterInfoEntity> {
    protected readonly logger = new Logger(FooterInfoRepository.name);

    constructor(
        @InjectRepository(FooterInfoEntity)
        mediaRepository: Repository<FooterInfoEntity>,
        entityManager: EntityManager,
    ) {
        super(mediaRepository, entityManager);
    }
}
