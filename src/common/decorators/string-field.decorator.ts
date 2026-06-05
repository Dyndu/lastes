import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

/**
 * A property decorator that applies validation and documentation rules for string labels,
 * including optional/required, minimum/maximum length, and Swagger API metadata.
 */
export function StringFieldDecorator(
    description = 'Label of the entities',
    example = 'Example label',
    minLength = 2,
    required = true,
    isEmail = false,
    maxLength?: number,
) {
    return function (target: any, propertyKey: string) {
        ApiProperty({ description, example, required })(target, propertyKey);

        if (required) IsNotEmpty({ message: `${description} is required` })(target, propertyKey);
        else IsOptional()(target, propertyKey);

        IsString({ message: `${description} must be a string` })(target, propertyKey);

        if (isEmail)
            IsEmail({}, { message: `${description} must be a valid email` })(target, propertyKey);
        else {
            MinLength(minLength, {
                message: `${description} must be at least ${minLength} characters long`,
            })(target, propertyKey);

            if (maxLength !== undefined)
                MaxLength(maxLength, {
                    message: `${description} must not exceed ${maxLength} characters`,
                })(target, propertyKey);
        }
    };
}
