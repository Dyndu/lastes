import { Test, TestingModule } from '@nestjs/testing';
import { PreMCalculatorService } from './pre-m-calculator.service';
import { MCalculatorService } from './m-calculator.service';
import { MCalculatorEntity } from '../entities/m-calculator.entity';
import { CreateMCalculatorDto } from '../dto';
import {
    CreditScoreEnum,
    ExtraPaymentFrequencyEnum,
    MCalculatorTypeEnum,
} from '../../../common/enum';
import { UserEntity } from '../../users/entities/user.entity';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const makeUser = (id = 'user-1'): UserEntity => ({ id }) as UserEntity;

const makeCalculatorEntity = (overrides: Partial<MCalculatorEntity> = {}): MCalculatorEntity =>
    ({
        id: 'calc-1',
        purchasePrice: 300_000,
        downPaymentAmount: 60_000,
        downPaymentPercentage: 20,
        loanAmount: 240_000,
        interestRate: 5,
        loanTerm: 30,
        typeEnum: MCalculatorTypeEnum.BASIC,
        loanStartDate: undefined,
        annualPropertyTaxes: undefined,
        annualHomeInsurance: undefined,
        additionalMonthlyPayment: undefined,
        creditScore: undefined,
        ...overrides,
    }) as MCalculatorEntity;

const makeAdvancedDto = (overrides: Partial<CreateMCalculatorDto> = {}): CreateMCalculatorDto =>
    ({
        purchasePrice: 300_000,
        downPaymentAmount: 60_000,
        downPaymentPercentage: 20,
        interestRate: 5,
        loanTerm: 30,
        typeEnum: MCalculatorTypeEnum.ADVANCED,
        loanStartDate: '2024-01-01' as any,
        annualPropertyTaxes: 3_000,
        annualHomeInsurance: 1_200,
        additionalMonthlyPayment: 100,
        creditScore: CreditScoreEnum.EXCELLENT,
        ...overrides,
    }) as CreateMCalculatorDto;

const makeBasicDto = (overrides: Partial<CreateMCalculatorDto> = {}): CreateMCalculatorDto =>
    ({
        purchasePrice: 300_000,
        downPaymentAmount: 60_000,
        downPaymentPercentage: 20,
        interestRate: 5,
        loanTerm: 30,
        typeEnum: MCalculatorTypeEnum.BASIC,
        ...overrides,
    }) as CreateMCalculatorDto;

