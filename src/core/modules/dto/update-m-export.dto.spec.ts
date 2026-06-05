import { UpdateMExportDto } from './update-m-export.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
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

describe('UpdateMExportDto', () => {
    it('should be valid with an empty object (all fields optional)', async () => {
        await expectValid(UpdateMExportDto, {});
    });

    it('should be valid with only companyName provided', async () => {
        await expectValid(UpdateMExportDto, { companyName: 'NewCorp' });
    });

    it('should be valid with only phoneNumber provided', async () => {
        await expectValid(UpdateMExportDto, { phoneNumber: '+22900000000' });
    });

    it('should be valid with only address provided', async () => {
        await expectValid(UpdateMExportDto, { address: 'New Address' });
    });

    it('should be valid with only email provided', async () => {
        await expectValid(UpdateMExportDto, { email: 'new@test.com' });
    });

    it('should be valid with only file provided (valid UUID)', async () => {
        await expectValid(UpdateMExportDto, { file: VALID_UUID });
    });

    it('should be valid with only label provided', async () => {
        await expectValid(UpdateMExportDto, { label: 'Updated Label' });
    });

    it('should be valid with all fields provided', async () => {
        await expectValid(UpdateMExportDto, validPayload({ label: 'Updated' }));
    });

    it('should be invalid when provided companyName is too short', async () => {
        await expectInvalidOn(UpdateMExportDto, { companyName: 'X' }, 'companyName');
    });

    it('should be invalid when provided phoneNumber is too short', async () => {
        await expectInvalidOn(UpdateMExportDto, { phoneNumber: '0' }, 'phoneNumber');
    });

    it('should be invalid when provided address is too short', async () => {
        await expectInvalidOn(UpdateMExportDto, { address: 'R' }, 'address');
    });

    it('should be invalid when provided email is too short', async () => {
        await expectInvalidOn(UpdateMExportDto, { email: 'a' }, 'email');
    });

    it('should be invalid when provided file is not a UUID', async () => {
        await expectInvalidOn(UpdateMExportDto, { file: 'not-a-uuid' }, 'file');
    });

    it('should be invalid when provided label is too short', async () => {
        await expectInvalidOn(UpdateMExportDto, { label: 'X' }, 'label');
    });

    it('should be invalid when provided companyName is not a string', async () => {
        await expectInvalidOn(UpdateMExportDto, { companyName: 123 }, 'companyName');
    });

    it('should be invalid when provided file is a UUID v1', async () => {
        await expectInvalidOn(
            UpdateMExportDto,
            { file: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' },
            'file',
        );
    });

    it('should report multiple errors when multiple provided fields are invalid', async () => {
        const errors = await getErrors(UpdateMExportDto, {
            companyName: 'X',
            phoneNumber: '0',
            file: 'bad',
        });
        const props = errors.map((e) => e.property);
        expect(props).toContain('companyName');
        expect(props).toContain('phoneNumber');
        expect(props).toContain('file');
    });
});
