import { Test, TestingModule } from '@nestjs/testing';
import { DtiOtherDebtsService } from './dti-other-debts.service';
import { DtiCalculatorService } from './dti-calculator.service';
import { DtiCalculatorEntity, DtiOtherDebtsEntity } from '../entities';
import { DtiOtherDebtsLabelsEnum } from '../../../common/enum';
import { CreateDtiOtherDebtDto, UpdateDtiOtherDebtDto } from '../dto';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const makeCalculator = (id = 'calc-1'): DtiCalculatorEntity =>
    Object.assign(new DtiCalculatorEntity(), { id });

const makeDebtEntity = (overrides: Partial<DtiOtherDebtsEntity> = {}): DtiOtherDebtsEntity =>
    Object.assign(new DtiOtherDebtsEntity(), {
        id: 'debt-1',
        label: DtiOtherDebtsLabelsEnum.STUDENT_LOAN,
        value: 500,
        ...overrides,
    });

const mockDtiOtherDebtsRepo = {
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
const mockOtherUtils = { formatCriteria: jest.fn().mockReturnValue('id=debt-1') };

const mockDtiCalculatorService = {
    dtiOtherDebtsRepo: mockDtiOtherDebtsRepo,
    errorHandler: mockErrorHandler,
    logger: mockLogger,
    otherUtils: mockOtherUtils,
};

describe('DtiOtherDebtsService', () => {
    let service: DtiOtherDebtsService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DtiOtherDebtsService,
                { provide: DtiCalculatorService, useValue: mockDtiCalculatorService },
            ],
        }).compile();

        service = module.get<DtiOtherDebtsService>(DtiOtherDebtsService);
    });

    describe('buildODebtsEntity', () => {
        it('returns a DtiOtherDebtsEntity with all required fields assigned', () => {
            const calculator = makeCalculator();
            const entity = service.buildODebtsEntity({
                calculator,
                label: DtiOtherDebtsLabelsEnum.STUDENT_LOAN,
                value: 500,
            });

            expect(entity).toBeInstanceOf(DtiOtherDebtsEntity);
            expect(entity.calculator).toBe(calculator);
            expect(entity.label).toBe(DtiOtherDebtsLabelsEnum.STUDENT_LOAN);
            expect(entity.value).toBe(500);
        });
    });

    describe('ensureODebtsLabelIsUnique', () => {
        it('calls assertUniqueActive without id when not provided', async () => {
            mockDtiOtherDebtsRepo.assertUniqueActive.mockResolvedValue(undefined);
            await service.ensureODebtsLabelIsUnique(DtiOtherDebtsLabelsEnum.STUDENT_LOAN);

            expect(mockDtiOtherDebtsRepo.assertUniqueActive).toHaveBeenCalledWith(
                mockDtiOtherDebtsRepo,
                {},
                { label: DtiOtherDebtsLabelsEnum.STUDENT_LOAN },
                'Other debts label',
                undefined,
            );
        });

        it('calls assertUniqueActive with id when provided', async () => {
            mockDtiOtherDebtsRepo.assertUniqueActive.mockResolvedValue(undefined);
            await service.ensureODebtsLabelIsUnique(DtiOtherDebtsLabelsEnum.STUDENT_LOAN, 'debt-1');

            expect(mockDtiOtherDebtsRepo.assertUniqueActive).toHaveBeenCalledWith(
                mockDtiOtherDebtsRepo,
                {},
                { label: DtiOtherDebtsLabelsEnum.STUDENT_LOAN },
                'Other debts label',
                'debt-1',
            );
        });

        it('does not call errorHandler.validation when no errors', async () => {
            mockDtiOtherDebtsRepo.assertUniqueActive.mockResolvedValue(undefined);
            await service.ensureODebtsLabelIsUnique(DtiOtherDebtsLabelsEnum.STUDENT_LOAN);
            expect(mockErrorHandler.validation).not.toHaveBeenCalled();
        });

        it('calls errorHandler.validation when errors.length > 0', async () => {
            mockDtiOtherDebtsRepo.assertUniqueActive.mockImplementation(
                async (_repo: any, errors: any) => {
                    errors.length = 1;
                    errors[0] = 'Duplicate label';
                },
            );

            await service.ensureODebtsLabelIsUnique(DtiOtherDebtsLabelsEnum.STUDENT_LOAN);
            expect(mockErrorHandler.validation).toHaveBeenCalled();
        });
    });

    describe('retrieveODebtsByCriteria', () => {
        const criteria = { id: 'debt-1' };

        it('returns the entity when found', async () => {
            const entity = makeDebtEntity();
            mockDtiOtherDebtsRepo.findActiveOne.mockResolvedValue(entity);

            const result = await service.retrieveODebtsByCriteria(criteria);
            expect(mockLogger.info).toHaveBeenCalled();
            expect(result).toBe(entity);
        });

        it('passes relations to the repo', async () => {
            const entity = makeDebtEntity();
            mockDtiOtherDebtsRepo.findActiveOne.mockResolvedValue(entity);

            await service.retrieveODebtsByCriteria(criteria, ['calculator']);

            expect(mockDtiOtherDebtsRepo.findActiveOne).toHaveBeenCalledWith(
                mockDtiOtherDebtsRepo,
                criteria,
                ['calculator'],
            );
        });

        it('calls errorHandler.notFound when entity is missing', async () => {
            mockDtiOtherDebtsRepo.findActiveOne.mockResolvedValue(null);
            await service.retrieveODebtsByCriteria(criteria);
            expect(mockErrorHandler.notFound).toHaveBeenCalled();
        });
    });

    describe('createODebtEntity', () => {
        it('ensures uniqueness, builds and persists the entity', async () => {
            const calculator = makeCalculator();
            const dto: CreateDtiOtherDebtDto = {
                label: DtiOtherDebtsLabelsEnum.STUDENT_LOAN,
                value: 400,
            } as CreateDtiOtherDebtDto;
            const saved = makeDebtEntity();

            mockDtiOtherDebtsRepo.assertUniqueActive.mockResolvedValue(undefined);
            mockDtiOtherDebtsRepo.create.mockResolvedValue(saved);

            const result = await service.createODebtEntity(calculator, dto);

            expect(mockDtiOtherDebtsRepo.assertUniqueActive).toHaveBeenCalled();
            expect(mockDtiOtherDebtsRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    label: DtiOtherDebtsLabelsEnum.STUDENT_LOAN,
                    value: 400,
                }),
            );
            expect(result).toBe(saved);
        });
    });

    describe('updateODebtEntity', () => {
        it('returns early message when itemized is undefined', async () => {
            const entity = makeDebtEntity();
            const result = await service.updateODebtEntity(entity, undefined);
            expect(result).toEqual({ message: 'No updates provided for other debt details' });
            expect(mockDtiOtherDebtsRepo.update).not.toHaveBeenCalled();
        });

        it('returns early message when itemized is empty object', async () => {
            const entity = makeDebtEntity();
            const result = await service.updateODebtEntity(entity, {});
            expect(result).toEqual({ message: 'No updates provided for other debt details' });
        });

        it('updates label when provided', async () => {
            const entity = makeDebtEntity();
            mockDtiOtherDebtsRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateODebtEntity(entity, {
                label: DtiOtherDebtsLabelsEnum.STUDENT_LOAN,
            });

            expect(mockDtiOtherDebtsRepo.update).toHaveBeenCalledWith(
                { id: entity.id },
                expect.objectContaining({ label: DtiOtherDebtsLabelsEnum.STUDENT_LOAN }),
            );
        });

        it('updates value when provided', async () => {
            const entity = makeDebtEntity();
            mockDtiOtherDebtsRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateODebtEntity(entity, { value: 800 });

            expect(mockDtiOtherDebtsRepo.update).toHaveBeenCalledWith(
                { id: entity.id },
                expect.objectContaining({ value: 800 }),
            );
        });

        it('updates both label and value when both are provided', async () => {
            const entity = makeDebtEntity();
            mockDtiOtherDebtsRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateODebtEntity(entity, {
                label: DtiOtherDebtsLabelsEnum.ALIMONY,
                value: 200,
            });

            const payload = mockDtiOtherDebtsRepo.update.mock.calls[0][1];
            expect(payload.label).toBe(DtiOtherDebtsLabelsEnum.ALIMONY);
            expect(payload.value).toBe(200);
        });

        it('omits undefined fields from the payload', async () => {
            const entity = makeDebtEntity();
            mockDtiOtherDebtsRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateODebtEntity(entity, { value: 600 });

            const payload = mockDtiOtherDebtsRepo.update.mock.calls[0][1];
            expect(payload).not.toHaveProperty('label');
        });
    });

    describe('updateODebt', () => {
        it('retrieves entity, skips uniqueness check when dto has no label, then updates', async () => {
            const entity = makeDebtEntity();
            mockDtiOtherDebtsRepo.findActiveOne.mockResolvedValue(entity);
            mockDtiOtherDebtsRepo.update.mockResolvedValue({ affected: 1 });

            const dto: UpdateDtiOtherDebtDto = { value: 700 } as UpdateDtiOtherDebtDto;
            await service.updateODebt('debt-1', dto);

            expect(mockDtiOtherDebtsRepo.assertUniqueActive).not.toHaveBeenCalled();
            expect(mockDtiOtherDebtsRepo.update).toHaveBeenCalled();
        });

        it('checks label uniqueness when dto.label is provided', async () => {
            const entity = makeDebtEntity();
            mockDtiOtherDebtsRepo.findActiveOne.mockResolvedValue(entity);
            mockDtiOtherDebtsRepo.assertUniqueActive.mockResolvedValue(undefined);
            mockDtiOtherDebtsRepo.update.mockResolvedValue({ affected: 1 });

            const dto: UpdateDtiOtherDebtDto = {
                label: DtiOtherDebtsLabelsEnum.STUDENT_LOAN,
                value: 300,
            } as UpdateDtiOtherDebtDto;
            await service.updateODebt('debt-1', dto);

            expect(mockDtiOtherDebtsRepo.assertUniqueActive).toHaveBeenCalledWith(
                mockDtiOtherDebtsRepo,
                {},
                { label: DtiOtherDebtsLabelsEnum.STUDENT_LOAN },
                'Other debts label',
                entity.id,
            );
        });
    });

    describe('deleteODebt', () => {
        it('retrieves the entity then deletes it by id', async () => {
            const entity = makeDebtEntity();
            mockDtiOtherDebtsRepo.findActiveOne.mockResolvedValue(entity);
            mockDtiOtherDebtsRepo.delete.mockResolvedValue({ affected: 1 });

            await service.deleteODebt('debt-1');

            expect(mockDtiOtherDebtsRepo.delete).toHaveBeenCalledWith({ id: entity.id });
        });
    });
});
