import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../libs/database/abstract.repository';
import { PropertyEntity } from './entities/property.entity';

@Injectable()
export class PropertiesRepository extends AbstractRepository<PropertyEntity> {
    protected readonly logger = new Logger(PropertiesRepository.name);

    constructor(
        @InjectRepository(PropertyEntity)
        propertyRepository: Repository<PropertyEntity>,
        entityManager: EntityManager,
    ) {
        super(propertyRepository, entityManager);
    }
}
