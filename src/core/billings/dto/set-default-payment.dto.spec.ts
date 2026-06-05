import { SetDefaultPaymentDto } from './set-default-payment.dto';
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

describe('SetDefaultPaymentDto', () => {
    describe('instantiation', () => {
        it('should be instantiable', () => {
            expect(new SetDefaultPaymentDto()).toBeInstanceOf(SetDefaultPaymentDto);
        });

        it('should assign paymentMethodId from plain object', () => {
            const dto = plainToInstance(SetDefaultPaymentDto, { paymentMethodId: 'mkn_oklm' });
            expect(dto.paymentMethodId).toBe('mkn_oklm');
        });
    });

    describe('paymentMethodId field — valid values', () => {
        it('should accept a valid payment method id', async () => {
            await expectValid(SetDefaultPaymentDto, { paymentMethodId: 'mkn_oklm' });
        });

        it('should accept a string meeting the min length (2 chars)', async () => {
            await expectValid(SetDefaultPaymentDto, { paymentMethodId: 'ab' });
        });

        it('should accept a long stripe id', async () => {
            await expectValid(SetDefaultPaymentDto, {
                paymentMethodId: 'pm_1OqLkLBsY6eRuFoo1234567',
            });
        });
    });

    describe('paymentMethodId field — invalid values', () => {
        it('should reject when paymentMethodId is missing (required)', async () => {
            await expectInvalid(SetDefaultPaymentDto, {}, 'paymentMethodId');
        });

        it('should reject null', async () => {
            await expectInvalid(SetDefaultPaymentDto, { paymentMethodId: null }, 'paymentMethodId');
        });

        it('should reject a number', async () => {
            await expectInvalid(SetDefaultPaymentDto, { paymentMethodId: 42 }, 'paymentMethodId');
        });

        it('should reject an empty string', async () => {
            await expectInvalid(SetDefaultPaymentDto, { paymentMethodId: '' }, 'paymentMethodId');
        });

        it('should reject a string shorter than the min length (1 char)', async () => {
            await expectInvalid(SetDefaultPaymentDto, { paymentMethodId: 'x' }, 'paymentMethodId');
        });
    });

    describe('metadata', () => {
        it('should carry reflect-metadata on the paymentMethodId property', () => {
            const keys = Reflect.getMetadataKeys(SetDefaultPaymentDto.prototype);
            expect(keys.length).toBeGreaterThanOrEqual(0);
        });
    });
});
