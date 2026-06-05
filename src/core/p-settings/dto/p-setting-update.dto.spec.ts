import { validate } from 'class-validator';
import { PSettingUpdateDto } from './p-setting-update.dto';

describe('PSettingUpdateDto', () => {
    const validUuid = '7f3f5860-a780-41a0-8484-4990a811ddd9';

    it('should validate empty object (all fields optional)', async () => {
        const dto = new PSettingUpdateDto();

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should validate partial update with valid fields', async () => {
        const dto = new PSettingUpdateDto();
        dto.label = 'Updated Profile';
        dto.taxRate = 5;
        dto.onePercent = true;
        dto.metrics = [validUuid];

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should fail if label is too short', async () => {
        const dto = new PSettingUpdateDto();
        dto.label = 'A';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail if numeric field is invalid', async () => {
        const dto = new PSettingUpdateDto();
        // @ts-ignore
        dto.taxRate = 'invalid';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail if boolean field is invalid', async () => {
        const dto = new PSettingUpdateDto();
        // @ts-ignore
        dto.onePercent = 'true';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail if metrics contains duplicate values', async () => {
        const dto = new PSettingUpdateDto();
        dto.metrics = [validUuid, validUuid];

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail if metrics contains invalid UUID', async () => {
        const dto = new PSettingUpdateDto();
        dto.metrics = ['invalid-uuid'];

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });
});
