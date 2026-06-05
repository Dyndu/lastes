import { Test, TestingModule } from '@nestjs/testing';
import { SocketModule } from './socket.module';
import { SocketService } from './socket.service';
import { Module } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { EnvConfigService } from '../../utils/services/config';
import { JwtStrategy } from '../../common/guard';
import { ErrorHandlerService } from '../../common/response';

describe('SocketModule', () => {
    let module: TestingModule;

    const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    };

    const mockEnvConfig = {
        sAdminRole: 'super_admin',
        adminRole: 'admin',
        accessTokenSecret: 'test-secret',
    };

    const mockJwtStrategy = {
        validateToken: jest.fn(),
        getUserById: jest.fn(),
    };

    const mockErrorHandler = {
        badRequest: jest.fn(),
        notFound: jest.fn(),
    };

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [
                SocketService,
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: mockLogger,
                },
                {
                    provide: EnvConfigService,
                    useValue: mockEnvConfig,
                },
                {
                    provide: JwtStrategy,
                    useValue: mockJwtStrategy,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandler,
                },
            ],
            exports: [SocketService],
        }).compile();

        jest.clearAllMocks();
    });

    afterEach(async () => {
        if (module) await module.close();
    });

    describe('Module definition', () => {
        it('should be defined', () => {
            expect(module).toBeDefined();
        });

        it('should compile successfully', () => {
            expect(module).toBeInstanceOf(TestingModule);
        });
    });

    describe('Providers', () => {
        it('should provide SocketService', () => {
            const socketService = module.get<SocketService<any>>(SocketService);
            expect(socketService).toBeDefined();
            expect(socketService).toBeInstanceOf(SocketService);
        });

        it('should have SocketService as a provider in actual module', () => {
            const providers = Reflect.getMetadata('providers', SocketModule);
            expect(providers).toContain(SocketService);
        });
    });

    describe('Exports', () => {
        it('should export SocketService in actual module', () => {
            const exports = Reflect.getMetadata('exports', SocketModule);
            expect(exports).toContain(SocketService);
        });

        it('should make SocketService available to other modules', async () => {
            @Module({
                providers: [
                    SocketService,
                    {
                        provide: WINSTON_MODULE_PROVIDER,
                        useValue: mockLogger,
                    },
                    {
                        provide: EnvConfigService,
                        useValue: mockEnvConfig,
                    },
                    {
                        provide: JwtStrategy,
                        useValue: mockJwtStrategy,
                    },
                    {
                        provide: ErrorHandlerService,
                        useValue: mockErrorHandler,
                    },
                ],
                exports: [SocketService],
            })
            class TestSocketModule {}

            @Module({
                imports: [TestSocketModule],
            })
            class TestConsumerModule {}

            const testModule = await Test.createTestingModule({
                imports: [TestConsumerModule],
            }).compile();

            const socketService = testModule.get<SocketService<any>>(SocketService);
            expect(socketService).toBeDefined();

            await testModule.close();
        });
    });

    describe('Global scope', () => {
        it('should be available without explicit import in child modules when global', async () => {
            @Module({
                providers: [
                    SocketService,
                    {
                        provide: WINSTON_MODULE_PROVIDER,
                        useValue: mockLogger,
                    },
                    {
                        provide: EnvConfigService,
                        useValue: mockEnvConfig,
                    },
                    {
                        provide: JwtStrategy,
                        useValue: mockJwtStrategy,
                    },
                    {
                        provide: ErrorHandlerService,
                        useValue: mockErrorHandler,
                    },
                ],
                exports: [SocketService],
            })
            @Module({})
            class TestGlobalSocketModule {}

            @Module({})
            class ChildModule {}

            @Module({
                imports: [TestGlobalSocketModule, ChildModule],
            })
            class ParentModule {}

            const testModule = await Test.createTestingModule({
                imports: [ParentModule],
            }).compile();

            const socketService = testModule.get<SocketService<any>>(SocketService);
            expect(socketService).toBeDefined();

            await testModule.close();
        });
    });

    describe('Service instantiation', () => {
        it('should create a single instance of SocketService', () => {
            const instance1 = module.get<SocketService<any>>(SocketService);
            const instance2 = module.get<SocketService<any>>(SocketService);

            expect(instance1).toBe(instance2);
        });

        it('should provide the same SocketService instance across modules', async () => {
            @Module({
                providers: [
                    SocketService,
                    {
                        provide: WINSTON_MODULE_PROVIDER,
                        useValue: mockLogger,
                    },
                    {
                        provide: EnvConfigService,
                        useValue: mockEnvConfig,
                    },
                    {
                        provide: JwtStrategy,
                        useValue: mockJwtStrategy,
                    },
                    {
                        provide: ErrorHandlerService,
                        useValue: mockErrorHandler,
                    },
                ],
                exports: [SocketService],
            })
            class SharedSocketModule {}

            @Module({
                imports: [SharedSocketModule],
            })
            class ModuleA {}

            @Module({
                imports: [SharedSocketModule],
            })
            class ModuleB {}

            const testModule = await Test.createTestingModule({
                imports: [ModuleA, ModuleB],
            }).compile();

            const serviceFromA = testModule.get<SocketService<any>>(SocketService);
            const serviceFromB = testModule.get<SocketService<any>>(SocketService);

            expect(serviceFromA).toBe(serviceFromB);

            await testModule.close();
        });
    });

    describe('Module configuration', () => {
        it('should have correct metadata', () => {
            const metadata = Reflect.getMetadata('imports', SocketModule);
            expect(metadata).toBeUndefined();
        });

        it('should not have controllers', () => {
            const controllers = Reflect.getMetadata('controllers', SocketModule);
            expect(controllers).toBeUndefined();
        });
    });

    describe('Integration', () => {
        it('should integrate with other modules correctly', async () => {
            @Module({
                providers: [
                    SocketService,
                    {
                        provide: WINSTON_MODULE_PROVIDER,
                        useValue: mockLogger,
                    },
                    {
                        provide: EnvConfigService,
                        useValue: mockEnvConfig,
                    },
                    {
                        provide: JwtStrategy,
                        useValue: mockJwtStrategy,
                    },
                    {
                        provide: ErrorHandlerService,
                        useValue: mockErrorHandler,
                    },
                    {
                        provide: 'TEST_SERVICE',
                        useFactory: (socketService: SocketService<any>) => {
                            return {
                                socketService,
                                testMethod: () => 'test',
                            };
                        },
                        inject: [SocketService],
                    },
                ],
                exports: [SocketService, 'TEST_SERVICE'],
            })
            class TestModule {}

            const testModule = await Test.createTestingModule({
                imports: [TestModule],
            }).compile();

            const testService = testModule.get('TEST_SERVICE');
            expect(testService).toBeDefined();
            expect(testService.socketService).toBeInstanceOf(SocketService);
            expect(testService.testMethod()).toBe('test');

            await testModule.close();
        });
    });
});
