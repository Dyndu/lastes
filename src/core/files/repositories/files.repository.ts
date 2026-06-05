import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { FileEntity } from '../entities/file.entity';

@Injectable()
export class FilesRepository extends AbstractRepository<FileEntity> {
    protected readonly logger = new Logger(FilesRepository.name);
    constructor(
        @InjectRepository(FileEntity)
        fileRepository: Repository<FileEntity>,
        entityManager: EntityManager,
    ) {
        super(fileRepository, entityManager);
    }
}
