import { validate } from 'class-validator';
import { CreateDtiOtherDebtDto } from './create-dti-other-debt.dto';
import { DtiOtherDebtsLabelsEnum } from '../../../common/enum';

describe('CreateDtiOtherDebtDto', () => {
    const buildDto = (overrides: Partial<CreateDtiOtherDebtDto> = {}): CreateDtiOtherDebtDto => {
        const dto = new CreateDtiOtherDebtDto();
        dto.label = DtiOtherDebtsLabelsEnum.AUTO_LOAN;
        dto.value = 1500;
        return Object.assign(dto, overrides);
    };

    describe('Class Definition', () => {
        it('should be instantiable', () => {
            expect(new CreateDtiOtherDebtDto()).toBeInstanceOf(CreateDtiOtherDebtDto);
        });

        it('should have a label property', () => {
            expect(buildDto()).toHaveProperty('label');
        });

        it('should have a value property', () => {
            expect(buildDto()).toHaveProperty('value');
        });
    });

    describe('Swagger Metadata', () => {
        it('should have ApiProperty metadata on label', () => {
            const metadata = Reflect.getMetadata(
                'swagger/apiModelProperties',
                CreateDtiOtherDebtDto.prototype,
                'label',
            );
            expect(metadata).toBeDefined();
        });

        it('should have ApiProperty metadata on value', () => {
            const metadata = Reflect.getMetadata(
                'swagger/apiModelProperties',
                CreateDtiOtherDebtDto.prototype,
                'value',
            );
            expect(metadata).toBeDefined();
        });

        it('should mark label as required in Swagger metadata', () => {
            const metadata = Reflect.getMetadata(
                'swagger/apiModelProperties',
                CreateDtiOtherDebtDto.prototype,
                'label',
            );
            expect(metadata.required).toBe(true);
        });

        it('should mark value as required in Swagger metadata', () => {
            const metadata = Reflect.getMetadata(
                'swagger/apiModelProperties',
                CreateDtiOtherDebtDto.prototype,
                'value',
            );
            expect(metadata.required).toBe(true);
        });

        it('should set description on label', () => {
            const metadata = Reflect.getMetadata(
                'swagger/apiModelProperties',
                CreateDtiOtherDebtDto.prototype,
                'label',
            );
            expect(metadata.description).toBe('The label of the new debt');
        });

        it('should set description on value', () => {
            const metadata = Reflect.getMetadata(
                'swagger/apiModelProperties',
                CreateDtiOtherDebtDto.prototype,
                'value',
            );
            expect(metadata.description).toBe('The value of the new debt');
        });

        it('should set example on label to AUTO_LOAN', () => {
            const metadata = Reflect.getMetadata(
                'swagger/apiModelProperties',
                CreateDtiOtherDebtDto.prototype,
                'label',
            );
            expect(metadata.example).toBe(DtiOtherDebtsLabelsEnum.AUTO_LOAN);
        });

        it('should set example on value', () => {
            const metadata = Reflect.getMetadata(
                'swagger/apiModelProperties',
                CreateDtiOtherDebtDto.prototype,
                'value',
            );
            expect(metadata.example).toBe(290903);
        });
    });

    describe('Valid Cases', () => {
        it('should pass with AUTO_LOAN and positive value', async () => {
            expect(await validate(buildDto())).toHaveLength(0);
        });

        it('should pass with every valid enum value for label', async () => {
            for (const label of Object.values(DtiOtherDebtsLabelsEnum)) {
                const errors = await validate(buildDto({ label }));
                expect(errors.some((e) => e.property === 'label')).toBe(false);
            }
        });

        it('should pass with value = 0', async () => {
            expect(await validate(buildDto({ value: 0 }))).toHaveLength(0);
        });

        it('should pass with a large value', async () => {
            expect(await validate(buildDto({ value: 1000000 }))).toHaveLength(0);
        });

        it('should pass with a decimal value (up to 2 places)', async () => {
            expect(await validate(buildDto({ value: 99.99 }))).toHaveLength(0);
        });
    });

    describe('label Validation', () => {
        it('should fail when label is missing', async () => {
            const dto = buildDto();
            delete (dto as any).label;
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'label')).toBe(true);
        });

        it('should fail when label is an invalid enum value', async () => {
            const errors = await validate(buildDto({ label: 'invalid_label' as any }));
            expect(errors.some((e) => e.property === 'label')).toBe(true);
        });

        it('should fail when label is null', async () => {
            const errors = await validate(buildDto({ label: null as any }));
            expect(errors.some((e) => e.property === 'label')).toBe(true);
        });

        it('should fail when label is a number', async () => {
            const errors = await validate(buildDto({ label: 42 as any }));
            expect(errors.some((e) => e.property === 'label')).toBe(true);
        });

        it('should fail when label is an empty string', async () => {
            const errors = await validate(buildDto({ label: '' as any }));
            expect(errors.some((e) => e.property === 'label')).toBe(true);
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
            const errors = await validate(buildDto({ value: 'abc' as any }));
            expect(errors.some((e) => e.property === 'value')).toBe(true);
        });

        it('should fail when value is negative', async () => {
            const errors = await validate(buildDto({ value: -1 }));
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