const buildMCalculatorServiceMock = () => ({
    logger: { info: jest.fn() },
    errorHandler: {
        validation: jest.fn((errors) => new Error(JSON.stringify(errors))),
        notFound: jest.fn((msg) => {
            throw new Error(msg);
        }),
    },
    otherUtils: {
        formatCriteria: jest.fn((c) => JSON.stringify(c)),
    },
    mCalculatorRepo: {
        findOne: jest.fn(),
        findActiveOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
    mCalculatorEquationsService: {
        calculateDownPaymentPercentage: jest.fn((price, amount) => (amount / price) * 100),
        calculateLoanAmount: jest.fn((price, amount) => price - amount),
    },
    determineDownPaymentAmount: jest.fn(
        (dto: CreateMCalculatorDto) => dto.downPaymentAmount ?? 60_000,
    ),
});

describe('PreMCalculatorService', () => {
    let service: PreMCalculatorService;
    let mCalculatorService: ReturnType<typeof buildMCalculatorServiceMock>;

    beforeEach(async () => {
        mCalculatorService = buildMCalculatorServiceMock();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PreMCalculatorService,
                {
                    provide: MCalculatorService,
                    useValue: mCalculatorService,
                },
            ],
        }).compile();

        service = module.get<PreMCalculatorService>(PreMCalculatorService);
    });

    afterEach(() => jest.clearAllMocks());

    describe('mapEntityToDto', () => {
        it('maps all fields from entity to DTO', () => {
            const entity = makeCalculatorEntity({
                typeEnum: MCalculatorTypeEnum.ADVANCED,
                loanStartDate: new Date('2024-01-01'),
                annualPropertyTaxes: 3_000,
                annualHomeInsurance: 1_200,
                additionalMonthlyPayment: 100,
                creditScore: CreditScoreEnum.EXCELLENT,
            });

            const dto = service.mapEntityToDto(entity);

            expect(dto.purchasePrice).toBe(entity.purchasePrice);
            expect(dto.downPaymentAmount).toBe(entity.downPaymentAmount);
            expect(dto.downPaymentPercentage).toBe(entity.downPaymentPercentage);
            expect(dto.interestRate).toBe(entity.interestRate);
            expect(dto.loanTerm).toBe(entity.loanTerm);
            expect(dto.typeEnum).toBe(entity.typeEnum);
            expect(dto.loanStartDate).toBe(entity.loanStartDate);
            expect(dto.annualPropertyTaxes).toBe(entity.annualPropertyTaxes);
            expect(dto.annualHomeInsurance).toBe(entity.annualHomeInsurance);
            expect(dto.additionalMonthlyPayment).toBe(entity.additionalMonthlyPayment);
            expect(dto.creditScore).toBe(entity.creditScore);
        });

        it('maps entity with undefined optional fields', () => {
            const entity = makeCalculatorEntity();
            const dto = service.mapEntityToDto(entity);

            expect(dto.loanStartDate).toBeUndefined();
            expect(dto.annualPropertyTaxes).toBeUndefined();
            expect(dto.annualHomeInsurance).toBeUndefined();
            expect(dto.additionalMonthlyPayment).toBeUndefined();
            expect(dto.creditScore).toBeUndefined();
        });
    });

    describe('normalizeExtraPaymentToMonthly', () => {
        it('returns amount unchanged for MONTHLY frequency', () => {
            expect(
                service.normalizeExtraPaymentToMonthly(120, ExtraPaymentFrequencyEnum.MONTHLY),
            ).toBe(120);
        });

        it('divides by 12 for YEARLY frequency', () => {
            expect(
                service.normalizeExtraPaymentToMonthly(1_200, ExtraPaymentFrequencyEnum.YEARLY),
            ).toBe(100);
        });

        it('converts WEEKLY to monthly (amount * 52 / 12)', () => {
            const result = service.normalizeExtraPaymentToMonthly(
                100,
                ExtraPaymentFrequencyEnum.WEEKLY,
            );
            expect(result).toBeCloseTo((100 * 52) / 12, 5);
        });

        it('returns amount unchanged when frequency is undefined (default case)', () => {
            expect(service.normalizeExtraPaymentToMonthly(200, undefined)).toBe(200);
        });

        it('handles zero amount', () => {
            expect(
                service.normalizeExtraPaymentToMonthly(0, ExtraPaymentFrequencyEnum.YEARLY),
            ).toBe(0);
        });
    });

    describe('assertCalculatorModeConstraints', () => {
        it('does not throw for valid BASIC mode (no advanced fields)', () => {
            expect(() => service.assertCalculatorModeConstraints(makeBasicDto())).not.toThrow();
        });

        it('throws when BASIC mode has forbidden advanced fields', () => {
            const dto = makeBasicDto({ loanStartDate: '2024-01-01' as any });
            expect(() => service.assertCalculatorModeConstraints(dto)).toThrow();
            expect(mCalculatorService.errorHandler.validation).toHaveBeenCalledTimes(1);
        });

        it('throws when BASIC mode has any of the advanced fields', () => {
            const forbiddenCombinations: Partial<CreateMCalculatorDto>[] = [
                { annualPropertyTaxes: 3_000 },
                { annualHomeInsurance: 1_200 },
                { additionalMonthlyPayment: 100 },
                { creditScore: CreditScoreEnum.EXCELLENT },
            ];

            forbiddenCombinations.forEach((extra) => {
                jest.clearAllMocks();
                expect(() =>
                    service.assertCalculatorModeConstraints(makeBasicDto(extra)),
                ).toThrow();
                expect(mCalculatorService.errorHandler.validation).toHaveBeenCalledTimes(1);
            });
        });

        it('does not throw for valid ADVANCED mode (all advanced fields present)', () => {
            expect(() => service.assertCalculatorModeConstraints(makeAdvancedDto())).not.toThrow();
        });

        it('throws when ADVANCED mode is missing required advanced fields', () => {
            const dto = makeAdvancedDto({ loanStartDate: undefined });
            expect(() => service.assertCalculatorModeConstraints(dto)).toThrow();
            expect(mCalculatorService.errorHandler.validation).toHaveBeenCalledTimes(1);
        });

        it('does not call validation when there are no errors', () => {
            service.assertCalculatorModeConstraints(makeBasicDto());
            expect(mCalculatorService.errorHandler.validation).not.toHaveBeenCalled();
        });
    });

    describe('retrieveMCalculatorByCriteria', () => {
        it('returns entity when found', async () => {
            const entity = makeCalculatorEntity();
            mCalculatorService.mCalculatorRepo.findActiveOne.mockResolvedValue(entity);

            const result = await service.retrieveMCalculatorByCriteria({ id: 'calc-1' });

            expect(result).toBe(entity);
            expect(mCalculatorService.logger.info).toHaveBeenCalledTimes(1);
        });

        it('calls findActiveOne with criteria and relations', async () => {
            const entity = makeCalculatorEntity();
            mCalculatorService.mCalculatorRepo.findActiveOne.mockResolvedValue(entity);
            const criteria = { id: 'calc-1' };
            const relations = ['createdBy'];

            await service.retrieveMCalculatorByCriteria(criteria, relations);

            expect(mCalculatorService.mCalculatorRepo.findActiveOne).toHaveBeenCalledWith(
                mCalculatorService.mCalculatorRepo,
                criteria,
                relations,
            );
        });

        it('throws notFound when entity is not found', async () => {
            mCalculatorService.mCalculatorRepo.findActiveOne.mockResolvedValue(null);

            await expect(
                service.retrieveMCalculatorByCriteria({ id: 'missing' }),
            ).rejects.toThrow();

            expect(mCalculatorService.errorHandler.notFound).toHaveBeenCalledTimes(1);
        });

        it('calls formatCriteria with the provided criteria object', async () => {
            const entity = makeCalculatorEntity();
            mCalculatorService.mCalculatorRepo.findActiveOne.mockResolvedValue(entity);
            const criteria = { id: 'calc-1', typeEnum: MCalculatorTypeEnum.BASIC };

            await service.retrieveMCalculatorByCriteria(criteria);

            expect(mCalculatorService.otherUtils.formatCriteria).toHaveBeenCalledWith(criteria);
        });
    });

    describe('buildMCalculatorEntity', () => {
        const required = {
            createdBy: makeUser(),
            purchasePrice: 300_000,
            downPaymentAmount: 60_000,
            downPaymentPercentage: 20,
            loanAmount: 240_000,
            interestRate: 5,
            loanTerm: 30,
            typeEnum: MCalculatorTypeEnum.BASIC,
        };

        it('returns a MCalculatorEntity instance', () => {
            const entity = service.buildMCalculatorEntity(required, {});
            expect(entity).toBeInstanceOf(MCalculatorEntity);
        });

        it('merges required and optional fields onto entity', () => {
            const optional = {
                loanStartDate: new Date('2024-01-01'),
                annualPropertyTaxes: 3_000,
                annualHomeInsurance: 1_200,
                additionalMonthlyPayment: 100,
                creditScore: CreditScoreEnum.EXCELLENT,
            };

            const entity = service.buildMCalculatorEntity(required, optional);

            expect(entity.purchasePrice).toBe(required.purchasePrice);
            expect(entity.loanAmount).toBe(required.loanAmount);
            expect(entity.loanStartDate).toEqual(optional.loanStartDate);
            expect(entity.annualPropertyTaxes).toBe(optional.annualPropertyTaxes);
            expect(entity.creditScore).toBe(optional.creditScore);
        });

        it('builds entity with empty optional fields', () => {
            const entity = service.buildMCalculatorEntity(required, {});
            expect(entity.loanStartDate).toBeUndefined();
            expect(entity.creditScore).toBeUndefined();
        });
    });

    describe('createMCalculator', () => {
        it('returns existing calculator when one already exists for the user', async () => {
            const existing = makeCalculatorEntity();
            mCalculatorService.mCalculatorRepo.findOne.mockResolvedValue(existing);

            const result = await service.createMCalculator(makeUser(), makeBasicDto());

            expect(result).toBe(existing);
            expect(mCalculatorService.mCalculatorRepo.create).not.toHaveBeenCalled();
        });

        it('creates and returns a new calculator when none exists', async () => {
            mCalculatorService.mCalculatorRepo.findOne.mockResolvedValue(null);
            const created = makeCalculatorEntity();
            mCalculatorService.mCalculatorRepo.create.mockResolvedValue(created);

            const result = await service.createMCalculator(makeUser(), makeBasicDto());

            expect(mCalculatorService.mCalculatorRepo.create).toHaveBeenCalledTimes(1);
            expect(result).toBe(created);
        });

        it('calls determineDownPaymentAmount with dto', async () => {
            mCalculatorService.mCalculatorRepo.findOne.mockResolvedValue(null);
            mCalculatorService.mCalculatorRepo.create.mockResolvedValue(makeCalculatorEntity());
            const dto = makeBasicDto();

            await service.createMCalculator(makeUser(), dto);

            expect(mCalculatorService.determineDownPaymentAmount).toHaveBeenCalledWith(dto);
        });

        it('converts loanStartDate string to Date when present', async () => {
            mCalculatorService.mCalculatorRepo.findOne.mockResolvedValue(null);
            mCalculatorService.mCalculatorRepo.create.mockResolvedValue(makeCalculatorEntity());
            const dto = makeAdvancedDto({ loanStartDate: '2024-06-15' as any });

            await service.createMCalculator(makeUser(), dto);

            const entityArg = mCalculatorService.mCalculatorRepo.create.mock.calls[0][0];
            expect(entityArg.loanStartDate).toBeInstanceOf(Date);
        });

        it('leaves loanStartDate undefined when not provided', async () => {
            mCalculatorService.mCalculatorRepo.findOne.mockResolvedValue(null);
            mCalculatorService.mCalculatorRepo.create.mockResolvedValue(makeCalculatorEntity());

            await service.createMCalculator(makeUser(), makeBasicDto());

            const entityArg = mCalculatorService.mCalculatorRepo.create.mock.calls[0][0];
            expect(entityArg.loanStartDate).toBeUndefined();
        });

        it('calls calculateDownPaymentPercentage and calculateLoanAmount', async () => {
            mCalculatorService.mCalculatorRepo.findOne.mockResolvedValue(null);
            mCalculatorService.mCalculatorRepo.create.mockResolvedValue(makeCalculatorEntity());

            await service.createMCalculator(makeUser(), makeBasicDto());

            expect(
                mCalculatorService.mCalculatorEquationsService.calculateDownPaymentPercentage,
            ).toHaveBeenCalledTimes(1);
            expect(
                mCalculatorService.mCalculatorEquationsService.calculateLoanAmount,
            ).toHaveBeenCalledTimes(1);
        });

        it('throws if assertCalculatorModeConstraints fails', async () => {
            mCalculatorService.mCalculatorRepo.findOne.mockResolvedValue(null);
            // Pass BASIC dto with a forbidden advanced field
            const dto = makeBasicDto({ loanStartDate: '2024-01-01' as any });

            // errorHandler.validation returns an Error — assertCalculatorModeConstraints throws it
            mCalculatorService.errorHandler.validation.mockImplementation((e) => {
                const err = new Error('Validation failed');
                (err as any).errors = e;
                return err;
            });

            // assertCalculatorModeConstraints calls throw errorHandler.validation(...)
            // Patch it to actually throw:
            jest.spyOn(service, 'assertCalculatorModeConstraints').mockImplementation(() => {
                throw new Error('Validation failed');
            });

            await expect(service.createMCalculator(makeUser(), dto)).rejects.toThrow(
                'Validation failed',
            );
            expect(mCalculatorService.mCalculatorRepo.create).not.toHaveBeenCalled();
        });
    });

    describe('updateMCalculator', () => {
        it('returns message when itemized is undefined', async () => {
            const result = await service.updateMCalculator(makeCalculatorEntity(), undefined);
            expect(result).toEqual({ message: 'No updates provided for calculator update' });
        });

        it('returns message when itemized is empty object', async () => {
            const result = await service.updateMCalculator(makeCalculatorEntity(), {});
            expect(result).toEqual({ message: 'No updates provided for calculator update' });
        });

        it('calls repo.update with the correct id and payload', async () => {
            const calc = makeCalculatorEntity();
            mCalculatorService.mCalculatorRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateMCalculator(calc, { purchasePrice: 400_000 });

            expect(mCalculatorService.mCalculatorRepo.update).toHaveBeenCalledWith(
                { id: calc.id },
                { purchasePrice: 400_000 },
            );
        });

        it('only includes defined fields in update payload', async () => {
            const calc = makeCalculatorEntity();
            mCalculatorService.mCalculatorRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateMCalculator(calc, {
                purchasePrice: 400_000,
                loanStartDate: undefined,
            });

            const updateArg = mCalculatorService.mCalculatorRepo.update.mock.calls[0][1];
            expect(updateArg).toHaveProperty('purchasePrice', 400_000);
            expect(updateArg).not.toHaveProperty('loanStartDate');
        });

        it('handles all supported fields correctly', async () => {
            const calc = makeCalculatorEntity();
            mCalculatorService.mCalculatorRepo.update.mockResolvedValue({ affected: 1 });
            const date = new Date('2024-01-01');

            await service.updateMCalculator(calc, {
                purchasePrice: 400_000,
                downPaymentAmount: 80_000,
                downPaymentPercentage: 20,
                loanAmount: 320_000,
                interestRate: 4.5,
                loanTerm: 15,
                loanStartDate: date,
                annualPropertyTaxes: 5_000,
                annualHomeInsurance: 1_500,
                additionalMonthlyPayment: 200,
                typeEnum: MCalculatorTypeEnum.ADVANCED,
            });

            const payload = mCalculatorService.mCalculatorRepo.update.mock.calls[0][1];
            expect(payload).toMatchObject({
                purchasePrice: 400_000,
                downPaymentAmount: 80_000,
                loanStartDate: date,
            });
        });
    });

    describe('updateMCalculatorWithRecalculation', () => {
        it('returns message when updateDto is undefined', async () => {
            const result = await service.updateMCalculatorWithRecalculation(
                makeCalculatorEntity(),
                undefined as any,
            );
            expect(result).toEqual({ message: 'No updates provided for calculator update' });
        });

        it('returns message when updateDto is empty object', async () => {
            const result = await service.updateMCalculatorWithRecalculation(
                makeCalculatorEntity(),
                {},
            );
            expect(result).toEqual({ message: 'No updates provided for calculator update' });
        });

        it('calls assertCalculatorModeConstraints when typeEnum is provided', async () => {
            const spy = jest
                .spyOn(service, 'assertCalculatorModeConstraints')
                .mockImplementation(() => undefined);

            mCalculatorService.mCalculatorRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateMCalculatorWithRecalculation(makeCalculatorEntity(), {
                typeEnum: MCalculatorTypeEnum.BASIC,
            });

            expect(spy).toHaveBeenCalledTimes(1);
        });

        it('does NOT call assertCalculatorModeConstraints when typeEnum is absent', async () => {
            const spy = jest
                .spyOn(service, 'assertCalculatorModeConstraints')
                .mockImplementation(() => undefined);

            mCalculatorService.mCalculatorRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateMCalculatorWithRecalculation(makeCalculatorEntity(), {
                interestRate: 4.5,
            });

            expect(spy).not.toHaveBeenCalled();
        });

        it('recalculates derived fields when purchasePrice changes', async () => {
            mCalculatorService.mCalculatorRepo.update.mockResolvedValue({ affected: 1 });
            const calc = makeCalculatorEntity();

            await service.updateMCalculatorWithRecalculation(calc, { purchasePrice: 400_000 });

            expect(mCalculatorService.determineDownPaymentAmount).toHaveBeenCalledTimes(1);
            expect(
                mCalculatorService.mCalculatorEquationsService.calculateDownPaymentPercentage,
            ).toHaveBeenCalledTimes(1);
            expect(
                mCalculatorService.mCalculatorEquationsService.calculateLoanAmount,
            ).toHaveBeenCalledTimes(1);
        });

        it('recalculates derived fields when downPaymentAmount changes', async () => {
            mCalculatorService.mCalculatorRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateMCalculatorWithRecalculation(makeCalculatorEntity(), {
                downPaymentAmount: 80_000,
            });

            expect(mCalculatorService.determineDownPaymentAmount).toHaveBeenCalledTimes(1);
        });

        it('recalculates derived fields when downPaymentPercentage changes', async () => {
            mCalculatorService.mCalculatorRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateMCalculatorWithRecalculation(makeCalculatorEntity(), {
                downPaymentPercentage: 25,
            });

            expect(mCalculatorService.determineDownPaymentAmount).toHaveBeenCalledTimes(1);
        });

        it('does NOT recalculate when no price/payment field changes', async () => {
            mCalculatorService.mCalculatorRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateMCalculatorWithRecalculation(makeCalculatorEntity(), {
                interestRate: 3.5,
            });

            expect(mCalculatorService.determineDownPaymentAmount).not.toHaveBeenCalled();
            expect(
                mCalculatorService.mCalculatorEquationsService.calculateDownPaymentPercentage,
            ).not.toHaveBeenCalled();
        });

        it('preserves existing derived values when no recalculation is needed', async () => {
            const calc = makeCalculatorEntity({
                downPaymentAmount: 60_000,
                downPaymentPercentage: 20,
                loanAmount: 240_000,
            });
            mCalculatorService.mCalculatorRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateMCalculatorWithRecalculation(calc, { interestRate: 4 });

            const updatePayload = mCalculatorService.mCalculatorRepo.update.mock.calls[0][1];
            expect(updatePayload.downPaymentAmount).toBe(60_000);
            expect(updatePayload.downPaymentPercentage).toBe(20);
            expect(updatePayload.loanAmount).toBe(240_000);
        });

        it('converts loanStartDate string to Date in update payload', async () => {
            mCalculatorService.mCalculatorRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateMCalculatorWithRecalculation(makeCalculatorEntity(), {
                loanStartDate: '2025-03-01' as any,
            });

            const updatePayload = mCalculatorService.mCalculatorRepo.update.mock.calls[0][1];
            expect(updatePayload.loanStartDate).toBeInstanceOf(Date);
        });

        it('falls back to existing loanStartDate when updateDto has no loanStartDate', async () => {
            const existingDate = new Date('2023-01-01');
            const calc = makeCalculatorEntity({ loanStartDate: existingDate });
            mCalculatorService.mCalculatorRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateMCalculatorWithRecalculation(calc, { interestRate: 3 });

            const updatePayload = mCalculatorService.mCalculatorRepo.update.mock.calls[0][1];
            expect(updatePayload.loanStartDate).toBe(existingDate);
        });

        it('returns the result of updateMCalculator', async () => {
            const updatedCalc = makeCalculatorEntity({ interestRate: 4 });
            mCalculatorService.mCalculatorRepo.update.mockResolvedValue(updatedCalc);

            const result = await service.updateMCalculatorWithRecalculation(
                makeCalculatorEntity(),
                { interestRate: 4 },
            );

            expect(result).toBe(updatedCalc);
        });
    });
});
