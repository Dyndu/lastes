import { validate } from 'class-validator';
import { UpdateDtiOtherDebtDto } from './update-dti-other-debt.dto';
import { DtiOtherDebtsLabelsEnum } from '../../../common/enum';

describe('UpdateDtiOtherDebtDto', () => {
    const buildDto = (overrides: Partial<UpdateDtiOtherDebtDto> = {}): UpdateDtiOtherDebtDto =>
        Object.assign(new UpdateDtiOtherDebtDto(), overrides);

    describe('Class Definition & Inheritance', () => {
        it('should be instantiable', () => {
            expect(new UpdateDtiOtherDebtDto()).toBeInstanceOf(UpdateDtiOtherDebtDto);
        });

        it('should have a label property when set', () => {
            const dto = buildDto({ label: DtiOtherDebtsLabelsEnum.STUDENT_LOAN });
            expect(dto.label).toBe(DtiOtherDebtsLabelsEnum.STUDENT_LOAN);
        });

        it('should have a value property when set', () => {
            const dto = buildDto({ value: 500 });
            expect(dto.value).toBe(500);
        });
    });

    describe('Swagger Metadata', () => {
        it('should have ApiProperty metadata on label', () => {
            const metadata = Reflect.getMetadata(
                'swagger/apiModelProperties',
                UpdateDtiOtherDebtDto.prototype,
                'label',
            );
            expect(metadata).toBeDefined();
        });

        it('should have ApiProperty metadata on value', () => {
            const metadata = Reflect.getMetadata(
                'swagger/apiModelProperties',
                UpdateDtiOtherDebtDto.prototype,
                'value',
            );
            expect(metadata).toBeDefined();
        });

        it('should mark label as not required (PartialType makes all fields optional)', () => {
            const metadata = Reflect.getMetadata(
                'swagger/apiModelProperties',
                UpdateDtiOtherDebtDto.prototype,
                'label',
            );
            expect(metadata.required).toBe(false);
        });

        it('should mark value as not required (PartialType makes all fields optional)', () => {
            const metadata = Reflect.getMetadata(
                'swagger/apiModelProperties',
                UpdateDtiOtherDebtDto.prototype,
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
            const errors = await validate(buildDto({ label: DtiOtherDebtsLabelsEnum.ALIMONY }));
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with only value provided', async () => {
            const errors = await validate(buildDto({ value: 350 }));
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with both label and value provided', async () => {
            const errors = await validate(
                buildDto({ label: DtiOtherDebtsLabelsEnum.PERSONAL_LOAN, value: 900 }),
            );
            expect(errors).toHaveLength(0);
        });

        it('should pass with every valid enum value for label', async () => {
            for (const label of Object.values(DtiOtherDebtsLabelsEnum)) {
                const errors = await validate(buildDto({ label }));
                expect(errors.some((e) => e.property === 'label')).toBe(false);
            }
        });
    });

    describe('Format validation when fields are present', () => {
        it('should fail when label is provided but is invalid enum value', async () => {
            const errors = await validate(buildDto({ label: 'mortgage' as any }));
            expect(errors.some((e) => e.property === 'label')).toBe(true);
        });

        it('should fail when label is a number', async () => {
            const errors = await validate(buildDto({ label: 1 as any }));
            expect(errors.some((e) => e.property === 'label')).toBe(true);
        });

        it('should fail when value is provided but is a string', async () => {
            const errors = await validate(buildDto({ value: 'five hundred' as any }));
            expect(errors.some((e) => e.property === 'value')).toBe(true);
        });

        it('should fail when value is negative', async () => {
            const errors = await validate(buildDto({ value: -250 }));
            expect(errors.some((e) => e.property === 'value')).toBe(true);
        });

        it('should fail when value is NaN', async () => {
            const errors = await validate(buildDto({ value: NaN }));
            expect(errors.some((e) => e.property === 'value')).toBe(true);
        });

        it('should pass when value is 0', async () => {
            const errors = await validate(buildDto({ value: 0 }));
            expect(errors.some((e) => e.property === 'value')).toBe(false);
        });

        it('should pass with a decimal value (up to 2 places)', async () => {
            const errors = await validate(buildDto({ value: 123.45 }));
            expect(errors.some((e) => e.property === 'value')).toBe(false);
        });
    });
});
