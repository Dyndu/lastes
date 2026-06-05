import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsArray, ArrayMinSize, ValidateIf } from 'class-validator';

type EnumObject = { [key: string]: string | number };

/**
 * Decorator for enum fields with optional/required behavior
 */
export function EnumFieldDecorator<T extends EnumObject>(
    enumType: T,
    description = 'Enum field',
    options?: {
        example?: T[keyof T] | T[keyof T][];
        required?: boolean;
        isArray?: boolean;
        nullable?: boolean;
    },
) {
    const { example, required = true, isArray = false, nullable = false } = options || {};

    return function (target: any, propertyKey: string) {
        ApiProperty({
            description,
            example,
            enum: enumType,
            required,
            isArray,
            nullable,
        })(target, propertyKey);

        if (required) {
            IsNotEmpty({ message: `${description} is required` })(target, propertyKey);
            if (isArray)
                ArrayMinSize(1, { message: `${description} is required` })(target, propertyKey);
        } else IsOptional()(target, propertyKey);

        if (nullable) ValidateIf((obj) => obj[propertyKey] !== null)(target, propertyKey);

        if (isArray) {
            IsArray({ message: `${description} must be an array` })(target, propertyKey);
            IsEnum(enumType, {
                each: true,
                message: `${description} must contain valid enum values`,
            })(target, propertyKey);
        } else
            IsEnum(enumType, {
                message: `${description} must be a valid enum value`,
            })(target, propertyKey);
    };
}
