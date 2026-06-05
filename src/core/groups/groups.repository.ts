import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../libs/database/abstract.repository';
import { GroupEntity } from './entities/group.entity';

@Injectable()
export class GroupsRepository extends AbstractRepository<GroupEntity> {
    protected readonly logger = new Logger(GroupsRepository.name);

    constructor(
        @InjectRepository(GroupEntity)
        groupRepository: Repository<GroupEntity>,
        entityManager: EntityManager,
    ) {
        super(groupRepository, entityManager);
    }
}
