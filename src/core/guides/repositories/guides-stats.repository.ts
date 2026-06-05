import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { GuidesStatsEntity } from '../entities';

@Injectable()
export class GuidesStatsRepository extends AbstractRepository<GuidesStatsEntity> {
    protected readonly logger = new Logger(GuidesStatsRepository.name);

    constructor(
        @InjectRepository(GuidesStatsEntity)
        guideStatRepository: Repository<GuidesStatsEntity>,
        entityManager: EntityManager,
    ) {
        super(guideStatRepository, entityManager);
    }
}
