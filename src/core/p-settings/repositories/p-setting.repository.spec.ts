import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PSettingRepository } from './p-setting.repository';
import { PSettingEntity } from '../entities';

describe('PSettingRepository', () => {
    let pSettingRepository: PSettingRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PSettingRepository,
                {
                    provide: getRepositoryToken(PSettingEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        pSettingRepository = module.get<PSettingRepository>(PSettingRepository);
    });

    it('should be defined', () => {
        expect(pSettingRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(pSettingRepository['logger']).toBeDefined();
    });
});
