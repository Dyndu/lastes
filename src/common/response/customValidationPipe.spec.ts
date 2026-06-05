import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { IsString, IsInt, Min } from 'class-validator';
import { CustomValidationPipe } from './customValidationPipe';

class TestDto {
    @IsString()
    name: string;

    @IsInt()
    @Min(1)
    age: number;
}

describe('CustomValidationPipe', () => {
    let pipe: CustomValidationPipe;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [CustomValidationPipe],
        }).compile();

        pipe = module.get<CustomValidationPipe>(CustomValidationPipe);
    });

    it('should be defined', () => {
        expect(pipe).toBeDefined();
    });

    it('should transform and allow valid object', async () => {
        const validObj = { name: 'John', age: 25 };
        const transformed = await pipe.transform(validObj, {
            type: 'body',
            metatype: TestDto,
        });
        expect(transformed).toEqual(validObj);
    });

    it('should throw BadRequestException on invalid object', async () => {
        const invalidObj = { name: 123, age: 0 };

        try {
            await pipe.transform(invalidObj, {
                type: 'body',
                metatype: TestDto,
            });
            fail('Expected BadRequestException to be thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(BadRequestException);
            const response = err.getResponse();
            expect(response).toHaveProperty('message', 'Validation failed');
            expect(response.errors).toHaveProperty('name');
            expect(response.errors).toHaveProperty('age');
            expect(response.errors.name).toContain('string');
            expect(response.errors.age).toContain('not be less than 1');
        }
    });

    it('should remove extra properties (whitelist)', async () => {
        const obj = { name: 'John', age: 30, extra: 'remove me' };
        const transformed = await pipe.transform(obj, {
            type: 'body',
            metatype: TestDto,
        });

        expect(transformed).toEqual({ name: 'John', age: 30 });
        expect(transformed).not.toHaveProperty('extra');
    });
});
