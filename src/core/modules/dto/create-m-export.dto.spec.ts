import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateMExportDto } from './create-m-export.dto';

const VALID_UUID = 'eb5174d5-1cef-40f6-bb57-97393cde0426';

const validPayload = (overrides: Partial<Record<string, any>> = {}) => ({
    companyName: 'Soft Vodooz',
    phoneNumber: '+22908009090',
    address: 'Rue des palmiers',
    email: 'contact@softvodooz.com',
    file: VALID_UUID,
    ...overrides,
});

async function getErrors(cls: any, plain: object) {
    const instance = plainToInstance(cls, plain);
    return validate(<Object>instance);
}

async function expectValid(cls: any, plain: object) {
    const errors = await getErrors(cls, plain);
    expect(errors).toHaveLength(0);
}

async function expectInvalidOn(cls: any, plain: object, property: string) {
    const errors = await getErrors(cls, plain);
    const props = errors.map((e) => e.property);
    expect(props).toContain(property);
}

describe('CreateMExportDto', () => {
    describe('label', () => {
        it('should be valid when label is omitted', async () => {
            await expectValid(CreateMExportDto, validPayload());
        });

        it('should be valid when label is a proper string', async () => {
            await expectValid(CreateMExportDto, validPayload({ label: 'Template 1' }));
        });

        it('should be invalid when label is provided but too short (< 2 chars)', async () => {
            await expectInvalidOn(CreateMExportDto, validPayload({ label: 'X' }), 'label');
        });

        it('should be invalid when label is not a string', async () => {
            await expectInvalidOn(CreateMExportDto, validPayload({ label: 123 }), 'label');
        });
    });

    describe('companyName', () => {
        it('should be valid with a proper company name', async () => {
            await expectValid(CreateMExportDto, validPayload({ companyName: 'Soft Vodooz' }));
        });

        it('should be invalid when companyName is missing', async () => {
            const { companyName: _, ...rest } = validPayload() as any;
            await expectInvalidOn(CreateMExportDto, rest, 'companyName');
        });

        it('should be invalid when companyName is too short (< 2 chars)', async () => {
            await expectInvalidOn(
                CreateMExportDto,
                validPayload({ companyName: 'A' }),
                'companyName',
            );
        });

        it('should be invalid when companyName is not a string', async () => {
            await expectInvalidOn(
                CreateMExportDto,
                validPayload({ companyName: 42 }),
                'companyName',
            );
        });

        it('should be invalid when companyName is empty string', async () => {
            await expectInvalidOn(
                CreateMExportDto,
                validPayload({ companyName: '' }),
                'companyName',
            );
        });
    });

    describe('phoneNumber', () => {
        it('should be valid with a proper phone number', async () => {
            await expectValid(CreateMExportDto, validPayload({ phoneNumber: '+22908009090' }));
        });

        it('should be invalid when phoneNumber is missing', async () => {
            const { phoneNumber: _, ...rest } = validPayload() as any;
            await expectInvalidOn(CreateMExportDto, rest, 'phoneNumber');
        });

        it('should be invalid when phoneNumber is too short (< 2 chars)', async () => {
            await expectInvalidOn(
                CreateMExportDto,
                validPayload({ phoneNumber: '0' }),
                'phoneNumber',
            );
        });

        it('should be invalid when phoneNumber is not a string', async () => {
            await expectInvalidOn(
                CreateMExportDto,
                validPayload({ phoneNumber: 229 }),
                'phoneNumber',
            );
        });

        it('should be invalid when phoneNumber is empty string', async () => {
            await expectInvalidOn(
                CreateMExportDto,
                validPayload({ phoneNumber: '' }),
                'phoneNumber',
            );
        });
    });

    describe('address', () => {
        it('should be valid with a proper address', async () => {
            await expectValid(CreateMExportDto, validPayload({ address: 'Rue des palmiers' }));
        });

        it('should be invalid when address is missing', async () => {
            const { address: _, ...rest } = validPayload() as any;
            await expectInvalidOn(CreateMExportDto, rest, 'address');
        });

        it('should be invalid when address is too short (< 2 chars)', async () => {
            await expectInvalidOn(CreateMExportDto, validPayload({ address: 'R' }), 'address');
        });

        it('should be invalid when address is not a string', async () => {
            await expectInvalidOn(CreateMExportDto, validPayload({ address: true }), 'address');
        });

        it('should be invalid when address is empty string', async () => {
            await expectInvalidOn(CreateMExportDto, validPayload({ address: '' }), 'address');
        });
    });

    describe('email', () => {
        it('should be valid with a proper email string', async () => {
            await expectValid(CreateMExportDto, validPayload({ email: 'contact@softvodooz.com' }));
        });

        it('should be invalid when email is missing', async () => {
            const { email: _, ...rest } = validPayload() as any;
            await expectInvalidOn(CreateMExportDto, rest, 'email');
        });

        it('should be invalid when email is too short (< 2 chars)', async () => {
            await expectInvalidOn(CreateMExportDto, validPayload({ email: 'a' }), 'email');
        });

        it('should be invalid when email is not a string', async () => {
            await expectInvalidOn(CreateMExportDto, validPayload({ email: 99 }), 'email');
        });

        it('should be invalid when email is empty string', async () => {
            await expectInvalidOn(CreateMExportDto, validPayload({ email: '' }), 'email');
        });
    });

    describe('file', () => {
        it('should be valid with a proper UUID v4', async () => {
            await expectValid(CreateMExportDto, validPayload({ file: VALID_UUID }));
        });

        it('should be invalid when file is missing', async () => {
            const { file: _, ...rest } = validPayload() as any;
            await expectInvalidOn(CreateMExportDto, rest, 'file');
        });

        it('should be invalid when file is not a valid UUID', async () => {
            await expectInvalidOn(CreateMExportDto, validPayload({ file: 'not-a-uuid' }), 'file');
        });

        it('should be invalid when file is a UUID v1 (not v4)', async () => {
            await expectInvalidOn(
                CreateMExportDto,
                validPayload({ file: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' }),
                'file',
            );
        });

        it('should be invalid when file is an empty string', async () => {
            await expectInvalidOn(CreateMExportDto, validPayload({ file: '' }), 'file');
        });

        it('should be invalid when file is not a string', async () => {
            await expectInvalidOn(CreateMExportDto, validPayload({ file: 12345 }), 'file');
        });
    });

    describe('full valid payload', () => {
        it('should pass with all required fields and no label', async () => {
            await expectValid(CreateMExportDto, validPayload());
        });

        it('should pass with all required fields including optional label', async () => {
            await expectValid(CreateMExportDto, validPayload({ label: 'My Template' }));
        });

        it('should fail with multiple invalid fields and report all of them', async () => {
            const errors = await getErrors(CreateMExportDto, {
                companyName: '',
                phoneNumber: '',
                address: '',
                email: '',
                file: 'bad',
            });
            const props = errors.map((e) => e.property);
            expect(props).toContain('companyName');
            expect(props).toContain('phoneNumber');
            expect(props).toContain('address');
            expect(props).toContain('email');
            expect(props).toContain('file');
        });
    });
});
