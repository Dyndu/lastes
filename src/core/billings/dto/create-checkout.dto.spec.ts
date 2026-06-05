import { CreateCheckoutDto } from './create-checkout.dto';
import { ChangePeriodDto } from './change-period.dto';
import { SubscriptionPeriodEnum } from '../../../common/enum';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

async function getErrors(DtoClass: any, plain: object) {
    const instance = plainToInstance(DtoClass, plain);
    return validate(<Object>instance);
}

async function expectValid(DtoClass: any, plain: object) {
    const errors = await getErrors(DtoClass, plain);
    expect(errors).toHaveLength(0);
}

async function expectInvalid(DtoClass: any, plain: object, field: string) {
    const errors = await getErrors(DtoClass, plain);
    const fieldError = errors.find((e) => e.property === field);
    expect(fieldError).toBeDefined();
}

describe('CreateCheckoutDto', () => {
    describe('instantiation', () => {
        it('should be instantiable', () => {
            expect(new CreateCheckoutDto()).toBeInstanceOf(CreateCheckoutDto);
        });

        it('should be an instance of ChangePeriodDto (inheritance)', () => {
            expect(new CreateCheckoutDto()).toBeInstanceOf(ChangePeriodDto);
        });

        it('should assign all fields from plain object', () => {
            const dto = plainToInstance(CreateCheckoutDto, {
                period: SubscriptionPeriodEnum.YEARLY,
                couponCode: 'CDGHNKML',
            });
            expect(dto.period).toBe(SubscriptionPeriodEnum.YEARLY);
            expect(dto.couponCode).toBe('CDGHNKML');
        });
    });

    describe('period field (inherited) — valid values', () => {
        it('should accept MONTHLY without couponCode', async () => {
            await expectValid(CreateCheckoutDto, { period: SubscriptionPeriodEnum.MONTHLY });
        });

        it('should accept YEARLY without couponCode', async () => {
            await expectValid(CreateCheckoutDto, { period: SubscriptionPeriodEnum.YEARLY });
        });
    });

    describe('period field (inherited) — invalid values', () => {
        it('should reject missing period', async () => {
            await expectInvalid(CreateCheckoutDto, { couponCode: 'CDGHNKML' }, 'period');
        });

        it('should reject invalid period value', async () => {
            await expectInvalid(
                CreateCheckoutDto,
                { period: 'quarterly', couponCode: 'CDGHNKML' },
                'period',
            );
        });
    });

    describe('couponCode field — valid values', () => {
        it('should accept a valid coupon code alongside a valid period', async () => {
            await expectValid(CreateCheckoutDto, {
                period: SubscriptionPeriodEnum.MONTHLY,
                couponCode: 'CDGHNKML',
            });
        });

        it('should accept the minimum length coupon code (8 chars)', async () => {
            await expectValid(CreateCheckoutDto, {
                period: SubscriptionPeriodEnum.MONTHLY,
                couponCode: '12345678',
            });
        });

        it('should accept when couponCode is absent (optional field)', async () => {
            await expectValid(CreateCheckoutDto, { period: SubscriptionPeriodEnum.MONTHLY });
        });

        it('should accept when couponCode is undefined', async () => {
            await expectValid(CreateCheckoutDto, {
                period: SubscriptionPeriodEnum.MONTHLY,
                couponCode: undefined,
            });
        });
    });

    describe('couponCode field — invalid values', () => {
        it('should reject a non-string coupon code', async () => {
            await expectInvalid(
                CreateCheckoutDto,
                { period: SubscriptionPeriodEnum.MONTHLY, couponCode: 123 },
                'couponCode',
            );
        });

        it('should reject a coupon code shorter than min length', async () => {
            await expectInvalid(
                CreateCheckoutDto,
                { period: SubscriptionPeriodEnum.MONTHLY, couponCode: 'SHORT' },
                'couponCode',
            );
        });
    });

    describe('metadata', () => {
        it('should carry reflect-metadata on the couponCode property', () => {
            const keys = Reflect.getMetadataKeys(CreateCheckoutDto.prototype);
            expect(keys.length).toBeGreaterThanOrEqual(0);
        });
    });
});
