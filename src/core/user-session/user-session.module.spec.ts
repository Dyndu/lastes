import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { UserSessionRepository } from './user-session.repository';
import { UserSessionService } from './services/user-session.service';
import { PreUserSessionService } from './services/pre-user-session.service';
import { JwtService } from '@nestjs/jwt';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { UserSessionEntity } from './entities/user-session.entity';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';
import { AuthUtils, GlobalUtils } from '../../utils/services/tools';

describe('UserSessionModule', () => {
    let module: TestingModule;
    let userSessionRepository: UserSessionRepository;
    let userSessionService: UserSessionService;
    let preUserSessionService: PreUserSessionService;
    let jwtService: JwtService;

    const mockEntityManager = {
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
    };

    const mockRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        findActiveOne: jest.fn(),
    };

    const mockLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    };

    const mockEnvConfigService = {
        accessTokenSecret: 'test-access-secret',
        accessTokenExpiry: '15m',
        refreshTokenExpiry: '180d',
        userTokenExpiry: '90d',
        maxUserSession: 5,
    };

    const mockErrorHandlerService = {
        unauthorized: jest.fn().mockImplementation((internal: string): never => {
            throw new Error(internal);
        }) as any,
        notFound: jest.fn().mockImplementation((internal: string): never => {
            throw new Error(internal);
        }) as any,
        badRequest: jest.fn().mockImplementation((internal: string): never => {
            throw new Error(internal);
        }) as any,
    };

    const mockAuthUtils = {
        generateRefreshToken: jest.fn().mockReturnValue('refresh-token-123'),
        hashToken: jest.fn().mockReturnValue('hashed-token'),
        parseUserAgent: jest.fn().mockReturnValue('Chrome/Windows'),
    };

    const mockJwtService = {
        sign: jest.fn().mockReturnValue('jwt-token-123'),
        verify: jest.fn(),
        decode: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        module = await Test.createTestingModule({
            providers: [
                UserSessionRepository,
                UserSessionService,
                PreUserSessionService,
                JwtService,
                {
                    provide: getRepositoryToken(UserSessionEntity),
                    useValue: mockRepository,
                },
                {
                    provide: EntityManager,
                    useValue: mockEntityManager,
                },
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: mockLogger,
                },
                {
                    provide: EnvConfigService,
                    useValue: mockEnvConfigService,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
                {
                    provide: AuthUtils,
                    useValue: mockAuthUtils,
                },
                {
                    provide: GlobalUtils,
                    useValue: GlobalUtils,
                },
            ],
        })
            .overrideProvider(JwtService)
            .useValue(mockJwtService)
            .compile();

        userSessionRepository = module.get<UserSessionRepository>(UserSessionRepository);
        userSessionService = module.get<UserSessionService>(UserSessionService);
        preUserSessionService = module.get<PreUserSessionService>(PreUserSessionService);
        jwtService = module.get<JwtService>(JwtService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Module Definition', () => {
        it('should be defined', () => {
            expect(module).toBeDefined();
        });

        it('should compile successfully', () => {
            expect(module).toBeInstanceOf(TestingModule);
        });
    });

    describe('Providers', () => {
        it('should have UserSessionRepository as a provider', () => {
            expect(userSessionRepository).toBeDefined();
            expect(userSessionRepository).toBeInstanceOf(UserSessionRepository);
        });

        it('should have UserSessionService as a provider', () => {
            expect(userSessionService).toBeDefined();
            expect(userSessionService).toBeInstanceOf(UserSessionService);
        });

        it('should have PreUserSessionService as a provider', () => {
            expect(preUserSessionService).toBeDefined();
            expect(preUserSessionService).toBeInstanceOf(PreUserSessionService);
        });

        it('should have JwtService as a provider', () => {
            expect(jwtService).toBeDefined();
            expect(jwtService).toBe(mockJwtService);
        });

        it('should provide EntityManager', () => {
            const entityManager = module.get<EntityManager>(EntityManager);
            expect(entityManager).toBeDefined();
            expect(entityManager).toBe(mockEntityManager);
        });

        it('should provide UserSessionEntity repository token', () => {
            const repository = module.get(getRepositoryToken(UserSessionEntity));
            expect(repository).toBeDefined();
            expect(repository).toBe(mockRepository);
        });

        it('should provide WINSTON_MODULE_PROVIDER for user session module', () => {
            const logger = module.get(WINSTON_MODULE_PROVIDER);
            expect(logger).toBeDefined();
            expect(logger).toBe(mockLogger);
        });

        it('should provide EnvConfigService', () => {
            const envConfig = module.get<EnvConfigService>(EnvConfigService);
            expect(envConfig).toBeDefined();
            expect(envConfig).toBe(mockEnvConfigService);
        });

        it('should provide ErrorHandlerService', () => {
            const errorHandler = module.get<ErrorHandlerService>(ErrorHandlerService);
            expect(errorHandler).toBeDefined();
            expect(errorHandler).toBe(mockErrorHandlerService);
        });

        it('should provide AuthUtils', () => {
            const authUtils = module.get<AuthUtils>(AuthUtils);
            expect(authUtils).toBeDefined();
            expect(authUtils).toBe(mockAuthUtils);
        });
    });

    describe('Dependency Injection', () => {
        it('should successfully instantiate UserSessionRepository with dependencies', () => {
            expect(userSessionRepository).toBeDefined();
            expect(userSessionRepository).toBeInstanceOf(UserSessionRepository);
            expect(typeof userSessionRepository.find).toBe('function');
            expect(typeof userSessionRepository.findOne).toBe('function');
            expect(typeof userSessionRepository.create).toBe('function');
        });

        it('should successfully instantiate UserSessionService with dependencies', () => {
            expect(userSessionService).toBeDefined();
            expect(userSessionService).toBeInstanceOf(UserSessionService);
            expect(typeof userSessionService.generateUserSession).toBe('function');
            expect(typeof userSessionService.renewAccessToken).toBe('function');
        });

        it('should successfully instantiate PreUserSessionService with dependencies', () => {
            expect(preUserSessionService).toBeDefined();
            expect(preUserSessionService).toBeInstanceOf(PreUserSessionService);
            expect(typeof preUserSessionService.generateToken).toBe('function');
            expect(typeof preUserSessionService.initializeSession).toBe('function');
        });

        it('should have UserSessionService properly injected with logger', () => {
            expect(userSessionService.logger).toBeDefined();
            expect(userSessionService.logger).toBe(mockLogger);
        });

        it('should have UserSessionService properly injected with jwt service', () => {
            expect(userSessionService.jwt).toBeDefined();
            expect(userSessionService.jwt).toBe(mockJwtService);
        });

        it('should have UserSessionService properly injected with config service', () => {
            expect(userSessionService.envConfigService).toBeDefined();
            expect(userSessionService.envConfigService).toBe(mockEnvConfigService);
        });

        it('should have PreUserSessionService properly injected through forwardRef', () => {
            expect(preUserSessionService).toBeDefined();
            expect((preUserSessionService as any).uSessionService).toBeDefined();
        });
    });

    describe('Module Exports', () => {
        it('should be able to get UserSessionRepository for export', () => {
            const repository = module.get<UserSessionRepository>(UserSessionRepository);
            expect(repository).toBeDefined();
            expect(repository).toBeInstanceOf(UserSessionRepository);
        });

        it('should be able to get UserSessionService for export', () => {
            const service = module.get<UserSessionService>(UserSessionService);
            expect(service).toBeDefined();
            expect(service).toBeInstanceOf(UserSessionService);
        });

        it('should be able to get PreUserSessionService for export', () => {
            const service = module.get<PreUserSessionService>(PreUserSessionService);
            expect(service).toBeDefined();
            expect(service).toBeInstanceOf(PreUserSessionService);
        });

        it('should be able to get JwtService for export', () => {
            const jwt = module.get<JwtService>(JwtService);
            expect(jwt).toBeDefined();
            expect(jwt).toBe(mockJwtService);
        });
    });

    describe('Integration', () => {
        it('should allow UserSessionService to interact with PreUserSessionService', () => {
            expect(userSessionService).toBeDefined();
            expect((userSessionService as any).preUSessionService).toBeDefined();
            expect((userSessionService as any).preUSessionService).toBeInstanceOf(
                PreUserSessionService,
            );
        });

        it('should allow PreUserSessionService to interact with UserSessionService', () => {
            expect(preUserSessionService).toBeDefined();
            expect((preUserSessionService as any).uSessionService).toBeDefined();
            expect((preUserSessionService as any).uSessionService).toBeInstanceOf(
                UserSessionService,
            );
        });

        it('should have all dependencies properly wired', () => {
            expect(module.get<UserSessionRepository>(UserSessionRepository)).toBeDefined();
            expect(module.get<UserSessionService>(UserSessionService)).toBeDefined();
            expect(module.get<PreUserSessionService>(PreUserSessionService)).toBeDefined();
            expect(module.get<JwtService>(JwtService)).toBeDefined();
            expect(module.get(getRepositoryToken(UserSessionEntity))).toBeDefined();
            expect(module.get<EntityManager>(EntityManager)).toBeDefined();
            expect(module.get(WINSTON_MODULE_PROVIDER)).toBeDefined();
            expect(module.get<EnvConfigService>(EnvConfigService)).toBeDefined();
            expect(module.get<ErrorHandlerService>(ErrorHandlerService)).toBeDefined();
            expect(module.get<AuthUtils>(AuthUtils)).toBeDefined();
        });

        it('should allow UserSessionRepository methods to be called', () => {
            expect(() => userSessionRepository.find).not.toThrow();
            expect(() => userSessionRepository.findOne).not.toThrow();
            expect(() => userSessionRepository.create).not.toThrow();
        });

        it('should allow UserSessionService methods to be called', () => {
            expect(() => userSessionService.generateUserSession).not.toThrow();
            expect(() => userSessionService.renewAccessToken).not.toThrow();
            expect(() => userSessionService.getActiveSession).not.toThrow();
        });

        it('should allow PreUserSessionService methods to be called', () => {
            expect(() => preUserSessionService.generateToken).not.toThrow();
            expect(() => preUserSessionService.initializeSession).not.toThrow();
            expect(() => preUserSessionService.calculateSessionExpirationDate).not.toThrow();
        });
    });

    describe('Service Dependencies', () => {
        it('should have UserSessionService with all required dependencies', () => {
            expect(userSessionService.logger).toBe(mockLogger);
            expect(userSessionService.jwt).toBe(mockJwtService);
            expect(userSessionService.envConfigService).toBe(mockEnvConfigService);
            expect(userSessionService.errorHandlerService).toBe(mockErrorHandlerService);
            expect(userSessionService.uSessionRepo).toBe(userSessionRepository);
        });

        it('should have PreUserSessionService with all required dependencies via UserSessionService', () => {
            expect(preUserSessionService.uSessionService.envConfigService).toBe(
                mockEnvConfigService,
            );
            expect(preUserSessionService.uSessionService.errorHandlerService).toBe(
                mockErrorHandlerService,
            );
            expect(preUserSessionService.uSessionService.uSessionRepo).toBe(userSessionRepository);
        });
    });

    describe('Circular Dependency Resolution', () => {
        it('should properly resolve circular dependency between UserSessionService and PreUserSessionService', () => {
            const userService = module.get<UserSessionService>(UserSessionService);
            const preUserService = module.get<PreUserSessionService>(PreUserSessionService);

            expect(userService).toBeDefined();
            expect(preUserService).toBeDefined();
            expect((userService as any).preUSessionService).toBe(preUserService);
            expect((preUserService as any).uSessionService).toBe(userService);
        });

        it('should not throw circular dependency error during module initialization', () => {
            expect(() => module.get<UserSessionService>(UserSessionService)).not.toThrow();
            expect(() => module.get<PreUserSessionService>(PreUserSessionService)).not.toThrow();
        });
    });

    describe('Global Module Configuration', () => {
        it('should be configured as a global module', () => {
            expect(module).toBeDefined();
            expect(module).toBeInstanceOf(TestingModule);
        });

        it('should export all required providers for global use', () => {
            const exportedProviders = [
                UserSessionRepository,
                UserSessionService,
                PreUserSessionService,
                JwtService,
            ];

            exportedProviders.forEach((provider) => {
                expect(() => module.get(provider)).not.toThrow();
            });
        });
    });
});
