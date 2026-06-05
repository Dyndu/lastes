import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MCalculatorRepository } from './m-calculator.repository';
import { MCalculatorEntity } from './entities/m-calculator.entity';

describe('MCalculatorRepository', () => {
    let mCalculatorRepository: MCalculatorRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MCalculatorRepository,
                {
                    provide: getRepositoryToken(MCalculatorEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        mCalculatorRepository = module.get<MCalculatorRepository>(MCalculatorRepository);
    });

    it('should be defined', () => {
        expect(mCalculatorRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(mCalculatorRepository['logger']).toBeDefined();
    });
});
