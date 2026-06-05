import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { NotificationEntity } from '../entities/notification.entity';

@Injectable()
export class NotificationsRepository extends AbstractRepository<NotificationEntity> {
    protected readonly logger = new Logger(NotificationsRepository.name);
    constructor(
        @InjectRepository(NotificationEntity)
        notificationRepository: Repository<NotificationEntity>,
        entityManager: EntityManager,
    ) {
        super(notificationRepository, entityManager);
    }
}
