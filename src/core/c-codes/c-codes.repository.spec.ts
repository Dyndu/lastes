import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CCodesRepository } from './c-codes.repository';
import { CCodeEntity } from './entities/c-code.entity';

describe('CCodesRepository', () => {
    let cCodeRepository: CCodesRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CCodesRepository,
                {
                    provide: getRepositoryToken(CCodeEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        cCodeRepository = module.get<CCodesRepository>(CCodesRepository);
    });

    it('should be defined', () => {
        expect(cCodeRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(cCodeRepository['logger']).toBeDefined();
    });
});
