import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CCodeUpdateDto } from './c-code-update.dto';
import { CouponTypeEnum, SubscriptionPeriodEnum } from '../../../common/enum';

describe('CCodeUpdateDto', () => {
    describe('Valid DTOs', () => {
        it('should validate an empty DTO (all fields optional)', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {});

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate DTO with only couponType', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate DTO with only subscriptionPeriod', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate DTO with only code', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                code: 'ABC12345',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate DTO with only startDate', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                startDate: '2026-12-01T00:00:00.000Z',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate DTO with only endDate', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                endDate: '2026-12-31T00:00:00.000Z',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate DTO with only label', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                label: 'Test Label',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate DTO with only discountValue', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                discountValue: 50,
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate DTO with only freeTrialDays', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                freeTrialDays: 30,
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate DTO with multiple fields', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                code: 'XYZ98765',
                discountValue: 25,
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate a complete DTO with all fields', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'ABC12345',
                startDate: '2026-12-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                label: 'Updated Coupon',
                discountValue: 75,
                freeTrialDays: 60,
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate DTO with code containing only letters', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                code: 'ABCDEFGH',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate DTO with code containing only numbers', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                code: '12345678',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate DTO with code containing mixed case', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                code: 'aB12cD34',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate DTO with discountValue of 0', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                discountValue: 0,
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate DTO with freeTrialDays of 0', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                freeTrialDays: 0,
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate DTO with label of exactly 2 characters', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                label: 'AB',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('Invalid couponType', () => {
        it('should fail when couponType is invalid', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                couponType: 'INVALID_TYPE' as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const couponTypeError = errors.find((e) => e.property === 'couponType');
            expect(couponTypeError).toBeDefined();
        });

        it('should fail when couponType is a number', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                couponType: 123 as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const couponTypeError = errors.find((e) => e.property === 'couponType');
            expect(couponTypeError).toBeDefined();
        });
    });

    describe('Invalid subscriptionPeriod', () => {
        it('should fail when subscriptionPeriod is invalid', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                subscriptionPeriod: 'INVALID_PERIOD' as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const subscriptionPeriodError = errors.find((e) => e.property === 'subscriptionPeriod');
            expect(subscriptionPeriodError).toBeDefined();
        });

        it('should fail when subscriptionPeriod is a number', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                subscriptionPeriod: 456 as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const subscriptionPeriodError = errors.find((e) => e.property === 'subscriptionPeriod');
            expect(subscriptionPeriodError).toBeDefined();
        });
    });

    describe('Invalid code', () => {
        it('should fail when code is less than 8 characters', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                code: 'ABC123',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const codeError = errors.find((e) => e.property === 'code');
            expect(codeError).toBeDefined();
        });

        it('should fail when code is more than 8 characters', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                code: 'ABC123456',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const codeError = errors.find((e) => e.property === 'code');
            expect(codeError).toBeDefined();
        });

        it('should fail when code contains special characters', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                code: 'ABC@1234',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const codeError = errors.find((e) => e.property === 'code');
            expect(codeError?.constraints).toHaveProperty('matches');
        });

        it('should fail when code contains spaces', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                code: 'ABC 1234',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const codeError = errors.find((e) => e.property === 'code');
            expect(codeError?.constraints).toHaveProperty('matches');
        });

        it('should fail when code contains underscore', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                code: 'ABC_1234',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const codeError = errors.find((e) => e.property === 'code');
            expect(codeError?.constraints).toHaveProperty('matches');
        });

        it('should fail when code is not a string', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                code: 12345678 as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const codeError = errors.find((e) => e.property === 'code');
            expect(codeError).toBeDefined();
        });

        it('should fail when code is empty string', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                code: '',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const codeError = errors.find((e) => e.property === 'code');
            expect(codeError).toBeDefined();
        });
    });

    describe('Invalid startDate', () => {
        it('should fail when startDate is not ISO 8601 format', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                startDate: '2026/12/01' as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const startDateError = errors.find((e) => e.property === 'startDate');
            expect(startDateError).toBeDefined();
        });

        it('should fail when startDate is invalid date string', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                startDate: 'not-a-date' as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const startDateError = errors.find((e) => e.property === 'startDate');
            expect(startDateError).toBeDefined();
        });

        it('should fail when startDate is a number', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                startDate: 1234567890 as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const startDateError = errors.find((e) => e.property === 'startDate');
            expect(startDateError).toBeDefined();
        });
    });

    describe('Invalid endDate', () => {
        it('should fail when endDate is not ISO 8601 format', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                endDate: '2026/12/31' as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const endDateError = errors.find((e) => e.property === 'endDate');
            expect(endDateError).toBeDefined();
        });

        it('should fail when endDate is invalid date string', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                endDate: 'invalid-date' as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const endDateError = errors.find((e) => e.property === 'endDate');
            expect(endDateError).toBeDefined();
        });

        it('should fail when endDate is a number', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                endDate: 9876543210 as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const endDateError = errors.find((e) => e.property === 'endDate');
            expect(endDateError).toBeDefined();
        });
    });

    describe('Invalid label', () => {
        it('should fail when label is less than 2 characters', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                label: 'A',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const labelError = errors.find((e) => e.property === 'label');
            expect(labelError).toBeDefined();
        });

        it('should fail when label is not a string', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                label: 12345 as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const labelError = errors.find((e) => e.property === 'label');
            expect(labelError).toBeDefined();
        });

        it('should fail when label is empty string', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                label: '',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const labelError = errors.find((e) => e.property === 'label');
            expect(labelError).toBeDefined();
        });

        it('should fail when label is an object', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                label: { name: 'test' } as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const labelError = errors.find((e) => e.property === 'label');
            expect(labelError).toBeDefined();
        });
    });

    describe('Invalid discountValue', () => {
        it('should fail when discountValue is negative', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                discountValue: -10,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const discountValueError = errors.find((e) => e.property === 'discountValue');
            expect(discountValueError).toBeDefined();
        });

        it('should fail when discountValue is not a number', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                discountValue: 'not-a-number' as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const discountValueError = errors.find((e) => e.property === 'discountValue');
            expect(discountValueError).toBeDefined();
        });

        it('should fail when discountValue is NaN', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                discountValue: NaN,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const discountValueError = errors.find((e) => e.property === 'discountValue');
            expect(discountValueError).toBeDefined();
        });

        it('should fail when discountValue is Infinity', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                discountValue: Infinity,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const discountValueError = errors.find((e) => e.property === 'discountValue');
            expect(discountValueError).toBeDefined();
        });

        it('should fail when discountValue is an object', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                discountValue: { value: 50 } as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const discountValueError = errors.find((e) => e.property === 'discountValue');
            expect(discountValueError).toBeDefined();
        });
    });

    describe('Invalid freeTrialDays', () => {
        it('should fail when freeTrialDays is negative', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                freeTrialDays: -5,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const freeTrialDaysError = errors.find((e) => e.property === 'freeTrialDays');
            expect(freeTrialDaysError).toBeDefined();
        });

        it('should fail when freeTrialDays is not a number', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                freeTrialDays: 'not-a-number' as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const freeTrialDaysError = errors.find((e) => e.property === 'freeTrialDays');
            expect(freeTrialDaysError).toBeDefined();
        });

        it('should fail when freeTrialDays is NaN', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                freeTrialDays: NaN,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const freeTrialDaysError = errors.find((e) => e.property === 'freeTrialDays');
            expect(freeTrialDaysError).toBeDefined();
        });

        it('should fail when freeTrialDays is Infinity', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                freeTrialDays: Infinity,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const freeTrialDaysError = errors.find((e) => e.property === 'freeTrialDays');
            expect(freeTrialDaysError).toBeDefined();
        });

        it('should fail when freeTrialDays is an array', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                freeTrialDays: [30] as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const freeTrialDaysError = errors.find((e) => e.property === 'freeTrialDays');
            expect(freeTrialDaysError).toBeDefined();
        });
    });

    describe('Partial updates combinations', () => {
        it('should validate partial update with dates only', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate partial update with pricing fields only', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                discountValue: 50,
                freeTrialDays: 15,
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate partial update with enums only', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should fail with multiple invalid fields', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                couponType: 'INVALID' as any,
                code: 'ABC',
                discountValue: -10,
                label: 'X',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(1);
        });
    });

    describe('Edge cases', () => {
        it('should validate DTO with undefined values', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                couponType: undefined,
                subscriptionPeriod: undefined,
                code: undefined,
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate DTO with null prototype', async () => {
            const data = Object.create(null);
            data.code = 'ABC12345';
            const dto = plainToInstance(CCodeUpdateDto, data);

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should maintain validation inheritance from CCodeCreateDto', async () => {
            const dto = plainToInstance(CCodeUpdateDto, {
                code: 'AB-12345', // Invalid due to special character
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const codeError = errors.find((e) => e.property === 'code');
            expect(codeError?.constraints).toHaveProperty('matches');
        });
    });
});
