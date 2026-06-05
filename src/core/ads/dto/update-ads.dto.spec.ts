import { validate } from 'class-validator';
import { UpdateAdsDto } from './update-ads.dto';
import { AdsFormatEnum, AdsTypeEnum } from '../../../common/enum';

describe('UpdateAdsDto', () => {
    let dto: UpdateAdsDto;

    beforeEach(() => {
        dto = new UpdateAdsDto();
    });

    describe('Validation', () => {
        it('should pass validation with all valid fields', async () => {
            dto.label = 'Updated Label';
            dto.companyName = 'Updated Company';
            dto.fileId = '759669c6-d2d0-42fa-860c-93cba1838ea6';
            dto.type = AdsTypeEnum.STANDARD;
            dto.format = AdsFormatEnum.HORIZONTAL;
            dto.startDate = '2026-12-01T00:00:00.000Z' as any;
            dto.endDate = '2026-12-31T00:00:00.000Z' as any;
            dto.amount = 150;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with empty dto (all fields optional)', async () => {
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with only label updated', async () => {
            dto.label = 'Only Label Updated';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with only companyName updated', async () => {
            dto.companyName = 'Only Company Updated';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with only dates updated', async () => {
            dto.startDate = '2026-12-01T00:00:00.000Z' as any;
            dto.endDate = '2026-12-31T00:00:00.000Z' as any;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with only amount updated', async () => {
            dto.amount = 200;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('label validation', () => {
        it('should fail if label is too short', async () => {
            dto.label = 'ab';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('label');
        });

        it('should fail if label is empty string', async () => {
            dto.label = '';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('label');
        });

        it('should pass if label is exactly 3 characters', async () => {
            dto.label = 'abc';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('companyName validation', () => {
        it('should fail if companyName is too short', async () => {
            dto.companyName = 'ab';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('companyName');
        });

        it('should fail if companyName is empty string', async () => {
            dto.companyName = '';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('companyName');
        });

        it('should pass if companyName is exactly 3 characters', async () => {
            dto.companyName = 'abc';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('fileId validation', () => {
        it('should fail if fileId is not a valid UUID', async () => {
            dto.fileId = 'invalid-uuid';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('fileId');
        });

        it('should fail if fileId is too short', async () => {
            dto.fileId = 'ab';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('fileId');
        });

        it('should pass if fileId is a valid UUID', async () => {
            dto.fileId = '759669c6-d2d0-42fa-860c-93cba1838ea6';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('type validation', () => {
        it('should fail if type is not a valid enum value', async () => {
            dto.type = 'INVALID_TYPE' as AdsTypeEnum;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('type');
        });

        it('should pass if type is STANDARD', async () => {
            dto.type = AdsTypeEnum.STANDARD;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass if type is EXCLUSIVE', async () => {
            dto.type = AdsTypeEnum.EXCLUSIVE;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('format validation', () => {
        it('should fail if format is not a valid enum value', async () => {
            dto.format = 'INVALID_FORMAT' as AdsFormatEnum;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('format');
        });

        it('should pass if format is HORIZONTAL', async () => {
            dto.format = AdsFormatEnum.HORIZONTAL;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass if format is VERTICAL', async () => {
            dto.format = AdsFormatEnum.VERTICAL;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('amount validation', () => {
        it('should fail if amount is negative', async () => {
            dto.amount = -50;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('amount');
        });

        it('should pass if amount is zero', async () => {
            dto.amount = 0;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass if amount is positive', async () => {
            dto.amount = 100;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('date validation', () => {
        it('should fail if startDate is not a valid date', async () => {
            dto.startDate = 'invalid-date' as any;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('startDate');
        });

        it('should fail if endDate is not a valid date', async () => {
            dto.endDate = 'invalid-date' as any;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('endDate');
        });

        it('should pass if both dates are valid', async () => {
            dto.startDate = '2026-12-01T00:00:00.000Z' as any;
            dto.endDate = '2026-12-31T00:00:00.000Z' as any;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Partial updates', () => {
        it('should allow updating only type and format', async () => {
            dto.type = AdsTypeEnum.EXCLUSIVE;
            dto.format = AdsFormatEnum.VERTICAL;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should allow updating only fileId and amount', async () => {
            dto.fileId = '859669c6-d2d0-42fa-860c-93cba1838ea6';
            dto.amount = 250;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should allow updating label, companyName, and dates together', async () => {
            dto.label = 'New Label';
            dto.companyName = 'New Company';
            dto.startDate = '2027-12-01T00:00:00.000Z' as any;
            dto.endDate = '2027-12-31T00:00:00.000Z' as any;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });
});
