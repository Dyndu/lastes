import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RCalculatorRepository } from './r-calculator.repository';
import { RCalculatorEntity } from './entity/r-calculator.entity';

describe('RCalculatorRepository', () => {
    let rehabCalculatorRepository: RCalculatorRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RCalculatorRepository,
                {
                    provide: getRepositoryToken(RCalculatorEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        rehabCalculatorRepository = module.get<RCalculatorRepository>(RCalculatorRepository);
    });

    it('should be defined', () => {
        expect(rehabCalculatorRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(rehabCalculatorRepository['logger']).toBeDefined();
    });
});
