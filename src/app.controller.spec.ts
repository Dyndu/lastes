import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
    let appController: AppController;
    let appService: AppService;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [AppController],
            providers: [AppService],
        }).compile();

        appController = app.get<AppController>(AppController);
        appService = app.get<AppService>(AppService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Controller definition', () => {
        it('should be defined', () => {
            expect(appController).toBeDefined();
        });

        it('should be instance of AppController', () => {
            expect(appController).toBeInstanceOf(AppController);
        });
    });

    describe('Dependencies', () => {
        it('should have appService injected', () => {
            expect(appService).toBeDefined();
            expect(appService).toBeInstanceOf(AppService);
        });

        it('should use the same AppService instance', () => {
            const controllerService = appController['appService'];
            expect(controllerService).toBe(appService);
        });
    });

    describe('getHello', () => {
        it('should return "Hello World!" by default', () => {
            const expected = 'Hello World!';
            const result = appController.getHello();

            expect(result).toBe(expected);
        });

        it('should return a string', () => {
            const result = appController.getHello();
            expect(typeof result).toBe('string');
        });

        it('should call appService.getHello exactly once', () => {
            const getHelloSpy = jest.spyOn(appService, 'getHello');

            appController.getHello();

            expect(getHelloSpy).toHaveBeenCalledTimes(1);
            expect(getHelloSpy).toHaveBeenCalledWith();
        });

        it('should return whatever appService.getHello returns', () => {
            // Arrange
            const mockResponses = ['Mocked Hello', 'Custom Message', 'Another Response', '', '123'];

            mockResponses.forEach((mockResponse) => {
                jest.spyOn(appService, 'getHello').mockReturnValue(mockResponse);

                // Act
                const result = appController.getHello();

                // Assert
                expect(result).toBe(mockResponse);
            });
        });

        it('should handle empty string response', () => {
            jest.spyOn(appService, 'getHello').mockReturnValue('');
            expect(appController.getHello()).toBe('');
        });

        it('should handle special characters in response', () => {
            const specialMessage = 'Hello @#$%^&*()';
            jest.spyOn(appService, 'getHello').mockReturnValue(specialMessage);
            expect(appController.getHello()).toBe(specialMessage);
        });
    });

    describe('ping', () => {
        it('should return "pong"', () => {
            expect(appController.ping()).toBe('pong');
        });

        it('should always return "pong"', () => {
            const results = [
                appController.ping(),
                appController.ping(),
                appController.ping(),
                appController.ping(),
                appController.ping(),
            ];

            results.forEach((result) => {
                expect(result).toBe('pong');
            });

            expect(results.every((r) => r === 'pong')).toBe(true);
        });

        it('should return a string', () => {
            expect(typeof appController.ping()).toBe('string');
        });

        it('should return exactly 4 characters', () => {
            expect(appController.ping().length).toBe(4);
        });

        it('should not call appService.getHello', () => {
            const spy = jest.spyOn(appService, 'getHello');
            appController.ping();
            expect(spy).not.toHaveBeenCalled();
        });

        it('should work independently of appService', () => {
            jest.spyOn(appService, 'getHello').mockImplementation(() => {
                throw new Error('Service broken');
            });

            expect(() => appController.ping()).not.toThrow();
            expect(appController.ping()).toBe('pong');
        });

        it('should have consistent response time', () => {
            const start = Date.now();
            appController.ping();
            const end = Date.now();
            const duration = end - start;

            expect(duration).toBeLessThan(100);
        });
    });

    describe('Route handling', () => {
        it('should have both routes defined', () => {
            const controllerPrototype = Object.getPrototypeOf(appController);
            const routeMethods = ['getHello', 'ping'];

            routeMethods.forEach((method) => {
                expect(typeof controllerPrototype[method]).toBe('function');
            });
        });

        it('should handle multiple consecutive calls', () => {
            const results = [
                appController.getHello(),
                appController.ping(),
                appController.getHello(),
                appController.ping(),
            ];

            expect(results).toEqual(['Hello World!', 'pong', 'Hello World!', 'pong']);
        });
    });

    describe('Error scenarios', () => {
        it('should handle appService.getHello throwing error', () => {
            jest.spyOn(appService, 'getHello').mockImplementation(() => {
                throw new Error('Service error');
            });

            expect(() => appController.getHello()).toThrow('Service error');
        });

        it('should not affect ping when getHello fails', () => {
            jest.spyOn(appService, 'getHello').mockImplementation(() => {
                throw new Error('Service error');
            });

            expect(() => appController.getHello()).toThrow();

            expect(appController.ping()).toBe('pong');
        });
    });

    describe('Type checking', () => {
        it('should return strings for both methods', () => {
            expect(typeof appController.getHello()).toBe('string');
            expect(typeof appController.ping()).toBe('string');
        });

        it('should not return null or undefined', () => {
            expect(appController.getHello()).not.toBeNull();
            expect(appController.getHello()).not.toBeUndefined();
            expect(appController.ping()).not.toBeNull();
            expect(appController.ping()).not.toBeUndefined();
        });
    });
});
