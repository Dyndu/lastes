import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../libs/database/abstract.repository';
import { NewsletterEntity } from './entities/newsletter.entity';

@Injectable()
export class NewslettersRepository extends AbstractRepository<NewsletterEntity> {
    protected readonly logger = new Logger(NewslettersRepository.name);

    constructor(
        @InjectRepository(NewsletterEntity)
        newLettersRepository: Repository<NewsletterEntity>,
        entityManager: EntityManager,
    ) {
        super(newLettersRepository, entityManager);
    }
}
