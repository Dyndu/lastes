import { Test, TestingModule } from '@nestjs/testing';
import { DtiEIncomeService } from './dti-e-income.service';
import { DtiCalculatorService } from './dti-calculator.service';
import { DtiCalculatorEntity, DtiEIncomeEntity } from '../entities';
import { CreateDtiEmploymentIncomeDto, UpdateDtiEmploymentIncomeDto } from '../dto';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const makeCalculator = (id = 'calc-1'): DtiCalculatorEntity =>
    Object.assign(new DtiCalculatorEntity(), { id });

const makeEIncomeEntity = (overrides: Partial<DtiEIncomeEntity> = {}): DtiEIncomeEntity =>
    Object.assign(new DtiEIncomeEntity(), {
        id: 'income-1',
        label: 'Salary',
        value: 3000,
        ...overrides,
    });

const mockDtiEIncomeRepo = {
    assertUniqueActive: jest.fn(),
    findActiveOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
};

const mockErrorHandler = {
    validation: jest.fn(),
    notFound: jest.fn(),
};

const mockLogger = { info: jest.fn() };

const mockOtherUtils = { formatCriteria: jest.fn().mockReturnValue('id=income-1') };

const mockDtiCalculatorService = {
    dtiEIncomeRepo: mockDtiEIncomeRepo,
    errorHandler: mockErrorHandler,
    logger: mockLogger,
    otherUtils: mockOtherUtils,
};

