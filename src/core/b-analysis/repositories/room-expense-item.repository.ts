import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { RoomExpenseItemEntity } from '../entities';

@Injectable()
export class RoomExpenseItemRepository extends AbstractRepository<RoomExpenseItemEntity> {
    protected readonly logger = new Logger(RoomExpenseItemRepository.name);

    constructor(
        @InjectRepository(RoomExpenseItemEntity)
        roomExpenseItemRepository: Repository<RoomExpenseItemEntity>,
        entityManager: EntityManager,
    ) {
        super(roomExpenseItemRepository, entityManager);
    }
}
