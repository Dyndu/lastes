import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FooterInfoRepository } from './footer-info.repository';
import { FooterInfoEntity } from '../entities';

describe('FooterInfoRepository', () => {
    let fInfoRepository: FooterInfoRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FooterInfoRepository,
                {
                    provide: getRepositoryToken(FooterInfoEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        fInfoRepository = module.get<FooterInfoRepository>(FooterInfoRepository);
    });

    it('should be defined', () => {
        expect(fInfoRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(fInfoRepository['logger']).toBeDefined();
    });
});
