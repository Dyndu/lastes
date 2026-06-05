import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { RoomSectionEntity } from '../entities';

@Injectable()
export class RoomSectionRepository extends AbstractRepository<RoomSectionEntity> {
    protected readonly logger = new Logger(RoomSectionRepository.name);

    constructor(
        @InjectRepository(RoomSectionEntity)
        roomSectionRepository: Repository<RoomSectionEntity>,
        entityManager: EntityManager,
    ) {
        super(roomSectionRepository, entityManager);
    }
}
