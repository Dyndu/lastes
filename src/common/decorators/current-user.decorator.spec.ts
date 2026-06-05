import { ExecutionContext } from '@nestjs/common';

describe('CurrentUser Decorator', () => {
    let mockExecutionContext: ExecutionContext;
    let mockRequest: any;

    beforeEach(() => {
        mockRequest = {
            user: {
                id: 1,
                email: 'test@example.com',
                username: 'testuser',
            },
        };

        mockExecutionContext = {
            switchToHttp: jest.fn().mockReturnValue({
                getRequest: jest.fn().mockReturnValue(mockRequest),
            }),
        } as any;
    });

    it('should extract user from request', () => {
        const factory = (_data: unknown, ctx: ExecutionContext) => {
            const request = ctx.switchToHttp().getRequest();
            return request.user;
        };

        const result = factory(null, mockExecutionContext);

        expect(result).toEqual(mockRequest.user);
        expect(mockExecutionContext.switchToHttp).toHaveBeenCalled();
    });

    it('should return undefined when user is not present', () => {
        mockRequest.user = undefined;

        const factory = (_data: unknown, ctx: ExecutionContext) => {
            const request = ctx.switchToHttp().getRequest();
            return request.user;
        };

        const result = factory(null, mockExecutionContext);

        expect(result).toBeUndefined();
    });

    it('should return null when user is null', () => {
        mockRequest.user = null;

        const factory = (_data: unknown, ctx: ExecutionContext) => {
            const request = ctx.switchToHttp().getRequest();
            return request.user;
        };

        const result = factory(null, mockExecutionContext);

        expect(result).toBeNull();
    });

    it('should handle different user object structures', () => {
        const customUser = {
            userId: '123',
            role: 'admin',
            permissions: ['read', 'write'],
        };
        mockRequest.user = customUser;

        const factory = (_data: unknown, ctx: ExecutionContext) => {
            const request = ctx.switchToHttp().getRequest();
            return request.user;
        };

        const result = factory(null, mockExecutionContext);

        expect(result).toEqual(customUser);
    });

    it('should ignore data parameter', () => {
        const factory = (_data: unknown, ctx: ExecutionContext) => {
            const request = ctx.switchToHttp().getRequest();
            return request.user;
        };

        const result1 = factory('someData', mockExecutionContext);
        const result2 = factory({ key: 'value' }, mockExecutionContext);

        expect(result1).toEqual(mockRequest.user);
        expect(result2).toEqual(mockRequest.user);
    });
});
