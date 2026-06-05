import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../libs/database/abstract.repository';
import { FFlipEntity } from './entity/f-flip.entity';

@Injectable()
export class FFlipRepository extends AbstractRepository<FFlipEntity> {
    protected readonly logger = new Logger(FFlipRepository.name);

    constructor(
        @InjectRepository(FFlipEntity)
        fFlipRepository: Repository<FFlipEntity>,
        entityManager: EntityManager,
    ) {
        super(fFlipRepository, entityManager);
    }
}
