import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { PSettingEntity } from '../entities';

@Injectable()
export class PSettingRepository extends AbstractRepository<PSettingEntity> {
    protected readonly logger = new Logger(PSettingRepository.name);

    constructor(
        @InjectRepository(PSettingEntity)
        pSettingRepository: Repository<PSettingEntity>,
        entityManager: EntityManager,
    ) {
        super(pSettingRepository, entityManager);
    }
}