describe('DtiEIncomeService', () => {
    let service: DtiEIncomeService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DtiEIncomeService,
                { provide: DtiCalculatorService, useValue: mockDtiCalculatorService },
            ],
        }).compile();

        service = module.get<DtiEIncomeService>(DtiEIncomeService);
    });

    describe('buildEIncomeEntity', () => {
        it('returns a DtiEIncomeEntity with all required fields assigned', () => {
            const calculator = makeCalculator();
            const entity = service.buildEIncomeEntity({ calculator, label: 'Salary', value: 3000 });

            expect(entity).toBeInstanceOf(DtiEIncomeEntity);
            expect(entity.calculator).toBe(calculator);
            expect(entity.label).toBe('Salary');
            expect(entity.value).toBe(3000);
        });
    });

    describe('ensureEIncomeLabelIsUnique', () => {
        it('calls assertUniqueActive without id when id is not provided', async () => {
            mockDtiEIncomeRepo.assertUniqueActive.mockResolvedValue(undefined);
            await service.ensureEIncomeLabelIsUnique('Salary');

            expect(mockDtiEIncomeRepo.assertUniqueActive).toHaveBeenCalledWith(
                mockDtiEIncomeRepo,
                {},
                { label: 'Salary' },
                'Employment income label',
                undefined,
            );
        });

        it('calls assertUniqueActive with id when provided', async () => {
            mockDtiEIncomeRepo.assertUniqueActive.mockResolvedValue(undefined);
            await service.ensureEIncomeLabelIsUnique('Salary', 'income-1');

            expect(mockDtiEIncomeRepo.assertUniqueActive).toHaveBeenCalledWith(
                mockDtiEIncomeRepo,
                {},
                { label: 'Salary' },
                'Employment income label',
                'income-1',
            );
        });

        it('does not call errorHandler.validation when errors object is empty', async () => {
            mockDtiEIncomeRepo.assertUniqueActive.mockResolvedValue(undefined);
            await service.ensureEIncomeLabelIsUnique('Salary');
            expect(mockErrorHandler.validation).not.toHaveBeenCalled();
        });

        it('calls errorHandler.validation when errors has length > 0', async () => {
            mockDtiEIncomeRepo.assertUniqueActive.mockImplementation(
                async (_repo: any, errors: any) => {
                    errors.length = 1;
                    errors[0] = 'Duplicate label';
                },
            );

            await service.ensureEIncomeLabelIsUnique('Salary');
            expect(mockErrorHandler.validation).toHaveBeenCalled();
        });
    });

    describe('retrieveEIncomeByCriteria', () => {
        const criteria = { id: 'income-1' };

        it('returns the entity when found', async () => {
            const entity = makeEIncomeEntity();
            mockDtiEIncomeRepo.findActiveOne.mockResolvedValue(entity);

            const result = await service.retrieveEIncomeByCriteria(criteria);

            expect(mockLogger.info).toHaveBeenCalled();
            expect(result).toBe(entity);
        });

        it('passes relations to the repo when provided', async () => {
            const entity = makeEIncomeEntity();
            mockDtiEIncomeRepo.findActiveOne.mockResolvedValue(entity);

            await service.retrieveEIncomeByCriteria(criteria, ['calculator']);

            expect(mockDtiEIncomeRepo.findActiveOne).toHaveBeenCalledWith(
                mockDtiEIncomeRepo,
                criteria,
                ['calculator'],
            );
        });

        it('calls errorHandler.notFound when entity does not exist', async () => {
            mockDtiEIncomeRepo.findActiveOne.mockResolvedValue(null);

            await service.retrieveEIncomeByCriteria(criteria);

            expect(mockErrorHandler.notFound).toHaveBeenCalled();
        });
    });

    describe('createEIncomeEntity', () => {
        it('checks uniqueness, builds and persists the entity', async () => {
            const calculator = makeCalculator();
            const dto: CreateDtiEmploymentIncomeDto = {
                label: 'Freelance',
                value: 1500,
            } as CreateDtiEmploymentIncomeDto;
            const saved = makeEIncomeEntity({ label: 'Freelance', value: 1500 });

            mockDtiEIncomeRepo.assertUniqueActive.mockResolvedValue(undefined);
            mockDtiEIncomeRepo.create.mockResolvedValue(saved);

            const result = await service.createEIncomeEntity(calculator, dto);

            expect(mockDtiEIncomeRepo.assertUniqueActive).toHaveBeenCalled();
            expect(mockDtiEIncomeRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({ label: 'Freelance', value: 1500 }),
            );
            expect(result).toBe(saved);
        });
    });

    describe('updateEIncomeEntity', () => {
        it('returns early message when itemized is undefined', async () => {
            const entity = makeEIncomeEntity();
            const result = await service.updateEIncomeEntity(entity, undefined);
            expect(result).toEqual({
                message: 'No updates provided for employment income details',
            });
            expect(mockDtiEIncomeRepo.update).not.toHaveBeenCalled();
        });

        it('returns early message when itemized is an empty object', async () => {
            const entity = makeEIncomeEntity();
            const result = await service.updateEIncomeEntity(entity, {});
            expect(result).toEqual({
                message: 'No updates provided for employment income details',
            });
        });

        it('trims and updates the label field', async () => {
            const entity = makeEIncomeEntity();
            mockDtiEIncomeRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateEIncomeEntity(entity, { label: '  Bonus  ' });

            expect(mockDtiEIncomeRepo.update).toHaveBeenCalledWith(
                { id: entity.id },
                expect.objectContaining({ label: 'Bonus' }),
            );
        });

        it('skips label when it is blank after trim', async () => {
            const entity = makeEIncomeEntity();
            mockDtiEIncomeRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateEIncomeEntity(entity, { label: '   ', value: 999 });

            const payload = mockDtiEIncomeRepo.update.mock.calls[0][1];
            expect(payload).not.toHaveProperty('label');
            expect(payload.value).toBe(999);
        });

        it('updates value when provided', async () => {
            const entity = makeEIncomeEntity();
            mockDtiEIncomeRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateEIncomeEntity(entity, { value: 5000 });

            expect(mockDtiEIncomeRepo.update).toHaveBeenCalledWith(
                { id: entity.id },
                expect.objectContaining({ value: 5000 }),
            );
        });

        it('does not include undefined fields in the payload', async () => {
            const entity = makeEIncomeEntity();
            mockDtiEIncomeRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateEIncomeEntity(entity, { label: 'Bonus' });

            const payload = mockDtiEIncomeRepo.update.mock.calls[0][1];
            expect(payload).not.toHaveProperty('value');
        });
    });

    describe('updateEIncome', () => {
        it('retrieves entity, skips uniqueness check when no label, then updates', async () => {
            const entity = makeEIncomeEntity();
            mockDtiEIncomeRepo.findActiveOne.mockResolvedValue(entity);
            mockDtiEIncomeRepo.update.mockResolvedValue({ affected: 1 });

            const dto: UpdateDtiEmploymentIncomeDto = {
                value: 4000,
            } as UpdateDtiEmploymentIncomeDto;
            await service.updateEIncome('income-1', dto);

            expect(mockDtiEIncomeRepo.assertUniqueActive).not.toHaveBeenCalled();
            expect(mockDtiEIncomeRepo.update).toHaveBeenCalled();
        });

        it('checks label uniqueness when dto.label is provided', async () => {
            const entity = makeEIncomeEntity();
            mockDtiEIncomeRepo.findActiveOne.mockResolvedValue(entity);
            mockDtiEIncomeRepo.assertUniqueActive.mockResolvedValue(undefined);
            mockDtiEIncomeRepo.update.mockResolvedValue({ affected: 1 });

            const dto: UpdateDtiEmploymentIncomeDto = {
                label: 'New Label',
                value: 4000,
            } as UpdateDtiEmploymentIncomeDto;
            await service.updateEIncome('income-1', dto);

            expect(mockDtiEIncomeRepo.assertUniqueActive).toHaveBeenCalledWith(
                mockDtiEIncomeRepo,
                {},
                { label: 'New Label' },
                'Employment income label',
                entity.id,
            );
        });
    });

    describe('deleteEIncome', () => {
        it('retrieves the entity then deletes it by id', async () => {
            const entity = makeEIncomeEntity();
            mockDtiEIncomeRepo.findActiveOne.mockResolvedValue(entity);
            mockDtiEIncomeRepo.delete.mockResolvedValue({ affected: 1 });

            await service.deleteEIncome('income-1');

            expect(mockDtiEIncomeRepo.delete).toHaveBeenCalledWith({ id: entity.id });
        });
    });
});
