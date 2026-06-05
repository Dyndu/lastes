import { Test, TestingModule } from '@nestjs/testing';
import { DtiOtherIncomeService } from './dti-other-income.service';
import { DtiCalculatorService } from './dti-calculator.service';
import { DtiCalculatorEntity, DtiOtherIncomeEntity } from '../entities';
import { DtiOtherIncomeLabelsEnum } from '../../../common/enum';
import { CreateDtiOtherIncomeDto, UpdateDtiOtherIncomeDto } from '../dto';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const makeCalculator = (id = 'calc-1'): DtiCalculatorEntity =>
    Object.assign(new DtiCalculatorEntity(), { id });

const makeOIncomeEntity = (overrides: Partial<DtiOtherIncomeEntity> = {}): DtiOtherIncomeEntity =>
    Object.assign(new DtiOtherIncomeEntity(), {
        id: 'oincome-1',
        label: DtiOtherIncomeLabelsEnum.BONUS_PAY,
        value: 1200,
        ...overrides,
    });

const mockDtiOtherIncomeRepo = {
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
const mockOtherUtils = { formatCriteria: jest.fn().mockReturnValue('id=oincome-1') };

const mockDtiCalculatorService = {
    dtiOtherIncomeRepo: mockDtiOtherIncomeRepo,
    errorHandler: mockErrorHandler,
    logger: mockLogger,
    otherUtils: mockOtherUtils,
};

describe('DtiOtherIncomeService', () => {
    let service: DtiOtherIncomeService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DtiOtherIncomeService,
                { provide: DtiCalculatorService, useValue: mockDtiCalculatorService },
            ],
        }).compile();

        service = module.get<DtiOtherIncomeService>(DtiOtherIncomeService);
    });

    describe('buildOIncomeEntity', () => {
        it('returns a DtiOtherIncomeEntity with all required fields assigned', () => {
            const calculator = makeCalculator();
            const entity = service.buildOIncomeEntity({
                calculator,
                label: DtiOtherIncomeLabelsEnum.BONUS_PAY,
                value: 1200,
            });

            expect(entity).toBeInstanceOf(DtiOtherIncomeEntity);
            expect(entity.calculator).toBe(calculator);
            expect(entity.label).toBe(DtiOtherIncomeLabelsEnum.BONUS_PAY);
            expect(entity.value).toBe(1200);
        });
    });

    describe('ensureOIncomeLabelIsUnique', () => {
        it('calls assertUniqueActive without id when not provided', async () => {
            mockDtiOtherIncomeRepo.assertUniqueActive.mockResolvedValue(undefined);
            await service.ensureOIncomeLabelIsUnique(DtiOtherIncomeLabelsEnum.BONUS_PAY);

            expect(mockDtiOtherIncomeRepo.assertUniqueActive).toHaveBeenCalledWith(
                mockDtiOtherIncomeRepo,
                {},
                { label: DtiOtherIncomeLabelsEnum.BONUS_PAY },
                'Other income label',
                undefined,
            );
        });

        it('calls assertUniqueActive with id when provided', async () => {
            mockDtiOtherIncomeRepo.assertUniqueActive.mockResolvedValue(undefined);
            await service.ensureOIncomeLabelIsUnique(
                DtiOtherIncomeLabelsEnum.BONUS_PAY,
                'oincome-1',
            );

            expect(mockDtiOtherIncomeRepo.assertUniqueActive).toHaveBeenCalledWith(
                mockDtiOtherIncomeRepo,
                {},
                { label: DtiOtherIncomeLabelsEnum.BONUS_PAY },
                'Other income label',
                'oincome-1',
            );
        });

        it('does not call errorHandler.validation when no errors', async () => {
            mockDtiOtherIncomeRepo.assertUniqueActive.mockResolvedValue(undefined);
            await service.ensureOIncomeLabelIsUnique(DtiOtherIncomeLabelsEnum.BONUS_PAY);
            expect(mockErrorHandler.validation).not.toHaveBeenCalled();
        });

        it('calls errorHandler.validation when errors.length > 0', async () => {
            mockDtiOtherIncomeRepo.assertUniqueActive.mockImplementation(
                async (_repo: any, errors: any) => {
                    errors.length = 1;
                    errors[0] = 'Duplicate label';
                },
            );

            await service.ensureOIncomeLabelIsUnique(DtiOtherIncomeLabelsEnum.BONUS_PAY);
            expect(mockErrorHandler.validation).toHaveBeenCalled();
        });
    });

    describe('retrieveOIncomeByCriteria', () => {
        const criteria = { id: 'oincome-1' };

        it('returns the entity when found', async () => {
            const entity = makeOIncomeEntity();
            mockDtiOtherIncomeRepo.findActiveOne.mockResolvedValue(entity);

            const result = await service.retrieveOIncomeByCriteria(criteria);
            expect(mockLogger.info).toHaveBeenCalled();
            expect(result).toBe(entity);
        });

        it('passes relations to the repo', async () => {
            const entity = makeOIncomeEntity();
            mockDtiOtherIncomeRepo.findActiveOne.mockResolvedValue(entity);

            await service.retrieveOIncomeByCriteria(criteria, ['calculator']);

            expect(mockDtiOtherIncomeRepo.findActiveOne).toHaveBeenCalledWith(
                mockDtiOtherIncomeRepo,
                criteria,
                ['calculator'],
            );
        });

        it('calls errorHandler.notFound when entity is missing', async () => {
            mockDtiOtherIncomeRepo.findActiveOne.mockResolvedValue(null);
            await service.retrieveOIncomeByCriteria(criteria);
            expect(mockErrorHandler.notFound).toHaveBeenCalled();
        });
    });

    describe('createOIncomeEntity', () => {
        it('ensures uniqueness, builds and persists the entity', async () => {
            const calculator = makeCalculator();
            const dto: CreateDtiOtherIncomeDto = {
                label: DtiOtherIncomeLabelsEnum.BONUS_PAY,
                value: 900,
            } as CreateDtiOtherIncomeDto;
            const saved = makeOIncomeEntity();

            mockDtiOtherIncomeRepo.assertUniqueActive.mockResolvedValue(undefined);
            mockDtiOtherIncomeRepo.create.mockResolvedValue(saved);

            const result = await service.createOIncomeEntity(calculator, dto);

            expect(mockDtiOtherIncomeRepo.assertUniqueActive).toHaveBeenCalled();
            expect(mockDtiOtherIncomeRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    label: DtiOtherIncomeLabelsEnum.BONUS_PAY,
                    value: 900,
                }),
            );
            expect(result).toBe(saved);
        });
    });

    describe('updateOIncomeEntity', () => {
        it('returns early message when itemized is undefined', async () => {
            const entity = makeOIncomeEntity();
            const result = await service.updateOIncomeEntity(entity, undefined);
            expect(result).toEqual({ message: 'No updates provided for other income details' });
            expect(mockDtiOtherIncomeRepo.update).not.toHaveBeenCalled();
        });

        it('returns early message when itemized is an empty object', async () => {
            const entity = makeOIncomeEntity();
            const result = await service.updateOIncomeEntity(entity, {});
            expect(result).toEqual({ message: 'No updates provided for other income details' });
        });

        it('updates label when provided', async () => {
            const entity = makeOIncomeEntity();
            mockDtiOtherIncomeRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateOIncomeEntity(entity, { label: DtiOtherIncomeLabelsEnum.PENSION });

            expect(mockDtiOtherIncomeRepo.update).toHaveBeenCalledWith(
                { id: entity.id },
                expect.objectContaining({ label: DtiOtherIncomeLabelsEnum.PENSION }),
            );
        });

        it('updates value when provided', async () => {
            const entity = makeOIncomeEntity();
            mockDtiOtherIncomeRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateOIncomeEntity(entity, { value: 2000 });

            expect(mockDtiOtherIncomeRepo.update).toHaveBeenCalledWith(
                { id: entity.id },
                expect.objectContaining({ value: 2000 }),
            );
        });

        it('updates both label and value when both provided', async () => {
            const entity = makeOIncomeEntity();
            mockDtiOtherIncomeRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateOIncomeEntity(entity, {
                label: DtiOtherIncomeLabelsEnum.PENSION,
                value: 1500,
            });

            const payload = mockDtiOtherIncomeRepo.update.mock.calls[0][1];
            expect(payload.label).toBe(DtiOtherIncomeLabelsEnum.PENSION);
            expect(payload.value).toBe(1500);
        });

        it('omits undefined fields from the payload', async () => {
            const entity = makeOIncomeEntity();
            mockDtiOtherIncomeRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateOIncomeEntity(entity, { value: 1800 });

            const payload = mockDtiOtherIncomeRepo.update.mock.calls[0][1];
            expect(payload).not.toHaveProperty('label');
        });
    });

    describe('updateOIncome', () => {
        it('retrieves entity, skips uniqueness check when no label, then updates', async () => {
            const entity = makeOIncomeEntity();
            mockDtiOtherIncomeRepo.findActiveOne.mockResolvedValue(entity);
            mockDtiOtherIncomeRepo.update.mockResolvedValue({ affected: 1 });

            const dto: UpdateDtiOtherIncomeDto = { value: 1300 } as UpdateDtiOtherIncomeDto;
            await service.updateOIncome('oincome-1', dto);

            expect(mockDtiOtherIncomeRepo.assertUniqueActive).not.toHaveBeenCalled();
            expect(mockDtiOtherIncomeRepo.update).toHaveBeenCalled();
        });

        it('checks label uniqueness when dto.label is provided', async () => {
            const entity = makeOIncomeEntity();
            mockDtiOtherIncomeRepo.findActiveOne.mockResolvedValue(entity);
            mockDtiOtherIncomeRepo.assertUniqueActive.mockResolvedValue(undefined);
            mockDtiOtherIncomeRepo.update.mockResolvedValue({ affected: 1 });

            const dto: UpdateDtiOtherIncomeDto = {
                label: DtiOtherIncomeLabelsEnum.PENSION,
                value: 1000,
            } as UpdateDtiOtherIncomeDto;
            await service.updateOIncome('oincome-1', dto);

            expect(mockDtiOtherIncomeRepo.assertUniqueActive).toHaveBeenCalledWith(
                mockDtiOtherIncomeRepo,
                {},
                { label: DtiOtherIncomeLabelsEnum.PENSION },
                'Other income label',
                entity.id,
            );
        });
    });

    describe('deleteOIncome', () => {
        it('retrieves the entity then deletes it by id', async () => {
            const entity = makeOIncomeEntity();
            mockDtiOtherIncomeRepo.findActiveOne.mockResolvedValue(entity);
            mockDtiOtherIncomeRepo.delete.mockResolvedValue({ affected: 1 });

            await service.deleteOIncome('oincome-1');

            expect(mockDtiOtherIncomeRepo.delete).toHaveBeenCalledWith({ id: entity.id });
        });
    });
});
