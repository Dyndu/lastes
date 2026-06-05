import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { MRelationDto } from './m-relation.dto';
import { ModuleMethodEnum } from '../../../common/enum';

describe('MRelationDto', () => {
    describe('method field', () => {
        it('should pass validation with valid CREATE method', async () => {
            const dto = plainToClass(MRelationDto, {
                method: ModuleMethodEnum.CREATE,
                label: 'Test Label',
                icon: 'test-icon',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with valid UPDATE method', async () => {
            const dto = plainToClass(MRelationDto, {
                method: ModuleMethodEnum.UPDATE,
                id: '34eeee5a-f3a5-46bc-8502-7160d04114be',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail validation when method is missing', async () => {
            const dto = plainToClass(MRelationDto, {});

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const methodError = errors.find((e) => e.property === 'method');
            expect(methodError).toBeDefined();
            expect(methodError?.constraints).toHaveProperty('isNotEmpty');
        });

        it('should fail validation with invalid enum value', async () => {
            const dto = plainToClass(MRelationDto, {
                method: 'INVALID_METHOD',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const methodError = errors.find((e) => e.property === 'method');
            expect(methodError).toBeDefined();
            expect(methodError?.constraints).toHaveProperty('isEnum');
        });
    });

    describe('id field - conditional validation', () => {
        it('should pass validation with id when method is UPDATE', async () => {
            const dto = plainToClass(MRelationDto, {
                method: ModuleMethodEnum.UPDATE,
                id: '34eeee5a-f3a5-46bc-8502-7160d04114be',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should not require id when method is CREATE', async () => {
            const dto = plainToClass(MRelationDto, {
                method: ModuleMethodEnum.CREATE,
                label: 'Test Label',
                icon: 'test-icon',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail validation when id is empty string with UPDATE method', async () => {
            const dto = plainToClass(MRelationDto, {
                method: ModuleMethodEnum.UPDATE,
                id: '',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const idError = errors.find((e) => e.property === 'id');
            expect(idError).toBeDefined();
        });

        it('should fail validation when id is too short with UPDATE method', async () => {
            const dto = plainToClass(MRelationDto, {
                method: ModuleMethodEnum.UPDATE,
                id: 'a',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const idError = errors.find((e) => e.property === 'id');
            expect(idError).toBeDefined();
            expect(idError?.constraints).toHaveProperty('minLength');
        });

        it('should fail validation when id is not a string', async () => {
            const dto = plainToClass(MRelationDto, {
                method: ModuleMethodEnum.UPDATE,
                id: 123,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const idError = errors.find((e) => e.property === 'id');
            expect(idError).toBeDefined();
            expect(idError?.constraints).toHaveProperty('isString');
        });

        it('should allow id to be provided with CREATE method', async () => {
            const dto = plainToClass(MRelationDto, {
                method: ModuleMethodEnum.CREATE,
                label: 'Test Label',
                icon: 'test-icon',
                id: '34eeee5a-f3a5-46bc-8502-7160d04114be',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('label field - conditional validation', () => {
        it('should pass validation with label when method is CREATE', async () => {
            const dto = plainToClass(MRelationDto, {
                method: ModuleMethodEnum.CREATE,
                label: 'Test Label',
                icon: 'test-icon',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should not require label when method is UPDATE', async () => {
            const dto = plainToClass(MRelationDto, {
                method: ModuleMethodEnum.UPDATE,
                id: '34eeee5a-f3a5-46bc-8502-7160d04114be',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail validation when label is empty string with CREATE method', async () => {
            const dto = plainToClass(MRelationDto, {
                method: ModuleMethodEnum.CREATE,
                label: '',
                icon: 'test-icon',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const labelError = errors.find((e) => e.property === 'label');
            expect(labelError).toBeDefined();
        });

        it('should fail validation when label is too short with CREATE method', async () => {
            const dto = plainToClass(MRelationDto, {
                method: ModuleMethodEnum.CREATE,
                label: 'a',
                icon: 'test-icon',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const labelError = errors.find((e) => e.property === 'label');
            expect(labelError).toBeDefined();
            expect(labelError?.constraints).toHaveProperty('minLength');
        });

        it('should fail validation when label is not a string', async () => {
            const dto = plainToClass(MRelationDto, {
                method: ModuleMethodEnum.CREATE,
                label: 123,
                icon: 'test-icon',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const labelError = errors.find((e) => e.property === 'label');
            expect(labelError).toBeDefined();
            expect(labelError?.constraints).toHaveProperty('isString');
        });

        it('should allow label with minimum length of 2 characters', async () => {
            const dto = plainToClass(MRelationDto, {
                method: ModuleMethodEnum.CREATE,
                label: 'ab',
                icon: 'test-icon',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should allow label to be provided with UPDATE method', async () => {
            const dto = plainToClass(MRelationDto, {
                method: ModuleMethodEnum.UPDATE,
                id: '34eeee5a-f3a5-46bc-8502-7160d04114be',
                label: 'Optional Label',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('icon field - conditional validation', () => {
        it('should pass validation with icon when method is CREATE', async () => {
            const dto = plainToClass(MRelationDto, {
                method: ModuleMethodEnum.CREATE,
                label: 'Test Label',
                icon: 'test-icon',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should not require icon when method is UPDATE', async () => {
            const dto = plainToClass(MRelationDto, {
                method: ModuleMethodEnum.UPDATE,
                id: '34eeee5a-f3a5-46bc-8502-7160d04114be',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail validation when icon is empty string with CREATE method', async () => {
            const dto = plainToClass(MRelationDto, {
                method: ModuleMethodEnum.CREATE,
                label: 'Test Label',
                icon: '',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const iconError = errors.find((e) => e.property === 'icon');
            expect(iconError).toBeDefined();
        });

        it('should fail validation when icon is not a string', async () => {
            const dto = plainToClass(MRelationDto, {
                method: ModuleMethodEnum.CREATE,
                label: 'Test Label',
                icon: 123,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const iconError = errors.find((e) => e.property === 'icon');
            expect(iconError).toBeDefined();
            expect(iconError?.constraints).toHaveProperty('isString');
        });

        it('should allow icon with minimum length of 2 characters', async () => {
            const dto = plainToClass(MRelationDto, {
                method: ModuleMethodEnum.CREATE,
                label: 'Test Label',
                icon: 'ab',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should allow icon to be provided with UPDATE method', async () => {
            const dto = plainToClass(MRelationDto, {
                method: ModuleMethodEnum.UPDATE,
                id: '34eeee5a-f3a5-46bc-8502-7160d04114be',
                icon: 'optional-icon',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('combined scenarios', () => {
        it('should pass when CREATE method with all required fields', async () => {
            const dto = plainToClass(MRelationDto, {
                method: ModuleMethodEnum.CREATE,
                label: 'Complete Label',
                icon: 'complete-icon',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should allow optional fields when UPDATE method', async () => {
            const dto = plainToClass(MRelationDto, {
                method: ModuleMethodEnum.UPDATE,
                id: '34eeee5a-f3a5-46bc-8502-7160d04114be',
                label: 'Optional Label',
                icon: 'optional-icon',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('edge cases', () => {
        it('should handle special characters in strings', async () => {
            const dto = plainToClass(MRelationDto, {
                method: ModuleMethodEnum.CREATE,
                label: '!@#$%^&*()',
                icon: '<>?:"{}|',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should handle unicode characters', async () => {
            const dto = plainToClass(MRelationDto, {
                method: ModuleMethodEnum.CREATE,
                label: '你好世界',
                icon: '🎉🎊',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should handle very long strings', async () => {
            const dto = plainToClass(MRelationDto, {
                method: ModuleMethodEnum.CREATE,
                label: 'a'.repeat(1000),
                icon: 'b'.repeat(1000),
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });
});
