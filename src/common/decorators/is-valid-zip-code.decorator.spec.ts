import { validate } from 'class-validator';
import { IsValidZipCode } from './is-valid-zip-code.decorator';

class TestDto {
    @IsValidZipCode()
    zipCode: any;
}

class TestDtoWithOptions {
    @IsValidZipCode({ message: 'Custom error message' })
    zipCode: any;
}

const validateZip = async (value: any, dto = new TestDto()) => {
    dto.zipCode = value;
    return validate(dto);
};

describe('IsValidZipCode', () => {
    describe('valid ZIP codes', () => {
        it('accepts a standard 5-digit ZIP code', async () => {
            const errors = await validateZip('12345');
            expect(errors).toHaveLength(0);
        });

        it('accepts a 9-digit ZIP+4 code', async () => {
            const errors = await validateZip('12345-6789');
            expect(errors).toHaveLength(0);
        });

        it('accepts ZIP code with all zeros', async () => {
            const errors = await validateZip('00000');
            expect(errors).toHaveLength(0);
        });

        it('accepts ZIP+4 with all zeros', async () => {
            const errors = await validateZip('00000-0000');
            expect(errors).toHaveLength(0);
        });
    });

    describe('invalid ZIP codes', () => {
        it('rejects a 4-digit ZIP code', async () => {
            const errors = await validateZip('1234');
            expect(errors).toHaveLength(1);
        });

        it('rejects a 6-digit ZIP code', async () => {
            const errors = await validateZip('123456');
            expect(errors).toHaveLength(1);
        });

        it('rejects letters', async () => {
            const errors = await validateZip('ABCDE');
            expect(errors).toHaveLength(1);
        });

        it('rejects alphanumeric mix', async () => {
            const errors = await validateZip('1234A');
            expect(errors).toHaveLength(1);
        });

        it('rejects ZIP+4 with only 3 suffix digits', async () => {
            const errors = await validateZip('12345-678');
            expect(errors).toHaveLength(1);
        });

        it('rejects ZIP+4 with 5 suffix digits', async () => {
            const errors = await validateZip('12345-67890');
            expect(errors).toHaveLength(1);
        });

        it('rejects ZIP with a space instead of hyphen', async () => {
            const errors = await validateZip('12345 6789');
            expect(errors).toHaveLength(1);
        });

        it('rejects an empty string', async () => {
            const errors = await validateZip('');
            expect(errors).toHaveLength(1);
        });

        it('rejects a number (non-string)', async () => {
            const errors = await validateZip(12345);
            expect(errors).toHaveLength(1);
        });

        it('rejects null', async () => {
            const errors = await validateZip(null);
            expect(errors).toHaveLength(1);
        });

        it('rejects undefined', async () => {
            const errors = await validateZip(undefined);
            expect(errors).toHaveLength(1);
        });

        it('rejects an object', async () => {
            const errors = await validateZip({ zip: '12345' });
            expect(errors).toHaveLength(1);
        });
    });

    describe('default error message', () => {
        it('returns the default message when no options are provided', async () => {
            const errors = await validateZip('bad-zip');
            expect(errors[0].constraints?.IsValidZipCode).toBe(
                'Zip code must be a valid 5 or 9 digit US ZIP code',
            );
        });
    });

    describe('custom validation options', () => {
        it('uses the custom message when validationOptions.message is set', async () => {
            const dto = new TestDtoWithOptions();
            const errors = await validateZip('bad-zip', dto);
            expect(errors[0].constraints?.IsValidZipCode).toBe('Custom error message');
        });
    });
});
