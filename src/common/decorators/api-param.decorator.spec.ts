import { ApiParamDecorator } from './api-param.decorator';
import { applyDecorators } from '@nestjs/common';
import { ApiParam } from '../index';

jest.mock('@nestjs/common', () => ({
    applyDecorators: jest.fn(),
}));

jest.mock('../index', () => ({
    ApiParam: jest.fn(),
}));

describe('ApiParamDecorator', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(ApiParamDecorator).toBeDefined();
    });

    it('should call ApiParam with default name and example when only entities is provided', () => {
        const entity = 'User';

        ApiParamDecorator(entity);

        expect(ApiParam).toHaveBeenCalledWith({
            name: 'id',
            description: 'The id parameter of the User',
            example: '30ac88d4-7ffe-418c-9551-66eeec2e6783',
        });
    });

    it('should call ApiParam with custom name and default example', () => {
        const entity = 'Product';
        const name = 'productId';

        ApiParamDecorator(entity, name);

        expect(ApiParam).toHaveBeenCalledWith({
            name: 'productId',
            description: 'The productId parameter of the Product',
            example: '30ac88d4-7ffe-418c-9551-66eeec2e6783',
        });
    });

    it('should call ApiParam with all custom parameters', () => {
        const entity = 'Order';
        const name = 'orderId';
        const example = '12345-abcde';

        ApiParamDecorator(entity, name, example);

        expect(ApiParam).toHaveBeenCalledWith({
            name: 'orderId',
            description: 'The orderId parameter of the Order',
            example: '12345-abcde',
        });
    });

    it('should call applyDecorators with ApiParam result', () => {
        const entity = 'Customer';
        const mockApiParamResult = Symbol('apiParamResult');

        (ApiParam as jest.Mock).mockReturnValue(mockApiParamResult);

        ApiParamDecorator(entity);

        expect(applyDecorators).toHaveBeenCalledWith(mockApiParamResult);
    });

    it('should return the result of applyDecorators', () => {
        const entity = 'Invoice';
        const mockDecoratorResult = Symbol('decoratorResult');

        (applyDecorators as jest.Mock).mockReturnValue(mockDecoratorResult);

        const result = ApiParamDecorator(entity);

        expect(result).toBe(mockDecoratorResult);
    });

    it('should handle empty string entities', () => {
        const entity = '';

        ApiParamDecorator(entity);

        expect(ApiParam).toHaveBeenCalledWith({
            name: 'id',
            description: 'The id parameter of the ',
            example: '30ac88d4-7ffe-418c-9551-66eeec2e6783',
        });
    });

    it('should handle empty string name', () => {
        const entity = 'Post';
        const name = '';

        ApiParamDecorator(entity, name);

        expect(ApiParam).toHaveBeenCalledWith({
            name: '',
            description: 'The  parameter of the Post',
            example: '30ac88d4-7ffe-418c-9551-66eeec2e6783',
        });
    });

    it('should handle empty string example', () => {
        const entity = 'Comment';
        const name = 'commentId';
        const example = '';

        ApiParamDecorator(entity, name, example);

        expect(ApiParam).toHaveBeenCalledWith({
            name: 'commentId',
            description: 'The commentId parameter of the Comment',
            example: '',
        });
    });

    it('should handle numeric example', () => {
        const entity = 'Item';
        const name = 'itemId';
        const example = '123';

        ApiParamDecorator(entity, name, example);

        expect(ApiParam).toHaveBeenCalledWith({
            name: 'itemId',
            description: 'The itemId parameter of the Item',
            example: '123',
        });
    });

    it('should handle special characters in entities name', () => {
        const entity = 'User@Profile';
        const name = 'userId';

        ApiParamDecorator(entity, name);

        expect(ApiParam).toHaveBeenCalledWith({
            name: 'userId',
            description: 'The userId parameter of the User@Profile',
            example: '30ac88d4-7ffe-418c-9551-66eeec2e6783',
        });
    });

    it('should be called correctly when used as a decorator', () => {
        // Mock applyDecorators to return a proper decorator function
        (applyDecorators as jest.Mock).mockReturnValue(() => {});

        class TestController {
            @ApiParamDecorator('User', 'userId', 'abc-123')
            getUser() {
                return {};
            }
        }

        expect(ApiParam).toHaveBeenCalledWith({
            name: 'userId',
            description: 'The userId parameter of the User',
            example: 'abc-123',
        });
    });

    it('should generate correct description with different entities and name combinations', () => {
        const testCases = [
            {
                entity: 'Account',
                name: 'accountNumber',
                expected: 'The accountNumber parameter of the Account',
            },
            {
                entity: 'Transaction',
                name: 'txId',
                expected: 'The txId parameter of the Transaction',
            },
            {
                entity: 'Payment',
                name: 'paymentRef',
                expected: 'The paymentRef parameter of the Payment',
            },
        ];

        testCases.forEach(({ entity, name, expected }) => {
            jest.clearAllMocks();
            ApiParamDecorator(entity, name);

            expect(ApiParam).toHaveBeenCalledWith(
                expect.objectContaining({
                    description: expected,
                }),
            );
        });
    });

    it('should use default values when undefined is explicitly passed', () => {
        const entity = 'Category';

        ApiParamDecorator(entity, undefined, undefined);

        expect(ApiParam).toHaveBeenCalledWith({
            name: 'id',
            description: 'The id parameter of the Category',
            example: '30ac88d4-7ffe-418c-9551-66eeec2e6783',
        });
    });
});
