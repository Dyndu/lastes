import { validate } from 'class-validator';
import { UpdateDtiOtherIncomeDto } from './update-dti-other-income.dto';
import { DtiOtherIncomeLabelsEnum } from '../../../common/enum';

describe('UpdateDtiOtherIncomeDto', () => {
    const buildDto = (overrides: Partial<UpdateDtiOtherIncomeDto> = {}): UpdateDtiOtherIncomeDto =>
        Object.assign(new UpdateDtiOtherIncomeDto(), overrides);

    describe('Class Definition & Inheritance', () => {
        it('should be instantiable', () => {
            expect(new UpdateDtiOtherIncomeDto()).toBeInstanceOf(UpdateDtiOtherIncomeDto);
        });

        it('should have a label property when set', () => {
            const dto = buildDto({ label: DtiOtherIncomeLabelsEnum.PENSION });
            expect(dto.label).toBe(DtiOtherIncomeLabelsEnum.PENSION);
        });

        it('should have a value property when set', () => {
            const dto = buildDto({ value: 1200 });
            expect(dto.value).toBe(1200);
        });
    });

    describe('Swagger Metadata', () => {
        it('should have ApiProperty metadata on label', () => {
            const metadata = Reflect.getMetadata(
                'swagger/apiModelProperties',
                UpdateDtiOtherIncomeDto.prototype,
                'label',
            );
            expect(metadata).toBeDefined();
        });

        it('should have ApiProperty metadata on value', () => {
            const metadata = Reflect.getMetadata(
                'swagger/apiModelProperties',
                UpdateDtiOtherIncomeDto.prototype,
                'value',
            );
            expect(metadata).toBeDefined();
        });

        it('should mark label as not required (PartialType makes all fields optional)', () => {
            const metadata = Reflect.getMetadata(
                'swagger/apiModelProperties',
                UpdateDtiOtherIncomeDto.prototype,
                'label',
            );
            expect(metadata.required).toBe(false);
        });

        it('should mark value as not required (PartialType makes all fields optional)', () => {
            const metadata = Reflect.getMetadata(
                'swagger/apiModelProperties',
                UpdateDtiOtherIncomeDto.prototype,
                'value',
            );
            expect(metadata.required).toBe(false);
        });
    });

    describe('All fields are optional (PartialType)', () => {
        it('should pass validation with an empty object', async () => {
            expect(await validate(buildDto())).toHaveLength(0);
        });

        it('should pass validation with only label provided', async () => {
            const errors = await validate(buildDto({ label: DtiOtherIncomeLabelsEnum.RETIREMENT }));
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with only value provided', async () => {
            const errors = await validate(buildDto({ value: 4500 }));
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with both label and value provided', async () => {
            const errors = await validate(
                buildDto({ label: DtiOtherIncomeLabelsEnum.SOCIAL_SECURITY, value: 1800 }),
            );
            expect(errors).toHaveLength(0);
        });

        it('should pass with every valid enum value for label', async () => {
            for (const label of Object.values(DtiOtherIncomeLabelsEnum)) {
                const errors = await validate(buildDto({ label }));
                expect(errors.some((e) => e.property === 'label')).toBe(false);
            }
        });

        it('should pass with value = 0', async () => {
            expect(await validate(buildDto({ value: 0 }))).toHaveLength(0);
        });
    });

    describe('Format validation when fields are present', () => {
        it('should fail when label is an invalid enum value', async () => {
            const errors = await validate(buildDto({ label: 'lottery_winnings' as any }));
            expect(errors.some((e) => e.property === 'label')).toBe(true);
        });

        it('should fail when label is a number', async () => {
            const errors = await validate(buildDto({ label: 99 as any }));
            expect(errors.some((e) => e.property === 'label')).toBe(true);
        });

        it('should fail when label is an empty string', async () => {
            const errors = await validate(buildDto({ label: '' as any }));
            expect(errors.some((e) => e.property === 'label')).toBe(true);
        });

        it('should fail when value is a string', async () => {
            const errors = await validate(buildDto({ value: 'one thousand' as any }));
            expect(errors.some((e) => e.property === 'value')).toBe(true);
        });

        it('should fail when value is negative', async () => {
            const errors = await validate(buildDto({ value: -10 }));
            expect(errors.some((e) => e.property === 'value')).toBe(true);
        });

        it('should fail when value is NaN', async () => {
            const errors = await validate(buildDto({ value: NaN }));
            expect(errors.some((e) => e.property === 'value')).toBe(true);
        });

        it('should pass with a decimal value (up to 2 places)', async () => {
            const errors = await validate(buildDto({ value: 500.5 }));
            expect(errors.some((e) => e.property === 'value')).toBe(false);
        });

        it('should pass with DISABILITY_BENEFITS label', async () => {
            const errors = await validate(
                buildDto({ label: DtiOtherIncomeLabelsEnum.DISABILITY_BENEFITS }),
            );
            expect(errors.some((e) => e.property === 'label')).toBe(false);
        });

        it('should pass with REQUIRED_MINIMUM_DISTRIBUTIONS label', async () => {
            const errors = await validate(
                buildDto({ label: DtiOtherIncomeLabelsEnum.REQUIRED_MINIMUM_DISTRIBUTIONS }),
            );
            expect(errors.some((e) => e.property === 'label')).toBe(false);
        });
    });
});
