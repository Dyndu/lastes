import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * Decorator for boolean fields with optional/required behavior
 */
export function BooleanFieldDecorator(
    description = 'Boolean field',
    example = true,
    required = true,
) {
    return function (target: any, propertyKey: string) {
        ApiProperty({
            description,
            example,
            type: Boolean,
            required,
        })(target, propertyKey);

        if (required) IsNotEmpty({ message: `${description} is required` })(target, propertyKey);
        else IsOptional()(target, propertyKey);

        IsBoolean({ message: `${description} must be a boolean` })(target, propertyKey);
    };
}
