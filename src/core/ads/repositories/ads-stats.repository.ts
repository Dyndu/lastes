import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { AdsStatsEntity } from '../entities/ads-stats.entity';

@Injectable()
export class AdsStatsRepository extends AbstractRepository<AdsStatsEntity> {
    protected readonly logger = new Logger(AdsStatsRepository.name);

    constructor(
        @InjectRepository(AdsStatsEntity)
        adsStatRepository: Repository<AdsStatsEntity>,
        entityManager: EntityManager,
    ) {
        super(adsStatRepository, entityManager);
    }
}
