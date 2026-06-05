import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { FileLinksEntity } from '../entities/file-links.entity';

@Injectable()
export class FileLinksRepository extends AbstractRepository<FileLinksEntity> {
    protected readonly logger = new Logger(FileLinksRepository.name);
    constructor(
        @InjectRepository(FileLinksEntity)
        fileLinksRepository: Repository<FileLinksEntity>,
        entityManager: EntityManager,
    ) {
        super(fileLinksRepository, entityManager);
    }
}
