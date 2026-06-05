import { LogData } from './log-data.interface';

describe('LogData Interface', () => {
    it('should create a valid LogData object with required fields', () => {
        const logData: LogData = {
            message: 'Request successful',
            method: 'GET',
            url: '/api/users',
            statusCode: 200,
            responseTime: 145,
        };

        expect(logData.message).toBe('Request successful');
        expect(logData.method).toBe('GET');
        expect(logData.url).toBe('/api/users');
        expect(logData.statusCode).toBe(200);
        expect(logData.responseTime).toBe(145);
        expect(logData.body).toBeUndefined();
    });

    it('should create a valid LogData object with optional body', () => {
        const logData: LogData = {
            message: 'User created',
            method: 'POST',
            url: '/api/users',
            statusCode: 201,
            responseTime: 230,
            body: { id: 1, name: 'John Doe', email: 'john@example.com' },
        };

        expect(logData.body).toBeDefined();
        expect(logData.body).toEqual({
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
        });
    });

    it('should handle different HTTP methods', () => {
        const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

        methods.forEach((method) => {
            const logData: LogData = {
                message: `${method} request`,
                method,
                url: '/api/resource',
                statusCode: 200,
                responseTime: 100,
            };

            expect(logData.method).toBe(method);
        });
    });

    it('should handle error status codes', () => {
        const logData: LogData = {
            message: 'Not found',
            method: 'GET',
            url: '/api/users/999',
            statusCode: 404,
            responseTime: 50,
        };

        expect(logData.statusCode).toBe(404);
        expect(logData.message).toBe('Not found');
    });

    it('should handle body as array', () => {
        const logData: LogData = {
            message: 'Users list retrieved',
            method: 'GET',
            url: '/api/users',
            statusCode: 200,
            responseTime: 180,
            body: [
                { id: 1, name: 'User 1' },
                { id: 2, name: 'User 2' },
            ],
        };

        expect(Array.isArray(logData.body)).toBe(true);
        expect((logData.body as any[]).length).toBe(2);
    });

    it('should handle body as null', () => {
        const logData: LogData = {
            message: 'No content',
            method: 'DELETE',
            url: '/api/users/1',
            statusCode: 204,
            responseTime: 75,
            body: null,
        };

        expect(logData.body).toBeNull();
    });

    it('should handle various response times', () => {
        const logDataFast: LogData = {
            message: 'Fast response',
            method: 'GET',
            url: '/api/health',
            statusCode: 200,
            responseTime: 5,
        };

        const logDataSlow: LogData = {
            message: 'Slow response',
            method: 'POST',
            url: '/api/heavy-operation',
            statusCode: 200,
            responseTime: 5000,
        };

        expect(logDataFast.responseTime).toBeLessThan(100);
        expect(logDataSlow.responseTime).toBeGreaterThan(1000);
    });

    it('should handle complex nested body objects', () => {
        const logData: LogData = {
            message: 'Complex data logged',
            method: 'POST',
            url: '/api/orders',
            statusCode: 201,
            responseTime: 340,
            body: {
                order: {
                    id: 123,
                    items: [
                        { productId: 1, quantity: 2, price: 29.99 },
                        { productId: 2, quantity: 1, price: 49.99 },
                    ],
                    customer: {
                        id: 456,
                        name: 'Jane Doe',
                        address: {
                            street: '123 Main St',
                            city: 'Paris',
                            country: 'France',
                        },
                    },
                },
            },
        };

        expect(logData.body).toBeDefined();
        expect((logData.body as any).order.items).toHaveLength(2);
    });
});
