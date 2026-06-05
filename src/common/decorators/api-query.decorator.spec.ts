import { ApiQueryDecorator } from './api-query.decorator';
import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { QueryParamConfigInterface } from '../../interface';

jest.mock('@nestjs/common', () => ({
    applyDecorators: jest.fn(),
}));

jest.mock('@nestjs/swagger', () => ({
    ApiQuery: jest.fn(),
}));

describe('ApiQueryDecorator', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (ApiQuery as jest.Mock).mockImplementation((config) => config);
    });

    it('should be defined', () => {
        expect(ApiQueryDecorator).toBeDefined();
    });

    describe('Single parameter', () => {
        it('should handle a single query parameter with minimal config', () => {
            const param: QueryParamConfigInterface = {
                name: 'search',
                description: 'Search term',
            };

            ApiQueryDecorator(param);

            expect(ApiQuery).toHaveBeenCalledWith({
                name: 'search',
                required: false,
                description: 'Search term',
            });
            expect(ApiQuery).toHaveBeenCalledTimes(1);
        });

        it('should set required to true when specified', () => {
            const param: QueryParamConfigInterface = {
                name: 'userId',
                description: 'User ID',
                required: true,
            };

            ApiQueryDecorator(param);

            expect(ApiQuery).toHaveBeenCalledWith({
                name: 'userId',
                required: true,
                description: 'User ID',
            });
        });

        it('should set required to false when explicitly specified', () => {
            const param: QueryParamConfigInterface = {
                name: 'filter',
                description: 'Filter options',
                required: false,
            };

            ApiQueryDecorator(param);

            expect(ApiQuery).toHaveBeenCalledWith({
                name: 'filter',
                required: false,
                description: 'Filter options',
            });
        });

        it('should handle enum type', () => {
            enum Status {
                ACTIVE = 'active',
                INACTIVE = 'inactive',
            }

            const param: QueryParamConfigInterface = {
                name: 'status',
                description: 'Status filter',
                enum: Status,
            };

            ApiQueryDecorator(param);

            expect(ApiQuery).toHaveBeenCalledWith({
                name: 'status',
                required: false,
                description: 'Status filter',
                enum: Status,
            });
        });

        it('should handle string type', () => {
            const param: QueryParamConfigInterface = {
                name: 'name',
                description: 'Name parameter',
                type: 'string',
            };

            ApiQueryDecorator(param);

            expect(ApiQuery).toHaveBeenCalledWith({
                name: 'name',
                required: false,
                description: 'Name parameter',
                type: String,
            });
        });

        it('should handle number type', () => {
            const param: QueryParamConfigInterface = {
                name: 'age',
                description: 'Age parameter',
                type: 'number',
            };

            ApiQueryDecorator(param);

            expect(ApiQuery).toHaveBeenCalledWith({
                name: 'age',
                required: false,
                description: 'Age parameter',
                type: Number,
            });
        });

        it('should handle boolean type', () => {
            const param: QueryParamConfigInterface = {
                name: 'isActive',
                description: 'Active status',
                type: 'boolean',
            };

            ApiQueryDecorator(param);

            expect(ApiQuery).toHaveBeenCalledWith({
                name: 'isActive',
                required: false,
                description: 'Active status',
                type: Boolean,
            });
        });

        it('should handle isArray flag', () => {
            const param: QueryParamConfigInterface = {
                name: 'tags',
                description: 'Tags array',
                type: 'string',
                isArray: true,
            };

            ApiQueryDecorator(param);

            expect(ApiQuery).toHaveBeenCalledWith({
                name: 'tags',
                required: false,
                description: 'Tags array',
                type: String,
                isArray: true,
            });
        });

        it('should prioritize enum over type', () => {
            enum Priority {
                LOW = 'low',
                HIGH = 'high',
            }

            const param: QueryParamConfigInterface = {
                name: 'priority',
                description: 'Priority level',
                type: 'string',
                enum: Priority,
            };

            ApiQueryDecorator(param);

            expect(ApiQuery).toHaveBeenCalledWith({
                name: 'priority',
                required: false,
                description: 'Priority level',
                enum: Priority,
            });
        });

        it('should handle isArray without type', () => {
            const param: QueryParamConfigInterface = {
                name: 'ids',
                description: 'ID array',
                isArray: true,
            };

            ApiQueryDecorator(param);

            expect(ApiQuery).toHaveBeenCalledWith({
                name: 'ids',
                required: false,
                description: 'ID array',
                isArray: true,
            });
        });

        it('should handle enum with isArray', () => {
            enum Role {
                ADMIN = 'admin',
                USER = 'user',
            }

            const param: QueryParamConfigInterface = {
                name: 'roles',
                description: 'User roles',
                enum: Role,
                isArray: true,
            };

            ApiQueryDecorator(param);

            expect(ApiQuery).toHaveBeenCalledWith({
                name: 'roles',
                required: false,
                description: 'User roles',
                enum: Role,
                isArray: true,
            });
        });
    });

    describe('Multiple parameters', () => {
        it('should handle array of query parameters', () => {
            const params: QueryParamConfigInterface[] = [
                {
                    name: 'page',
                    description: 'Page number',
                    type: 'number',
                },
                {
                    name: 'limit',
                    description: 'Items per page',
                    type: 'number',
                },
            ];

            ApiQueryDecorator(params);

            expect(ApiQuery).toHaveBeenCalledTimes(2);
            expect(ApiQuery).toHaveBeenNthCalledWith(1, {
                name: 'page',
                required: false,
                description: 'Page number',
                type: Number,
            });
            expect(ApiQuery).toHaveBeenNthCalledWith(2, {
                name: 'limit',
                required: false,
                description: 'Items per page',
                type: Number,
            });
        });

        it('should handle mixed types in array', () => {
            const params: QueryParamConfigInterface[] = [
                {
                    name: 'search',
                    description: 'Search term',
                    type: 'string',
                    required: true,
                },
                {
                    name: 'page',
                    description: 'Page number',
                    type: 'number',
                },
                {
                    name: 'includeDeleted',
                    description: 'Include deleted items',
                    type: 'boolean',
                },
            ];

            ApiQueryDecorator(params);

            expect(ApiQuery).toHaveBeenCalledTimes(3);
            expect(ApiQuery).toHaveBeenNthCalledWith(1, {
                name: 'search',
                required: true,
                description: 'Search term',
                type: String,
            });
            expect(ApiQuery).toHaveBeenNthCalledWith(2, {
                name: 'page',
                required: false,
                description: 'Page number',
                type: Number,
            });
            expect(ApiQuery).toHaveBeenNthCalledWith(3, {
                name: 'includeDeleted',
                required: false,
                description: 'Include deleted items',
                type: Boolean,
            });
        });

        it('should handle array with enums and arrays', () => {
            enum SortOrder {
                ASC = 'asc',
                DESC = 'desc',
            }

            const params: QueryParamConfigInterface[] = [
                {
                    name: 'sortBy',
                    description: 'Sort field',
                    type: 'string',
                },
                {
                    name: 'order',
                    description: 'Sort order',
                    enum: SortOrder,
                },
                {
                    name: 'tags',
                    description: 'Filter tags',
                    type: 'string',
                    isArray: true,
                },
            ];

            ApiQueryDecorator(params);

            expect(ApiQuery).toHaveBeenCalledTimes(3);
            expect(ApiQuery).toHaveBeenNthCalledWith(2, {
                name: 'order',
                required: false,
                description: 'Sort order',
                enum: SortOrder,
            });
            expect(ApiQuery).toHaveBeenNthCalledWith(3, {
                name: 'tags',
                required: false,
                description: 'Filter tags',
                type: String,
                isArray: true,
            });
        });
    });

    describe('applyDecorators integration', () => {
        it('should call applyDecorators with single decorator', () => {
            const param: QueryParamConfigInterface = {
                name: 'test',
                description: 'Test param',
            };

            const mockQueryResult = Symbol('queryResult');
            (ApiQuery as jest.Mock).mockReturnValue(mockQueryResult);

            ApiQueryDecorator(param);

            expect(applyDecorators).toHaveBeenCalledWith(mockQueryResult);
        });

        it('should call applyDecorators with multiple decorators', () => {
            const params: QueryParamConfigInterface[] = [
                { name: 'param1', description: 'First param' },
                { name: 'param2', description: 'Second param' },
            ];

            const mockResult1 = Symbol('result1');
            const mockResult2 = Symbol('result2');
            (ApiQuery as jest.Mock)
                .mockReturnValueOnce(mockResult1)
                .mockReturnValueOnce(mockResult2);

            ApiQueryDecorator(params);

            expect(applyDecorators).toHaveBeenCalledWith(mockResult1, mockResult2);
        });

        it('should return the result of applyDecorators', () => {
            const param: QueryParamConfigInterface = {
                name: 'return',
                description: 'Return test',
            };

            const mockDecoratorResult = Symbol('decoratorResult');
            (applyDecorators as jest.Mock).mockReturnValue(mockDecoratorResult);

            const result = ApiQueryDecorator(param);

            expect(result).toBe(mockDecoratorResult);
        });
    });

    describe('Edge cases', () => {
        it('should handle empty description', () => {
            const param: QueryParamConfigInterface = {
                name: 'empty',
                description: '',
            };

            ApiQueryDecorator(param);

            expect(ApiQuery).toHaveBeenCalledWith({
                name: 'empty',
                required: false,
                description: '',
            });
        });

        it('should handle parameter without type or enum', () => {
            const param: QueryParamConfigInterface = {
                name: 'noType',
                description: 'No type specified',
            };

            ApiQueryDecorator(param);

            expect(ApiQuery).toHaveBeenCalledWith({
                name: 'noType',
                required: false,
                description: 'No type specified',
            });
        });

        it('should be usable as a decorator', () => {
            (applyDecorators as jest.Mock).mockReturnValue(() => {});

            class TestController {
                @ApiQueryDecorator({
                    name: 'search',
                    description: 'Search query',
                    type: 'string',
                })
                search() {
                    return [];
                }
            }

            expect(ApiQuery).toHaveBeenCalledWith({
                name: 'search',
                required: false,
                description: 'Search query',
                type: String,
            });
        });

        it('should handle all parameters combined', () => {
            enum Status {
                ACTIVE = 'active',
            }

            const param: QueryParamConfigInterface = {
                name: 'status',
                description: 'Status filter',
                required: true,
                enum: Status,
                isArray: true,
            };

            ApiQueryDecorator(param);

            expect(ApiQuery).toHaveBeenCalledWith({
                name: 'status',
                required: true,
                description: 'Status filter',
                enum: Status,
                isArray: true,
            });
        });
    });
});
