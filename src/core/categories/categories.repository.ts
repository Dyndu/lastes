import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../libs/database/abstract.repository';
import { CategoryEntity } from './entities/category.entity';

@Injectable()
export class CategoriesRepository extends AbstractRepository<CategoryEntity> {
    protected readonly logger = new Logger(CategoriesRepository.name);
    constructor(
        @InjectRepository(CategoryEntity)
        fileLinksRepository: Repository<CategoryEntity>,
        entityManager: EntityManager,
    ) {
        super(fileLinksRepository, entityManager);
    }
}
