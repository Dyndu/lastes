import { ChangePeriodDto } from './change-period.dto';
import { plainToInstance } from 'class-transformer';
import { SubscriptionPeriodEnum } from '../../../common/enum';
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

describe('ChangePeriodDto', () => {
    describe('instantiation', () => {
        it('should be instantiable', () => {
            expect(new ChangePeriodDto()).toBeInstanceOf(ChangePeriodDto);
        });

        it('should assign period from plain object', () => {
            const dto = plainToInstance(ChangePeriodDto, {
                period: SubscriptionPeriodEnum.MONTHLY,
            });
            expect(dto.period).toBe(SubscriptionPeriodEnum.MONTHLY);
        });
    });

    describe('period field — valid values', () => {
        it('should accept MONTHLY', async () => {
            await expectValid(ChangePeriodDto, { period: SubscriptionPeriodEnum.MONTHLY });
        });

        it('should accept YEARLY', async () => {
            await expectValid(ChangePeriodDto, { period: SubscriptionPeriodEnum.YEARLY });
        });

        it('should accept raw string "monthly"', async () => {
            await expectValid(ChangePeriodDto, { period: 'monthly' });
        });

        it('should accept raw string "yearly"', async () => {
            await expectValid(ChangePeriodDto, { period: 'yearly' });
        });
    });

    describe('period field — invalid values', () => {
        it('should reject an unknown string value', async () => {
            await expectInvalid(ChangePeriodDto, { period: 'weekly' }, 'period');
        });

        it('should reject a number', async () => {
            await expectInvalid(ChangePeriodDto, { period: 1 }, 'period');
        });

        it('should reject null', async () => {
            await expectInvalid(ChangePeriodDto, { period: null }, 'period');
        });

        it('should reject an empty string', async () => {
            await expectInvalid(ChangePeriodDto, { period: '' }, 'period');
        });

        it('should reject when period is missing (required)', async () => {
            await expectInvalid(ChangePeriodDto, {}, 'period');
        });
    });

    describe('metadata', () => {
        it('should carry reflect-metadata on the period property', () => {
            const meta = Reflect.getMetadata(
                'swagger/apiModelPropertiesArray',
                ChangePeriodDto.prototype,
            );
            expect(meta ?? Reflect.getMetadataKeys(ChangePeriodDto.prototype).length).toBeTruthy();
        });
    });
});
