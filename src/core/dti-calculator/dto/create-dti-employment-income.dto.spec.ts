import { validate } from 'class-validator';
import { CreateDtiEmploymentIncomeDto } from './create-dti-employment-income.dto';

describe('CreateDtiEmploymentIncomeDto', () => {
    const buildDto = (
        overrides: Partial<CreateDtiEmploymentIncomeDto> = {},
    ): CreateDtiEmploymentIncomeDto => {
        const dto = new CreateDtiEmploymentIncomeDto();
        dto.label = 'Primary employment';
        dto.value = 50000;
        return Object.assign(dto, overrides);
    };

    describe('Class Definition', () => {
        it('should be instantiable', () => {
            expect(new CreateDtiEmploymentIncomeDto()).toBeInstanceOf(CreateDtiEmploymentIncomeDto);
        });

        it('should have a label property', () => {
            const dto = buildDto();
            expect(dto).toHaveProperty('label');
        });

        it('should have a value property', () => {
            const dto = buildDto();
            expect(dto).toHaveProperty('value');
        });
    });

    describe('Swagger Metadata', () => {
        it('should have ApiProperty metadata on label', () => {
            const metadata = Reflect.getMetadata(
                'swagger/apiModelProperties',
                CreateDtiEmploymentIncomeDto.prototype,
                'label',
            );
            expect(metadata).toBeDefined();
        });

        it('should have ApiProperty metadata on value', () => {
            const metadata = Reflect.getMetadata(
                'swagger/apiModelProperties',
                CreateDtiEmploymentIncomeDto.prototype,
                'value',
            );
            expect(metadata).toBeDefined();
        });

        it('should mark label as required in Swagger metadata', () => {
            const metadata = Reflect.getMetadata(
                'swagger/apiModelProperties',
                CreateDtiEmploymentIncomeDto.prototype,
                'label',
            );
            expect(metadata.required).toBe(true);
        });

        it('should mark value as required in Swagger metadata', () => {
            const metadata = Reflect.getMetadata(
                'swagger/apiModelProperties',
                CreateDtiEmploymentIncomeDto.prototype,
                'value',
            );
            expect(metadata.required).toBe(true);
        });

        it('should set description on label in Swagger metadata', () => {
            const metadata = Reflect.getMetadata(
                'swagger/apiModelProperties',
                CreateDtiEmploymentIncomeDto.prototype,
                'label',
            );
            expect(metadata.description).toBe('The label of the new employment income');
        });

        it('should set description on value in Swagger metadata', () => {
            const metadata = Reflect.getMetadata(
                'swagger/apiModelProperties',
                CreateDtiEmploymentIncomeDto.prototype,
                'value',
            );
            expect(metadata.description).toBe('The value of the new employment income');
        });

        it('should set example on label in Swagger metadata', () => {
            const metadata = Reflect.getMetadata(
                'swagger/apiModelProperties',
                CreateDtiEmploymentIncomeDto.prototype,
                'label',
            );
            expect(metadata.example).toBe('Primary employment');
        });

        it('should set example on value in Swagger metadata', () => {
            const metadata = Reflect.getMetadata(
                'swagger/apiModelProperties',
                CreateDtiEmploymentIncomeDto.prototype,
                'value',
            );
            expect(metadata.example).toBe(290903);
        });
    });

    describe('Valid Cases', () => {
        it('should pass validation with valid label and value', async () => {
            const errors = await validate(buildDto());
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with a different valid label', async () => {
            const errors = await validate(buildDto({ label: 'Secondary job' }));
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with value of 0', async () => {
            const errors = await validate(buildDto({ value: 0 }));
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with a large numeric value', async () => {
            const errors = await validate(buildDto({ value: 999999 }));
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with a decimal value (up to 2 decimal places)', async () => {
            const errors = await validate(buildDto({ value: 1234.56 }));
            expect(errors).toHaveLength(0);
        });
    });

    describe('label Validation', () => {
        it('should fail when label is missing', async () => {
            const dto = buildDto();
            delete (dto as any).label;
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'label')).toBe(true);
        });

        it('should fail when label is an empty string', async () => {
            const errors = await validate(buildDto({ label: '' }));
            expect(errors.some((e) => e.property === 'label')).toBe(true);
        });

        it('should fail when label is too short (less than 2 characters)', async () => {
            const errors = await validate(buildDto({ label: 'A' }));
            expect(errors.some((e) => e.property === 'label')).toBe(true);
        });

        it('should fail when label is a number', async () => {
            const errors = await validate(buildDto({ label: 123 as any }));
            expect(errors.some((e) => e.property === 'label')).toBe(true);
        });

        it('should fail when label is null', async () => {
            const errors = await validate(buildDto({ label: null as any }));
            expect(errors.some((e) => e.property === 'label')).toBe(true);
        });

        it('should pass when label has exactly 2 characters', async () => {
            const errors = await validate(buildDto({ label: 'AB' }));
            expect(errors.some((e) => e.property === 'label')).toBe(false);
        });
    });

    describe('value Validation', () => {
        it('should fail when value is missing', async () => {
            const dto = buildDto();
            delete (dto as any).value;
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'value')).toBe(true);
        });

        it('should fail when value is a string', async () => {
            const errors = await validate(buildDto({ value: 'not-a-number' as any }));
            expect(errors.some((e) => e.property === 'value')).toBe(true);
        });

        it('should fail when value is negative', async () => {
            const errors = await validate(buildDto({ value: -100 }));
            expect(errors.some((e) => e.property === 'value')).toBe(true);
        });

        it('should fail when value is null', async () => {
            const errors = await validate(buildDto({ value: null as any }));
            expect(errors.some((e) => e.property === 'value')).toBe(true);
        });

        it('should fail when value is NaN', async () => {
            const errors = await validate(buildDto({ value: NaN }));
            expect(errors.some((e) => e.property === 'value')).toBe(true);
        });
    });
});
