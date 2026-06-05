import { validate } from 'class-validator';
import { PSettingCreateDto } from './p-setting-create.dto';

describe('PSettingCreateDto', () => {
    const validUuid1 = '7f3f5860-a780-41a0-8484-4990a811ddd9';
    const validUuid2 = '3fb7cde0-35d2-43b7-8172-87ddae7fda60';

    const buildValidDto = (): PSettingCreateDto => {
        const dto = new PSettingCreateDto();
        dto.label = 'Valid Profile';
        dto.taxRate = 5;
        dto.occupancyRate = 95;
        dto.managementFees = 10;
        dto.maintenanceEscrow = 5;
        dto.cashReserves = 1000;
        dto.capRate = 8;
        dto.goi = 100000;
        dto.noi = 80000;
        dto.ber = 70;
        dto.oer = 40;
        dto.dscr = 1.2;
        dto.grm = 10;
        dto.agm = 12;
        dto.coc = 15;
        dto.cashFlow = -200;
        dto.fTermRoi = 20;
        dto.yearlyIncome = 12000;
        dto.roi = 18;
        dto.payBackPeriod = 5;
        dto.onePercent = true;
        dto.twoPercent = false;
        dto.fiftyPercent = true;
        dto.cashFlowAtLeast = -100;
        dto.cashNeeded = 20000;
        dto.metrics = [validUuid1, validUuid2];
        return dto;
    };

    it('should validate a fully valid DTO', async () => {
        const dto = buildValidDto();
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should fail if label is missing', async () => {
        const dto = buildValidDto();
        // @ts-ignore
        delete dto.label;

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail if label is too short', async () => {
        const dto = buildValidDto();
        dto.label = 'A';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('should allow optional numeric fields to be undefined', async () => {
        const dto = new PSettingCreateDto();
        dto.label = 'Valid Profile';

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should fail if numeric field is negative when not allowed', async () => {
        const dto = buildValidDto();
        dto.taxRate = -1; // min 0

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('should allow negative values where allowNegative is true', async () => {
        const dto = buildValidDto();
        dto.cashFlow = -500;
        dto.cashFlowAtLeast = -200;

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should fail if boolean field is not boolean', async () => {
        const dto = buildValidDto();
        // @ts-ignore
        dto.onePercent = 'true';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail if metrics contains duplicate values', async () => {
        const dto = buildValidDto();
        dto.metrics = [validUuid1, validUuid1];

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail if metrics contains invalid UUID', async () => {
        const dto = buildValidDto();
        dto.metrics = ['invalid-uuid'];

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail if metrics is not an array', async () => {
        const dto = buildValidDto();
        // @ts-ignore
        dto.metrics = 'not-array';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail if metrics elements are too short', async () => {
        const dto = buildValidDto();
        dto.metrics = ['a'];

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });
});
