import { validate } from 'class-validator';
import { IsRequiredIf } from './required-if.dto';

enum TestEnum {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
}

class TestDto {
    method: TestEnum;

    @IsRequiredIf((o) => o.method === TestEnum.UPDATE, {
        message: 'id is required when method is UPDATE',
    })
    id?: string;

    @IsRequiredIf((o) => o.method === TestEnum.CREATE, {
        message: 'label is required when method is CREATE',
    })
    label?: string;
}

describe('IsRequiredIf Decorator', () => {
    describe('When condition is TRUE (field should be required)', () => {
        it('should fail validation when value is undefined', async () => {
            const dto = new TestDto();
            dto.method = TestEnum.UPDATE;
            dto.id = undefined;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('id');
            expect(errors[0].constraints?.isRequiredIf).toBe(
                'id is required when method is UPDATE',
            );
        });

        it('should fail validation when value is null', async () => {
            const dto = new TestDto();
            dto.method = TestEnum.UPDATE;
            dto.id = null as any;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('id');
        });

        it('should fail validation when value is empty string', async () => {
            const dto = new TestDto();
            dto.method = TestEnum.UPDATE;
            dto.id = '';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('id');
        });

        it('should pass validation when value is provided', async () => {
            const dto = new TestDto();
            dto.method = TestEnum.UPDATE;
            dto.id = '123e4567-e89b-12d3-a456-426614174000';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation when value is 0 (falsy but valid)', async () => {
            class TestDtoWithNumber {
                method: TestEnum;

                @IsRequiredIf((o) => o.method === TestEnum.UPDATE)
                count?: number;
            }

            const dto = new TestDtoWithNumber();
            dto.method = TestEnum.UPDATE;
            dto.count = 0;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail validation when value is whitespace-only string', async () => {
            const dto = new TestDto();
            dto.method = TestEnum.UPDATE;
            dto.id = '   ';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('id');
        });

        it('should pass validation when value is false (falsy but valid)', async () => {
            class TestDtoWithBoolean {
                method: TestEnum;

                @IsRequiredIf((o) => o.method === TestEnum.UPDATE)
                flag?: boolean;
            }

            const dto = new TestDtoWithBoolean();
            dto.method = TestEnum.UPDATE;
            dto.flag = false;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('When condition is FALSE (field should NOT be required)', () => {
        it('should pass validation when value is undefined', async () => {
            const dto = new TestDto();
            dto.method = TestEnum.CREATE;
            dto.id = undefined;
            dto.label = 'some label';

            const errors = await validate(dto);
            const idErrors = errors.filter((e) => e.property === 'id');
            expect(idErrors.length).toBe(0);
        });

        it('should pass validation when value is null', async () => {
            const dto = new TestDto();
            dto.method = TestEnum.CREATE;
            dto.id = null as any;
            dto.label = 'some label';

            const errors = await validate(dto);
            const idErrors = errors.filter((e) => e.property === 'id');
            expect(idErrors.length).toBe(0);
        });

        it('should pass validation when value is empty string', async () => {
            const dto = new TestDto();
            dto.method = TestEnum.CREATE;
            dto.id = '';
            dto.label = 'some label';

            const errors = await validate(dto);
            const idErrors = errors.filter((e) => e.property === 'id');
            expect(idErrors.length).toBe(0);
        });

        it('should pass validation when value is provided', async () => {
            const dto = new TestDto();
            dto.method = TestEnum.CREATE;
            dto.id = '123e4567-e89b-12d3-a456-426614174000';
            dto.label = 'some label';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Multiple conditional fields', () => {
        it('should validate multiple fields based on different conditions', async () => {
            const dto = new TestDto();
            dto.method = TestEnum.CREATE;
            dto.id = undefined;
            dto.label = undefined;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const labelErrors = errors.filter((e) => e.property === 'label');
            const idErrors = errors.filter((e) => e.property === 'id');

            expect(labelErrors.length).toBeGreaterThan(0);
            expect(idErrors.length).toBe(0);
        });

        it('should pass when all conditional requirements are met', async () => {
            const dto = new TestDto();
            dto.method = TestEnum.UPDATE;
            dto.id = '123e4567-e89b-12d3-a456-426614174000';
            dto.label = undefined;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Edge cases', () => {
        it('should handle complex condition functions', async () => {
            class ComplexDto {
                status: string;
                priority: number;

                @IsRequiredIf((o) => o.status === 'active' && o.priority > 5)
                approvalId?: string;
            }

            const dto = new ComplexDto();
            dto.status = 'active';
            dto.priority = 10;
            dto.approvalId = undefined;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should work with custom validation message', async () => {
            const dto = new TestDto();
            dto.method = TestEnum.CREATE;
            dto.label = undefined;

            const errors = await validate(dto);
            const labelErrors = errors.filter((e) => e.property === 'label');
            expect(labelErrors[0].constraints?.isRequiredIf).toBe(
                'label is required when method is CREATE',
            );
        });
    });
});
