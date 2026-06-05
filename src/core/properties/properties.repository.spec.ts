import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PropertiesRepository } from './properties.repository';
import { PropertyEntity } from './entities/property.entity';

describe('PropertiesRepository', () => {
    let propertyRepository: PropertiesRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PropertiesRepository,
                {
                    provide: getRepositoryToken(PropertyEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        propertyRepository = module.get<PropertiesRepository>(PropertiesRepository);
    });

    it('should be defined', () => {
        expect(propertyRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(propertyRepository['logger']).toBeDefined();
    });
});
