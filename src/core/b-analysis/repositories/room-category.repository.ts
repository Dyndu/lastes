import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { RoomCategoryEntity } from '../entities';

@Injectable()
export class RoomCategoryRepository extends AbstractRepository<RoomCategoryEntity> {
    protected readonly logger = new Logger(RoomCategoryRepository.name);

    constructor(
        @InjectRepository(RoomCategoryEntity)
        roomCategoryRepository: Repository<RoomCategoryEntity>,
        entityManager: EntityManager,
    ) {
        super(roomCategoryRepository, entityManager);
    }
}
