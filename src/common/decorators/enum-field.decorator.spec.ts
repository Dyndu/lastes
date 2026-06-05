import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { EnumFieldDecorator } from './enum-field.decorator';

enum Status {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

class RequiredEnumDto {
    @EnumFieldDecorator(Status, 'Status', {
        example: Status.ACTIVE,
        required: true,
    })
    status: Status;
}

class OptionalEnumDto {
    @EnumFieldDecorator(Status, 'Optional Status', {
        example: Status.ACTIVE,
        required: false,
    })
    status?: Status;
}

class OptionalNullableEnumDto {
    @EnumFieldDecorator(Status, 'Optional Nullable Status', {
        example: Status.ACTIVE,
        required: false,
        nullable: true,
    })
    status?: Status | null;
}

class RequiredEnumArrayDto {
    @EnumFieldDecorator(Status, 'Status List', {
        example: [Status.ACTIVE, Status.INACTIVE],
        required: true,
        isArray: true,
    })
    statuses: Status[];
}

class OptionalEnumArrayDto {
    @EnumFieldDecorator(Status, 'Optional Status List', {
        example: [Status.ACTIVE],
        required: false,
        isArray: true,
    })
    statuses?: Status[];
}

class OptionalNullableEnumArrayDto {
    @EnumFieldDecorator(Status, 'Optional Nullable Status List', {
        example: [Status.ACTIVE],
        required: false,
        isArray: true,
        nullable: true,
    })
    statuses?: Status[] | null;
}

describe('EnumFieldDecorator', () => {
    describe('Single Enum', () => {
        it('should fail if required enum is empty', async () => {
            const dto = plainToInstance(RequiredEnumDto, { status: '' });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isNotEmpty');
            expect(errors[0].constraints?.isNotEmpty).toContain('Status is required');
        });

        it('should fail if required enum is invalid', async () => {
            const dto = plainToInstance(RequiredEnumDto, { status: 'invalid' });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isEnum');
            expect(errors[0].constraints?.isEnum).toContain('Status must be a valid enum value');
        });

        it('should pass if required enum is valid', async () => {
            const dto = plainToInstance(RequiredEnumDto, {
                status: Status.ACTIVE,
            });
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass if optional enum is undefined', async () => {
            const dto = plainToInstance(OptionalEnumDto, {});
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail if optional enum is invalid', async () => {
            const dto = plainToInstance(OptionalEnumDto, { status: 'invalid' });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isEnum');
            expect(errors[0].constraints?.isEnum).toContain(
                'Optional Status must be a valid enum value',
            );
        });

        it('should pass if optional enum is valid', async () => {
            const dto = plainToInstance(OptionalEnumDto, {
                status: Status.INACTIVE,
            });
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass if optional nullable enum is undefined', async () => {
            const dto = plainToInstance(OptionalNullableEnumDto, {});
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass if optional nullable enum is null', async () => {
            const dto = plainToInstance(OptionalNullableEnumDto, {
                status: null,
            });
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass if optional nullable enum is valid', async () => {
            const dto = plainToInstance(OptionalNullableEnumDto, {
                status: Status.ACTIVE,
            });
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail if optional nullable enum is invalid', async () => {
            const dto = plainToInstance(OptionalNullableEnumDto, {
                status: 'invalid' as any,
            });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isEnum');
        });
    });

    describe('Enum Array', () => {
        it('should fail if required enum array is empty', async () => {
            const dto = plainToInstance(RequiredEnumArrayDto, { statuses: [] });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('arrayMinSize');
            expect(errors[0].constraints?.arrayMinSize).toContain('Status List is required');
        });

        it('should fail if required enum array is not an array', async () => {
            const dto = plainToInstance(RequiredEnumArrayDto, {
                statuses: 'invalid',
            });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isArray');
            expect(errors[0].constraints?.isArray).toContain('Status List must be an array');
        });

        it('should fail if required enum array contains invalid values', async () => {
            const dto = plainToInstance(RequiredEnumArrayDto, {
                statuses: [Status.ACTIVE, 'invalid'],
            });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isEnum');
            expect(errors[0].constraints?.isEnum).toContain(
                'Status List must contain valid enum values',
            );
        });

        it('should pass if required enum array is valid', async () => {
            const dto = plainToInstance(RequiredEnumArrayDto, {
                statuses: [Status.ACTIVE, Status.INACTIVE],
            });
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass if optional enum array is undefined', async () => {
            const dto = plainToInstance(OptionalEnumArrayDto, {});
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail if optional enum array contains invalid values', async () => {
            const dto = plainToInstance(OptionalEnumArrayDto, {
                statuses: [Status.ACTIVE, 'invalid'],
            });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isEnum');
            expect(errors[0].constraints?.isEnum).toContain(
                'Optional Status List must contain valid enum values',
            );
        });

        it('should pass if optional enum array is valid', async () => {
            const dto = plainToInstance(OptionalEnumArrayDto, {
                statuses: [Status.INACTIVE],
            });
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass if optional nullable enum array is undefined', async () => {
            const dto = plainToInstance(OptionalNullableEnumArrayDto, {});
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass if optional nullable enum array is null', async () => {
            const dto = plainToInstance(OptionalNullableEnumArrayDto, {
                statuses: null,
            });
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass if optional nullable enum array is valid', async () => {
            const dto = plainToInstance(OptionalNullableEnumArrayDto, {
                statuses: [Status.ACTIVE],
            });
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail if optional nullable enum array contains invalid values', async () => {
            const dto = plainToInstance(OptionalNullableEnumArrayDto, {
                statuses: [Status.ACTIVE, 'invalid'],
            });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isEnum');
        });
    });
});
