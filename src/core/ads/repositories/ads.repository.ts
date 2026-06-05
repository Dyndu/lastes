import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { AdsEntity } from '../entities/ads.entity';

@Injectable()
export class AdsRepository extends AbstractRepository<AdsEntity> {
    protected readonly logger = new Logger(AdsRepository.name);

    constructor(
        @InjectRepository(AdsEntity)
        adsRepository: Repository<AdsEntity>,
        entityManager: EntityManager,
    ) {
        super(adsRepository, entityManager);
    }
}
