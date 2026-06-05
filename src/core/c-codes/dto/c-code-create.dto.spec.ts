import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CCodeCreateDto } from './c-code-create.dto';
import { CouponTypeEnum, SubscriptionPeriodEnum } from '../../../common/enum';

describe('CCodeCreateDto', () => {
    describe('Valid DTOs', () => {
        it('should validate a complete valid DTO with all fields', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'ABC12345',
                startDate: '2026-12-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                label: 'Test Coupon',
                discountValue: 25,
                freeTrialDays: 30,
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate a DTO without optional fields', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'XYZ98765',
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate code with only letters', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'ABCDEFGH',
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate code with only numbers', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: '12345678',
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate code with mixed case letters and numbers', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'aB12cD34',
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate with discountValue of 0', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'TEST1234',
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                discountValue: 0,
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate with freeTrialDays of 0', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'TEST1234',
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                freeTrialDays: 0,
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate with label of exactly 2 characters', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'TEST1234',
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                label: 'AB',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('Invalid couponType', () => {
        it('should fail when couponType is missing', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'ABC12345',
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const couponTypeError = errors.find((e) => e.property === 'couponType');
            expect(couponTypeError).toBeDefined();
        });

        it('should fail when couponType is invalid', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: 'INVALID_TYPE' as any,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'ABC12345',
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const couponTypeError = errors.find((e) => e.property === 'couponType');
            expect(couponTypeError).toBeDefined();
        });
    });

    describe('Invalid subscriptionPeriod', () => {
        it('should fail when subscriptionPeriod is missing', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                code: 'ABC12345',
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const subscriptionPeriodError = errors.find((e) => e.property === 'subscriptionPeriod');
            expect(subscriptionPeriodError).toBeDefined();
        });

        it('should fail when subscriptionPeriod is invalid', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: 'INVALID_PERIOD' as any,
                code: 'ABC12345',
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const subscriptionPeriodError = errors.find((e) => e.property === 'subscriptionPeriod');
            expect(subscriptionPeriodError).toBeDefined();
        });
    });

    describe('Invalid code', () => {
        it('should fail when code is missing', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const codeError = errors.find((e) => e.property === 'code');
            expect(codeError).toBeDefined();
        });

        it('should fail when code is less than 8 characters', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'ABC123',
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const codeError = errors.find((e) => e.property === 'code');
            expect(codeError).toBeDefined();
        });

        it('should fail when code is more than 8 characters', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'ABC123456',
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const codeError = errors.find((e) => e.property === 'code');
            expect(codeError).toBeDefined();
        });

        it('should fail when code contains special characters', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'ABC-1234',
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const codeError = errors.find((e) => e.property === 'code');
            expect(codeError?.constraints).toHaveProperty('matches');
        });

        it('should fail when code contains spaces', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'ABC 1234',
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const codeError = errors.find((e) => e.property === 'code');
            expect(codeError?.constraints).toHaveProperty('matches');
        });

        it('should fail when code is not a string', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 12345678 as any,
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const codeError = errors.find((e) => e.property === 'code');
            expect(codeError).toBeDefined();
        });
    });

    describe('Invalid startDate', () => {
        it('should fail when startDate is missing', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'ABC12345',
                endDate: '2026-12-31T00:00:00.000Z',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const startDateError = errors.find((e) => e.property === 'startDate');
            expect(startDateError).toBeDefined();
        });

        it('should fail when startDate is not ISO 8601 format', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'ABC12345',
                startDate: '2026/12/01' as any,
                endDate: '2026-12-31T00:00:00.000Z',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const startDateError = errors.find((e) => e.property === 'startDate');
            expect(startDateError).toBeDefined();
        });

        it('should fail when startDate is invalid date string', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'ABC12345',
                startDate: 'not-a-date' as any,
                endDate: '2026-12-31T00:00:00.000Z',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const startDateError = errors.find((e) => e.property === 'startDate');
            expect(startDateError).toBeDefined();
        });
    });

    describe('Invalid endDate', () => {
        it('should fail when endDate is missing', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'ABC12345',
                startDate: '2026-01-01T00:00:00.000Z',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const endDateError = errors.find((e) => e.property === 'endDate');
            expect(endDateError).toBeDefined();
        });

        it('should fail when endDate is not ISO 8601 format', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'ABC12345',
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026/12/31' as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const endDateError = errors.find((e) => e.property === 'endDate');
            expect(endDateError).toBeDefined();
        });

        it('should fail when endDate is invalid date string', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'ABC12345',
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: 'invalid-date' as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const endDateError = errors.find((e) => e.property === 'endDate');
            expect(endDateError).toBeDefined();
        });
    });

    describe('Invalid label (optional)', () => {
        it('should fail when label is less than 2 characters', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'ABC12345',
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                label: 'A',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const labelError = errors.find((e) => e.property === 'label');
            expect(labelError).toBeDefined();
        });

        it('should fail when label is not a string', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'ABC12345',
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                label: 12345 as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const labelError = errors.find((e) => e.property === 'label');
            expect(labelError).toBeDefined();
        });

        it('should fail when label is empty string', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'ABC12345',
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                label: '',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const labelError = errors.find((e) => e.property === 'label');
            expect(labelError).toBeDefined();
        });
    });

    describe('Invalid discountValue (optional)', () => {
        it('should fail when discountValue is negative', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'ABC12345',
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                discountValue: -10,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const discountValueError = errors.find((e) => e.property === 'discountValue');
            expect(discountValueError).toBeDefined();
        });

        it('should fail when discountValue is not a number', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'ABC12345',
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                discountValue: 'not-a-number' as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const discountValueError = errors.find((e) => e.property === 'discountValue');
            expect(discountValueError).toBeDefined();
        });

        it('should fail when discountValue is NaN', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'ABC12345',
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                discountValue: NaN,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const discountValueError = errors.find((e) => e.property === 'discountValue');
            expect(discountValueError).toBeDefined();
        });

        it('should fail when discountValue is Infinity', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'ABC12345',
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                discountValue: Infinity,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const discountValueError = errors.find((e) => e.property === 'discountValue');
            expect(discountValueError).toBeDefined();
        });
    });

    describe('Invalid freeTrialDays (optional)', () => {
        it('should fail when freeTrialDays is negative', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'ABC12345',
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                freeTrialDays: -5,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const freeTrialDaysError = errors.find((e) => e.property === 'freeTrialDays');
            expect(freeTrialDaysError).toBeDefined();
        });

        it('should fail when freeTrialDays is not a number', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'ABC12345',
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                freeTrialDays: 'not-a-number' as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const freeTrialDaysError = errors.find((e) => e.property === 'freeTrialDays');
            expect(freeTrialDaysError).toBeDefined();
        });

        it('should fail when freeTrialDays is NaN', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'ABC12345',
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                freeTrialDays: NaN,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const freeTrialDaysError = errors.find((e) => e.property === 'freeTrialDays');
            expect(freeTrialDaysError).toBeDefined();
        });

        it('should fail when freeTrialDays is Infinity', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'ABC12345',
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                freeTrialDays: Infinity,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const freeTrialDaysError = errors.find((e) => e.property === 'freeTrialDays');
            expect(freeTrialDaysError).toBeDefined();
        });
    });

    describe('Multiple validation errors', () => {
        it('should return multiple errors when multiple fields are invalid', async () => {
            const dto = plainToInstance(CCodeCreateDto, {
                couponType: 'INVALID' as any,
                subscriptionPeriod: 'INVALID' as any,
                code: 'ABC',
                startDate: 'invalid-date',
                endDate: 'invalid-date',
                label: 'A',
                discountValue: -10,
                freeTrialDays: -5,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(1);
        });
    });
});
