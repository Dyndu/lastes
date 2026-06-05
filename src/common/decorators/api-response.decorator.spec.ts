import { ApiResponseDecorator } from './api-response.decorator';
import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

jest.mock('@nestjs/common', () => ({
    applyDecorators: jest.fn(),
}));

jest.mock('@nestjs/swagger', () => ({
    ApiResponse: jest.fn(),
}));

describe('ApiResponseDecorator', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(ApiResponseDecorator).toBeDefined();
    });

    it('should call ApiResponse with correct status and description', () => {
        const statusCode = 200;
        const description = 'Success';

        ApiResponseDecorator(statusCode, description);

        expect(ApiResponse).toHaveBeenCalledWith({
            status: 200,
            description: 'Success',
        });
    });

    it('should handle 201 Created status', () => {
        const statusCode = 201;
        const description = 'Resource created successfully';

        ApiResponseDecorator(statusCode, description);

        expect(ApiResponse).toHaveBeenCalledWith({
            status: 201,
            description: 'Resource created successfully',
        });
    });

    it('should handle 400 Bad Request status', () => {
        const statusCode = 400;
        const description = 'Invalid request parameters';

        ApiResponseDecorator(statusCode, description);

        expect(ApiResponse).toHaveBeenCalledWith({
            status: 400,
            description: 'Invalid request parameters',
        });
    });

    it('should handle 401 Unauthorized status', () => {
        const statusCode = 401;
        const description = 'Unauthorized access';

        ApiResponseDecorator(statusCode, description);

        expect(ApiResponse).toHaveBeenCalledWith({
            status: 401,
            description: 'Unauthorized access',
        });
    });

    it('should handle 404 Not Found status', () => {
        const statusCode = 404;
        const description = 'Resource not found';

        ApiResponseDecorator(statusCode, description);

        expect(ApiResponse).toHaveBeenCalledWith({
            status: 404,
            description: 'Resource not found',
        });
    });

    it('should handle 500 Internal Server Error status', () => {
        const statusCode = 500;
        const description = 'Internal server error';

        ApiResponseDecorator(statusCode, description);

        expect(ApiResponse).toHaveBeenCalledWith({
            status: 500,
            description: 'Internal server error',
        });
    });

    it('should call applyDecorators with ApiResponse result', () => {
        const statusCode = 200;
        const description = 'OK';
        const mockApiResponseResult = Symbol('apiResponseResult');

        (ApiResponse as jest.Mock).mockReturnValue(mockApiResponseResult);

        ApiResponseDecorator(statusCode, description);

        expect(applyDecorators).toHaveBeenCalledWith(mockApiResponseResult);
    });

    it('should return the result of applyDecorators', () => {
        const statusCode = 204;
        const description = 'No content';
        const mockDecoratorResult = Symbol('decoratorResult');

        (applyDecorators as jest.Mock).mockReturnValue(mockDecoratorResult);

        const result = ApiResponseDecorator(statusCode, description);

        expect(result).toBe(mockDecoratorResult);
    });

    it('should handle empty description', () => {
        const statusCode = 200;
        const description = '';

        ApiResponseDecorator(statusCode, description);

        expect(ApiResponse).toHaveBeenCalledWith({
            status: 200,
            description: '',
        });
    });

    it('should handle long description', () => {
        const statusCode = 200;
        const description =
            'This is a very long description that explains in detail what this response means and when it might occur in the application flow';

        ApiResponseDecorator(statusCode, description);

        expect(ApiResponse).toHaveBeenCalledWith({
            status: 200,
            description,
        });
    });

    it('should handle special characters in description', () => {
        const statusCode = 422;
        const description = 'Validation failed: "name" is required & "email" must be valid';

        ApiResponseDecorator(statusCode, description);

        expect(ApiResponse).toHaveBeenCalledWith({
            status: 422,
            description: 'Validation failed: "name" is required & "email" must be valid',
        });
    });

    it('should handle zero status code', () => {
        const statusCode = 0;
        const description = 'Test status';

        ApiResponseDecorator(statusCode, description);

        expect(ApiResponse).toHaveBeenCalledWith({
            status: 0,
            description: 'Test status',
        });
    });

    it('should handle custom status codes', () => {
        const statusCode = 418; // I'm a teapot
        const description = "I'm a teapot";

        ApiResponseDecorator(statusCode, description);

        expect(ApiResponse).toHaveBeenCalledWith({
            status: 418,
            description: "I'm a teapot",
        });
    });

    it('should be called correctly when used as a decorator', () => {
        (applyDecorators as jest.Mock).mockReturnValue(() => {});

        class TestController {
            @ApiResponseDecorator(200, 'Successfully retrieved users')
            getUsers() {
                return [];
            }
        }

        expect(ApiResponse).toHaveBeenCalledWith({
            status: 200,
            description: 'Successfully retrieved users',
        });
    });

    it('should handle multiple decorators on same method', () => {
        (applyDecorators as jest.Mock).mockReturnValue(() => {});

        class TestController {
            @ApiResponseDecorator(200, 'Success')
            @ApiResponseDecorator(404, 'Not Found')
            @ApiResponseDecorator(500, 'Server Error')
            getUser() {
                return {};
            }
        }

        expect(ApiResponse).toHaveBeenCalledTimes(3);
        expect(ApiResponse).toHaveBeenNthCalledWith(1, {
            status: 200,
            description: 'Success',
        });
        expect(ApiResponse).toHaveBeenNthCalledWith(2, {
            status: 404,
            description: 'Not Found',
        });
        expect(ApiResponse).toHaveBeenNthCalledWith(3, {
            status: 500,
            description: 'Server Error',
        });
    });

    it('should handle description with newlines', () => {
        const statusCode = 200;
        const description = 'Line 1\nLine 2\nLine 3';

        ApiResponseDecorator(statusCode, description);

        expect(ApiResponse).toHaveBeenCalledWith({
            status: 200,
            description: 'Line 1\nLine 2\nLine 3',
        });
    });

    it('should handle various HTTP status codes', () => {
        const testCases = [
            { status: 100, description: 'Continue' },
            { status: 204, description: 'No Content' },
            { status: 301, description: 'Moved Permanently' },
            { status: 302, description: 'Found' },
            { status: 403, description: 'Forbidden' },
            { status: 409, description: 'Conflict' },
            { status: 429, description: 'Too Many Requests' },
            { status: 503, description: 'Service Unavailable' },
        ];

        testCases.forEach(({ status, description }) => {
            jest.clearAllMocks();
            ApiResponseDecorator(status, description);

            expect(ApiResponse).toHaveBeenCalledWith({
                status,
                description,
            });
        });
    });
});
