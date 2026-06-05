import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { GuideEntity } from '../entities';

@Injectable()
export class GuidesRepository extends AbstractRepository<GuideEntity> {
    protected readonly logger = new Logger(GuidesRepository.name);

    constructor(
        @InjectRepository(GuideEntity)
        guideRepository: Repository<GuideEntity>,
        entityManager: EntityManager,
    ) {
        super(guideRepository, entityManager);
    }
}
