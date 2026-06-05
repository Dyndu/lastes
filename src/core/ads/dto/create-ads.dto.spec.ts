import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateAdsDto } from './create-ads.dto';
import { AdsFormatEnum, AdsTypeEnum } from '../../../common/enum';

describe('CreateAdsDto', () => {
    describe('Valid DTO', () => {
        it('should validate a complete valid DTO', async () => {
            const dto = plainToInstance(CreateAdsDto, {
                label: '300% BONUS',
                companyName: '1x bet',
                fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                type: AdsTypeEnum.STANDARD,
                format: AdsFormatEnum.HORIZONTAL,
                startDate: '2026-12-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                amount: 100,
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should accept minimum valid string lengths', async () => {
            const dto = plainToInstance(CreateAdsDto, {
                label: 'ABC',
                companyName: 'XYZ',
                fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                type: AdsTypeEnum.STANDARD,
                format: AdsFormatEnum.HORIZONTAL,
                startDate: '2026-12-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                amount: 0,
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should accept decimal amounts with max 2 decimal places', async () => {
            const dto = plainToInstance(CreateAdsDto, {
                label: '300% BONUS',
                companyName: '1x bet',
                fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                type: AdsTypeEnum.STANDARD,
                format: AdsFormatEnum.HORIZONTAL,
                startDate: '2026-12-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                amount: 99.99,
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('label field', () => {
        it('should fail when label is missing', async () => {
            const dto = plainToInstance(CreateAdsDto, {
                companyName: '1x bet',
                fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                type: AdsTypeEnum.STANDARD,
                format: AdsFormatEnum.HORIZONTAL,
                startDate: '2026-12-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                amount: 100,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const labelError = errors.find((e) => e.property === 'label');
            expect(labelError?.constraints).toHaveProperty('isNotEmpty');
        });

        it('should fail when label is not a string', async () => {
            const dto = plainToInstance(CreateAdsDto, {
                label: 12345,
                companyName: '1x bet',
                fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                type: AdsTypeEnum.STANDARD,
                format: AdsFormatEnum.HORIZONTAL,
                startDate: '2026-12-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                amount: 100,
            });

            const errors = await validate(dto);
            const labelError = errors.find((e) => e.property === 'label');
            expect(labelError?.constraints).toHaveProperty('isString');
        });

        it('should fail when label is too short', async () => {
            const dto = plainToInstance(CreateAdsDto, {
                label: 'AB',
                companyName: '1x bet',
                fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                type: AdsTypeEnum.STANDARD,
                format: AdsFormatEnum.HORIZONTAL,
                startDate: '2026-12-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                amount: 100,
            });

            const errors = await validate(dto);
            const labelError = errors.find((e) => e.property === 'label');
            expect(labelError?.constraints).toHaveProperty('minLength');
        });
    });

    describe('companyName field', () => {
        it('should fail when companyName is missing', async () => {
            const dto = plainToInstance(CreateAdsDto, {
                label: '300% BONUS',
                fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                type: AdsTypeEnum.STANDARD,
                format: AdsFormatEnum.HORIZONTAL,
                startDate: '2026-12-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                amount: 100,
            });

            const errors = await validate(dto);
            const companyError = errors.find((e) => e.property === 'companyName');
            expect(companyError?.constraints).toHaveProperty('isNotEmpty');
        });

        it('should fail when companyName is too short', async () => {
            const dto = plainToInstance(CreateAdsDto, {
                label: '300% BONUS',
                companyName: 'AB',
                fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                type: AdsTypeEnum.STANDARD,
                format: AdsFormatEnum.HORIZONTAL,
                startDate: '2026-12-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                amount: 100,
            });

            const errors = await validate(dto);
            const companyError = errors.find((e) => e.property === 'companyName');
            expect(companyError?.constraints).toHaveProperty('minLength');
        });
    });

    describe('fileId field', () => {
        it('should fail when fileId is missing', async () => {
            const dto = plainToInstance(CreateAdsDto, {
                label: '300% BONUS',
                companyName: '1x bet',
                type: AdsTypeEnum.STANDARD,
                format: AdsFormatEnum.HORIZONTAL,
                startDate: '2026-12-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                amount: 100,
            });

            const errors = await validate(dto);
            const fileIdError = errors.find((e) => e.property === 'fileId');
            expect(fileIdError?.constraints).toHaveProperty('isNotEmpty');
        });

        it('should fail when fileId is not a valid UUID v4', async () => {
            const dto = plainToInstance(CreateAdsDto, {
                label: '300% BONUS',
                companyName: '1x bet',
                fileId: 'invalid-uuid',
                type: AdsTypeEnum.STANDARD,
                format: AdsFormatEnum.HORIZONTAL,
                startDate: '2026-12-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                amount: 100,
            });

            const errors = await validate(dto);
            const fileIdError = errors.find((e) => e.property === 'fileId');
            expect(fileIdError?.constraints).toHaveProperty('isUuid');
        });

        it('should fail when fileId is too short', async () => {
            const dto = plainToInstance(CreateAdsDto, {
                label: '300% BONUS',
                companyName: '1x bet',
                fileId: 'AB',
                type: AdsTypeEnum.STANDARD,
                format: AdsFormatEnum.HORIZONTAL,
                startDate: '2026-12-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                amount: 100,
            });

            const errors = await validate(dto);
            const fileIdError = errors.find((e) => e.property === 'fileId');
            expect(fileIdError).toBeDefined();
        });
    });

    describe('type field', () => {
        it('should fail when type is missing', async () => {
            const dto = plainToInstance(CreateAdsDto, {
                label: '300% BONUS',
                companyName: '1x bet',
                fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                format: AdsFormatEnum.HORIZONTAL,
                startDate: '2026-12-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                amount: 100,
            });

            const errors = await validate(dto);
            const typeError = errors.find((e) => e.property === 'type');
            expect(typeError?.constraints).toHaveProperty('isNotEmpty');
        });

        it('should fail when type is not a valid enum value', async () => {
            const dto = plainToInstance(CreateAdsDto, {
                label: '300% BONUS',
                companyName: '1x bet',
                fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                type: 'INVALID_TYPE' as any,
                format: AdsFormatEnum.HORIZONTAL,
                startDate: '2026-12-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                amount: 100,
            });

            const errors = await validate(dto);
            const typeError = errors.find((e) => e.property === 'type');
            expect(typeError?.constraints).toHaveProperty('isEnum');
        });
    });

    describe('format field', () => {
        it('should fail when format is missing', async () => {
            const dto = plainToInstance(CreateAdsDto, {
                label: '300% BONUS',
                companyName: '1x bet',
                fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                type: AdsTypeEnum.STANDARD,
                startDate: '2026-12-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                amount: 100,
            });

            const errors = await validate(dto);
            const formatError = errors.find((e) => e.property === 'format');
            expect(formatError?.constraints).toHaveProperty('isNotEmpty');
        });

        it('should fail when format is not a valid enum value', async () => {
            const dto = plainToInstance(CreateAdsDto, {
                label: '300% BONUS',
                companyName: '1x bet',
                fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                type: AdsTypeEnum.STANDARD,
                format: 'INVALID_FORMAT' as any,
                startDate: '2026-12-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                amount: 100,
            });

            const errors = await validate(dto);
            const formatError = errors.find((e) => e.property === 'format');
            expect(formatError?.constraints).toHaveProperty('isEnum');
        });
    });

    describe('startDate field', () => {
        it('should fail when startDate is missing', async () => {
            const dto = plainToInstance(CreateAdsDto, {
                label: '300% BONUS',
                companyName: '1x bet',
                fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                type: AdsTypeEnum.STANDARD,
                format: AdsFormatEnum.HORIZONTAL,
                endDate: '2026-12-31T00:00:00.000Z',
                amount: 100,
            });

            const errors = await validate(dto);
            const startDateError = errors.find((e) => e.property === 'startDate');
            expect(startDateError?.constraints).toHaveProperty('isNotEmpty');
        });

        it('should fail when startDate is not a valid ISO 8601 date', async () => {
            const dto = plainToInstance(CreateAdsDto, {
                label: '300% BONUS',
                companyName: '1x bet',
                fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                type: AdsTypeEnum.STANDARD,
                format: AdsFormatEnum.HORIZONTAL,
                startDate: 'invalid-date' as any,
                endDate: '2026-12-31T00:00:00.000Z',
                amount: 100,
            });

            const errors = await validate(dto);
            const startDateError = errors.find((e) => e.property === 'startDate');
            expect(startDateError?.constraints).toHaveProperty('isIso8601');
        });

        it('should accept valid ISO 8601 date formats', async () => {
            const dto = plainToInstance(CreateAdsDto, {
                label: '300% BONUS',
                companyName: '1x bet',
                fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                type: AdsTypeEnum.STANDARD,
                format: AdsFormatEnum.HORIZONTAL,
                startDate: '2026-12-01T00:00:00Z',
                endDate: '2026-12-31T00:00:00.000Z',
                amount: 100,
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('endDate field', () => {
        it('should fail when endDate is missing', async () => {
            const dto = plainToInstance(CreateAdsDto, {
                label: '300% BONUS',
                companyName: '1x bet',
                fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                type: AdsTypeEnum.STANDARD,
                format: AdsFormatEnum.HORIZONTAL,
                startDate: '2026-12-01T00:00:00.000Z',
                amount: 100,
            });

            const errors = await validate(dto);
            const endDateError = errors.find((e) => e.property === 'endDate');
            expect(endDateError?.constraints).toHaveProperty('isNotEmpty');
        });

        it('should fail when endDate is not a valid ISO 8601 date', async () => {
            const dto = plainToInstance(CreateAdsDto, {
                label: '300% BONUS',
                companyName: '1x bet',
                fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                type: AdsTypeEnum.STANDARD,
                format: AdsFormatEnum.HORIZONTAL,
                startDate: '2026-12-01T00:00:00.000Z',
                endDate: '2026-13-32' as any,
                amount: 100,
            });

            const errors = await validate(dto);
            const endDateError = errors.find((e) => e.property === 'endDate');
            expect(endDateError?.constraints).toHaveProperty('isIso8601');
        });
    });

    describe('amount field', () => {
        it('should fail when amount is missing', async () => {
            const dto = plainToInstance(CreateAdsDto, {
                label: '300% BONUS',
                companyName: '1x bet',
                fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                type: AdsTypeEnum.STANDARD,
                format: AdsFormatEnum.HORIZONTAL,
                startDate: '2026-12-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
            });

            const errors = await validate(dto);
            const amountError = errors.find((e) => e.property === 'amount');
            expect(amountError?.constraints).toHaveProperty('isNotEmpty');
        });

        it('should fail when amount is not a number', async () => {
            const dto = plainToInstance(CreateAdsDto, {
                label: '300% BONUS',
                companyName: '1x bet',
                fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                type: AdsTypeEnum.STANDARD,
                format: AdsFormatEnum.HORIZONTAL,
                startDate: '2026-12-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                amount: 'not-a-number' as any,
            });

            const errors = await validate(dto);
            const amountError = errors.find((e) => e.property === 'amount');
            expect(amountError?.constraints).toHaveProperty('isNumber');
        });

        it('should fail when amount is negative', async () => {
            const dto = plainToInstance(CreateAdsDto, {
                label: '300% BONUS',
                companyName: '1x bet',
                fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                type: AdsTypeEnum.STANDARD,
                format: AdsFormatEnum.HORIZONTAL,
                startDate: '2026-12-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                amount: -50,
            });

            const errors = await validate(dto);
            const amountError = errors.find((e) => e.property === 'amount');
            expect(amountError?.constraints).toHaveProperty('min');
        });

        it('should fail when amount has more than 2 decimal places', async () => {
            const dto = plainToInstance(CreateAdsDto, {
                label: '300% BONUS',
                companyName: '1x bet',
                fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                type: AdsTypeEnum.STANDARD,
                format: AdsFormatEnum.HORIZONTAL,
                startDate: '2026-12-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                amount: 99.999,
            });

            const errors = await validate(dto);
            const amountError = errors.find((e) => e.property === 'amount');
            expect(amountError?.constraints).toHaveProperty('isNumber');
        });

        it('should accept zero as valid amount', async () => {
            const dto = plainToInstance(CreateAdsDto, {
                label: '300% BONUS',
                companyName: '1x bet',
                fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                type: AdsTypeEnum.STANDARD,
                format: AdsFormatEnum.HORIZONTAL,
                startDate: '2026-12-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                amount: 0,
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should fail when amount is NaN', async () => {
            const dto = plainToInstance(CreateAdsDto, {
                label: '300% BONUS',
                companyName: '1x bet',
                fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                type: AdsTypeEnum.STANDARD,
                format: AdsFormatEnum.HORIZONTAL,
                startDate: '2026-12-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                amount: NaN,
            });

            const errors = await validate(dto);
            const amountError = errors.find((e) => e.property === 'amount');
            expect(amountError?.constraints).toHaveProperty('isNumber');
        });

        it('should fail when amount is Infinity', async () => {
            const dto = plainToInstance(CreateAdsDto, {
                label: '300% BONUS',
                companyName: '1x bet',
                fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                type: AdsTypeEnum.STANDARD,
                format: AdsFormatEnum.HORIZONTAL,
                startDate: '2026-12-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
                amount: Infinity,
            });

            const errors = await validate(dto);
            const amountError = errors.find((e) => e.property === 'amount');
            expect(amountError?.constraints).toHaveProperty('isNumber');
        });
    });

    describe('Multiple validation errors', () => {
        it('should return multiple errors when multiple fields are invalid', async () => {
            const dto = plainToInstance(CreateAdsDto, {
                label: 'AB',
                companyName: 'X',
                fileId: 'invalid-uuid',
                status: 'INVALID' as any,
                type: 'INVALID' as any,
                format: 'INVALID' as any,
                startDate: 'not-a-date' as any,
                endDate: 'not-a-date' as any,
                amount: -10,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThanOrEqual(8);
        });

        it('should return all field errors when DTO is empty', async () => {
            const dto = plainToInstance(CreateAdsDto, {});

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThanOrEqual(8);
        });
    });
});
