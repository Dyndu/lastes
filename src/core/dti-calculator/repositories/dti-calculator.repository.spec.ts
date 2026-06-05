import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DtiCalculatorRepository } from './dti-calculator.repository';
import { DtiCalculatorEntity } from '../entities';

describe('DtiCalculatorRepository', () => {
    let dtiCalculatorRepository: DtiCalculatorRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DtiCalculatorRepository,
                {
                    provide: getRepositoryToken(DtiCalculatorEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        dtiCalculatorRepository = module.get<DtiCalculatorRepository>(DtiCalculatorRepository);
    });

    it('should be defined', () => {
        expect(dtiCalculatorRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(dtiCalculatorRepository['logger']).toBeDefined();
    });
});
