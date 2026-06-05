import { ApiOperationDecorator } from './api-operation.decorator';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '../index';

jest.mock('@nestjs/common', () => ({
    applyDecorators: jest.fn(),
}));

jest.mock('../index', () => ({
    ApiOperation: jest.fn(),
}));

describe('ApiOperationDecorator', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(ApiOperationDecorator).toBeDefined();
    });

    it('should call ApiOperation with correct summary and description', () => {
        const summary = 'Test Summary';
        const description = 'Test Description';

        ApiOperationDecorator(summary, description);

        expect(ApiOperation).toHaveBeenCalledWith({
            summary,
            description,
        });
    });

    it('should call applyDecorators with ApiOperation result', () => {
        const summary = 'Another Summary';
        const description = 'Another Description';
        const mockApiOperationResult = Symbol('apiOperationResult');

        (ApiOperation as jest.Mock).mockReturnValue(mockApiOperationResult);

        ApiOperationDecorator(summary, description);

        expect(applyDecorators).toHaveBeenCalledWith(mockApiOperationResult);
    });

    it('should return the result of applyDecorators', () => {
        const summary = 'Return Test';
        const description = 'Return Description';
        const mockDecoratorResult = Symbol('decoratorResult');

        (applyDecorators as jest.Mock).mockReturnValue(mockDecoratorResult);

        const result = ApiOperationDecorator(summary, description);

        expect(result).toBe(mockDecoratorResult);
    });

    it('should handle empty strings', () => {
        const summary = '';
        const description = '';

        ApiOperationDecorator(summary, description);

        expect(ApiOperation).toHaveBeenCalledWith({
            summary: '',
            description: '',
        });
    });

    it('should handle special characters in summary and description', () => {
        const summary = 'Test @#$ Summary';
        const description = 'Test "Description" with <special> chars';

        ApiOperationDecorator(summary, description);

        expect(ApiOperation).toHaveBeenCalledWith({
            summary,
            description,
        });
    });

    it('should handle very long strings', () => {
        const summary = 'A'.repeat(1000);
        const description = 'B'.repeat(2000);

        ApiOperationDecorator(summary, description);

        expect(ApiOperation).toHaveBeenCalledWith({
            summary,
            description,
        });
    });

    it('should be called correctly when used as a decorator', () => {
        (applyDecorators as jest.Mock).mockReturnValue(() => {});

        class TestController {
            @ApiOperationDecorator('Get Users', 'Retrieves all users')
            getUsers() {
                return [];
            }
        }

        expect(ApiOperation).toHaveBeenCalledWith({
            summary: 'Get Users',
            description: 'Retrieves all users',
        });
    });
});
