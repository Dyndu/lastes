import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { PaginationQueryDecorator } from './pagination-query.decorator';

jest.mock('@nestjs/common', () => ({
    applyDecorators: jest.fn((...decorators) => decorators),
}));

jest.mock('@nestjs/swagger', () => ({
    ApiQuery: jest.fn((options) => options),
}));

describe('PaginationQueryDecorator Decorator', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(PaginationQueryDecorator).toBeDefined();
    });

    it('should call applyDecorators', () => {
        PaginationQueryDecorator();

        expect(applyDecorators).toHaveBeenCalledTimes(1);
    });

    it('should create two ApiQuery decorators', () => {
        PaginationQueryDecorator();

        expect(ApiQuery).toHaveBeenCalledTimes(2);
    });

    it('should create ApiQuery for page parameter with correct configuration', () => {
        PaginationQueryDecorator();

        expect(ApiQuery).toHaveBeenNthCalledWith(1, {
            name: 'page',
            required: false,
            type: Number,
            description: 'Page number (default: 1)',
        });
    });

    it('should create ApiQuery for limit parameter with correct configuration', () => {
        PaginationQueryDecorator();

        expect(ApiQuery).toHaveBeenNthCalledWith(2, {
            name: 'limit',
            required: false,
            type: Number,
            description: 'Items per page (default: 10, max: 100)',
        });
    });

    it('should pass both ApiQuery decorators to applyDecorators', () => {
        const pageQueryConfig = {
            name: 'page',
            required: false,
            type: Number,
            description: 'Page number (default: 1)',
        };

        const limitQueryConfig = {
            name: 'limit',
            required: false,
            type: Number,
            description: 'Items per page (default: 10, max: 100)',
        };

        PaginationQueryDecorator();

        expect(applyDecorators).toHaveBeenCalledWith(pageQueryConfig, limitQueryConfig);
    });

    it('should return the result of applyDecorators', () => {
        const mockResult = ['decorator1', 'decorator2'];
        (applyDecorators as jest.Mock).mockReturnValue(mockResult);

        const result = PaginationQueryDecorator();

        expect(result).toBe(mockResult);
    });

    it('should create page query with name property', () => {
        PaginationQueryDecorator();

        const pageCall = (ApiQuery as jest.Mock).mock.calls[0][0];
        expect(pageCall.name).toBe('page');
    });

    it('should create page query with required property set to false', () => {
        PaginationQueryDecorator();

        const pageCall = (ApiQuery as jest.Mock).mock.calls[0][0];
        expect(pageCall.required).toBe(false);
    });

    it('should create page query with type property set to Number', () => {
        PaginationQueryDecorator();

        const pageCall = (ApiQuery as jest.Mock).mock.calls[0][0];
        expect(pageCall.type).toBe(Number);
    });

    it('should create page query with correct description', () => {
        PaginationQueryDecorator();

        const pageCall = (ApiQuery as jest.Mock).mock.calls[0][0];
        expect(pageCall.description).toBe('Page number (default: 1)');
    });

    it('should create limit query with name property', () => {
        PaginationQueryDecorator();

        const limitCall = (ApiQuery as jest.Mock).mock.calls[1][0];
        expect(limitCall.name).toBe('limit');
    });

    it('should create limit query with required property set to false', () => {
        PaginationQueryDecorator();

        const limitCall = (ApiQuery as jest.Mock).mock.calls[1][0];
        expect(limitCall.required).toBe(false);
    });

    it('should create limit query with type property set to Number', () => {
        PaginationQueryDecorator();

        const limitCall = (ApiQuery as jest.Mock).mock.calls[1][0];
        expect(limitCall.type).toBe(Number);
    });

    it('should create limit query with correct description', () => {
        PaginationQueryDecorator();

        const limitCall = (ApiQuery as jest.Mock).mock.calls[1][0];
        expect(limitCall.description).toBe('Items per page (default: 10, max: 100)');
    });
});
