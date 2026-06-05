import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ResetPasswordRequestEntity } from '../entities/reset-password-request.entity';

@Injectable()
export class ResetPasswordRequestRepository extends AbstractRepository<ResetPasswordRequestEntity> {
    protected readonly logger = new Logger(ResetPasswordRequestRepository.name);
    constructor(
        @InjectRepository(ResetPasswordRequestEntity)
        resetPasswordRequestRepository: Repository<ResetPasswordRequestEntity>,
        entityManager: EntityManager,
    ) {
        super(resetPasswordRequestRepository, entityManager);
    }
}
