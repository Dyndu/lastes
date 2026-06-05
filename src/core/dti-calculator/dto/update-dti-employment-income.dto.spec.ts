import { validate } from 'class-validator';
import { UpdateDtiEmploymentIncomeDto } from './update-dti-employment-income.dto';
import { CreateDtiEmploymentIncomeDto } from './create-dti-employment-income.dto';

describe('UpdateDtiEmploymentIncomeDto', () => {
    const buildDto = (
        overrides: Partial<UpdateDtiEmploymentIncomeDto> = {},
    ): UpdateDtiEmploymentIncomeDto => Object.assign(new UpdateDtiEmploymentIncomeDto(), overrides);

    describe('Class Definition & Inheritance', () => {
        it('should be instantiable', () => {
            expect(new UpdateDtiEmploymentIncomeDto()).toBeInstanceOf(UpdateDtiEmploymentIncomeDto);
        });

        it('should have a label property when set', () => {
            const dto = buildDto({ label: 'Side hustle' });
            expect(dto.label).toBe('Side hustle');
        });

        it('should have a value property when set', () => {
            const dto = buildDto({ value: 3000 });
            expect(dto.value).toBe(3000);
        });
    });

    describe('Swagger Metadata', () => {
        it('should have ApiProperty metadata on label', () => {
            const metadata = Reflect.getMetadata(
                'swagger/apiModelProperties',
                UpdateDtiEmploymentIncomeDto.prototype,
                'label',
            );
            expect(metadata).toBeDefined();
        });

        it('should have ApiProperty metadata on value', () => {
            const metadata = Reflect.getMetadata(
                'swagger/apiModelProperties',
                UpdateDtiEmploymentIncomeDto.prototype,
                'value',
            );
            expect(metadata).toBeDefined();
        });

        it('should mark label as not required (PartialType makes all fields optional)', () => {
            const metadata = Reflect.getMetadata(
                'swagger/apiModelProperties',
                UpdateDtiEmploymentIncomeDto.prototype,
                'label',
            );
            expect(metadata.required).toBe(false);
        });

        it('should mark value as not required (PartialType makes all fields optional)', () => {
            const metadata = Reflect.getMetadata(
                'swagger/apiModelProperties',
                UpdateDtiEmploymentIncomeDto.prototype,
                'value',
            );
            expect(metadata.required).toBe(false);
        });
    });

    describe('All fields are optional (PartialType)', () => {
        it('should pass validation with an empty object', async () => {
            const errors = await validate(buildDto());
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with only label provided', async () => {
            const errors = await validate(buildDto({ label: 'Freelance work' }));
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with only value provided', async () => {
            const errors = await validate(buildDto({ value: 12000 }));
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with both label and value provided', async () => {
            const errors = await validate(buildDto({ label: 'Part time job', value: 800 }));
            expect(errors).toHaveLength(0);
        });
    });

    describe('Format validation when fields are present', () => {
        it('should fail when label is provided but is a number', async () => {
            const errors = await validate(buildDto({ label: 999 as any }));
            expect(errors.some((e) => e.property === 'label')).toBe(true);
        });

        it('should fail when label is provided but too short', async () => {
            const errors = await validate(buildDto({ label: 'X' }));
            expect(errors.some((e) => e.property === 'label')).toBe(true);
        });

        it('should fail when value is provided but is a string', async () => {
            const errors = await validate(buildDto({ value: 'not-a-number' as any }));
            expect(errors.some((e) => e.property === 'value')).toBe(true);
        });

        it('should fail when value is provided but is negative', async () => {
            const errors = await validate(buildDto({ value: -100 }));
            expect(errors.some((e) => e.property === 'value')).toBe(true);
        });

        it('should fail when value is NaN', async () => {
            const errors = await validate(buildDto({ value: NaN }));
            expect(errors.some((e) => e.property === 'value')).toBe(true);
        });

        it('should pass when label has exactly 2 characters', async () => {
            const errors = await validate(buildDto({ label: 'OK' }));
            expect(errors.some((e) => e.property === 'label')).toBe(false);
        });

        it('should pass when value is 0', async () => {
            const errors = await validate(buildDto({ value: 0 }));
            expect(errors.some((e) => e.property === 'value')).toBe(false);
        });
    });
});
