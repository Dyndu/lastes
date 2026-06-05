import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PaginationDto } from './pagination.dto';

describe('PaginationDto', () => {
    describe('Validation', () => {
        it('should pass validation with valid page and limit', async () => {
            const dto = plainToInstance(PaginationDto, {
                page: 2,
                limit: 20,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation when page and limit are not provided (optional)', async () => {
            const dto = plainToInstance(PaginationDto, {});

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail validation when page is less than 1', async () => {
            const dto = plainToInstance(PaginationDto, {
                page: 0,
                limit: 10,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('page');
            expect(errors[0].constraints).toHaveProperty('min');
        });

        it('should fail validation when page is not an integer', async () => {
            const dto = plainToInstance(PaginationDto, {
                page: 1.5,
                limit: 10,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('page');
            expect(errors[0].constraints).toHaveProperty('isInt');
        });

        it('should fail validation when limit is less than 1', async () => {
            const dto = plainToInstance(PaginationDto, {
                page: 1,
                limit: 0,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('limit');
            expect(errors[0].constraints).toHaveProperty('min');
        });

        it('should fail validation when limit is greater than 100', async () => {
            const dto = plainToInstance(PaginationDto, {
                page: 1,
                limit: 101,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('limit');
            expect(errors[0].constraints).toHaveProperty('max');
        });

        it('should fail validation when limit is not an integer', async () => {
            const dto = plainToInstance(PaginationDto, {
                page: 1,
                limit: 10.5,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('limit');
            expect(errors[0].constraints).toHaveProperty('isInt');
        });

        it('should transform string values to numbers', async () => {
            const dto = plainToInstance(PaginationDto, {
                page: '3',
                limit: '25',
            });

            expect(dto.page).toBe(3);
            expect(dto.limit).toBe(25);
            expect(typeof dto.page).toBe('number');
            expect(typeof dto.limit).toBe('number');
        });
    });

    describe('getPage()', () => {
        it('should return the page value when provided', () => {
            const dto = plainToInstance(PaginationDto, { page: 5 });
            expect(dto.getPage()).toBe(5);
        });

        it('should return default value 1 when page is undefined', () => {
            const dto = plainToInstance(PaginationDto, {});
            expect(dto.getPage()).toBe(1);
        });

        it('should return default value 1 when page is null', () => {
            const dto = new PaginationDto();
            dto.page = null as any;
            expect(dto.getPage()).toBe(1);
        });
    });

    describe('getLimit()', () => {
        it('should return the limit value when provided', () => {
            const dto = plainToInstance(PaginationDto, { limit: 50 });
            expect(dto.getLimit()).toBe(50);
        });

        it('should return default value 10 when limit is undefined', () => {
            const dto = plainToInstance(PaginationDto, {});
            expect(dto.getLimit()).toBe(10);
        });

        it('should return default value 10 when limit is null', () => {
            const dto = new PaginationDto();
            dto.limit = null as any;
            expect(dto.getLimit()).toBe(10);
        });
    });

    describe('Default values', () => {
        it('should have default values when instantiated directly', () => {
            const dto = new PaginationDto();
            expect(dto.page).toBe(1);
            expect(dto.limit).toBe(10);
        });
    });
});
