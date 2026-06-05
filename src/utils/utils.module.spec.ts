import { Test, TestingModule } from '@nestjs/testing';
import { UtilsModule } from './utils.module';
import { EnvConfigService } from './services/config';
import { AuthUtils, ConfigUtils, FilesUtils, GlobalUtils, OtherUtils } from './services/tools';
import { Reflector } from '@nestjs/core';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('UtilsModule', () => {
    let module: TestingModule;

    const mockEnvConfigService = {
        get: jest.fn(),
        getOrThrow: jest.fn(),
        port: 3000,
        environment: 'test',
        databaseUrl: 'postgresql://test',
        jwtSecret: 'test-secret',
        sAdminRole: 'superadmin',
        adminRole: 'admin',
        userRole: 'user',
        supportRole: 'support',
    };

    const mockOtherUtils = {
        generateRandomString: jest.fn(),
        parseJson: jest.fn(),
        formatDate: jest.fn(),
        calculateHash: jest.fn(),
    };

    const mockConfigUtils = {
        loadConfig: jest.fn(),
        validateConfig: jest.fn(),
        mergeConfigs: jest.fn(),
    };

    const mockFilesUtils = {
        readFile: jest.fn(),
        writeFile: jest.fn(),
        deleteFile: jest.fn(),
        fileExists: jest.fn(),
        uploadFile: jest.fn(),
    };

    const mockGlobalUtils = {
        isProduction: jest.fn(),
        isDevelopment: jest.fn(),
        getEnvironment: jest.fn(),
        logError: jest.fn(),
    };

    const mockAuthUtils = {
        hashPassword: jest.fn(),
        comparePassword: jest.fn(),
        generateToken: jest.fn(),
        verifyToken: jest.fn(),
    };

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [
                {
                    provide: EnvConfigService,
                    useValue: mockEnvConfigService,
                },
                {
                    provide: OtherUtils,
                    useValue: mockOtherUtils,
                },
                {
                    provide: ConfigUtils,
                    useValue: mockConfigUtils,
                },
                {
                    provide: FilesUtils,
                    useValue: mockFilesUtils,
                },
                {
                    provide: GlobalUtils,
                    useValue: mockGlobalUtils,
                },
                {
                    provide: AuthUtils,
                    useValue: mockAuthUtils,
                },
                {
                    provide: Reflector,
                    useValue: {
                        get: jest.fn(),
                        getAllAndOverride: jest.fn(),
                    },
                },
            ],
        }).compile();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Module Definition', () => {
        it('should be defined', () => {
            expect(module).toBeDefined();
        });

        it('should compile the module', () => {
            expect(module).toBeInstanceOf(TestingModule);
        });
    });

    describe('Global Module Decorator', () => {
        it('should be decorated with @Global()', () => {
            const isGlobal = Reflect.getMetadata('__module:global__', UtilsModule);
            expect(isGlobal).toBe(true);
        });

        it('should have global scope', () => {
            const globalMetadata = Reflect.getMetadata('__module:global__', UtilsModule);
            expect(globalMetadata).toBeDefined();
        });
    });

    describe('Providers', () => {
        it('should have EnvConfigService defined', () => {
            const service = module.get(EnvConfigService);
            expect(service).toBeDefined();
        });

        it('should have OtherUtils defined', () => {
            const utils = module.get(OtherUtils);
            expect(utils).toBeDefined();
        });

        it('should have ConfigUtils defined', () => {
            const utils = module.get(ConfigUtils);
            expect(utils).toBeDefined();
        });

        it('should have FilesUtils defined', () => {
            const utils = module.get(FilesUtils);
            expect(utils).toBeDefined();
        });

        it('should have GlobalUtils defined', () => {
            const utils = module.get(GlobalUtils);
            expect(utils).toBeDefined();
        });

        it('should have AuthUtils defined', () => {
            const utils = module.get(AuthUtils);
            expect(utils).toBeDefined();
        });
    });

    describe('Module Metadata', () => {
        it('should not have controllers metadata', () => {
            const controllers = Reflect.getMetadata('controllers', UtilsModule);
            expect(controllers).toBeUndefined();
        });

        it('should have providers metadata', () => {
            const providers = Reflect.getMetadata('providers', UtilsModule);
            expect(providers).toBeDefined();
            expect(providers).toContain(EnvConfigService);
            expect(providers).toContain(OtherUtils);
            expect(providers).toContain(ConfigUtils);
            expect(providers).toContain(FilesUtils);
            expect(providers).toContain(GlobalUtils);
            expect(providers).toContain(AuthUtils);
        });

        it('should have exports metadata', () => {
            const exports = Reflect.getMetadata('exports', UtilsModule);
            expect(exports).toBeDefined();
            expect(exports).toContain(EnvConfigService);
            expect(exports).toContain(OtherUtils);
            expect(exports).toContain(ConfigUtils);
            expect(exports).toContain(FilesUtils);
            expect(exports).toContain(GlobalUtils);
            expect(exports).toContain(AuthUtils);
        });

        it('should not have imports metadata', () => {
            const imports = Reflect.getMetadata('imports', UtilsModule);
            expect(imports).toBeUndefined();
        });

        it('should have correct number of providers', () => {
            const providers = Reflect.getMetadata('providers', UtilsModule);
            expect(providers.length).toBe(6);
        });

        it('should have correct number of exports', () => {
            const exports = Reflect.getMetadata('exports', UtilsModule);
            expect(exports.length).toBe(6);
        });
    });

    describe('Exports Verification', () => {
        it('should export EnvConfigService', () => {
            const exports = Reflect.getMetadata('exports', UtilsModule);
            expect(exports).toContain(EnvConfigService);
        });

        it('should export OtherUtils', () => {
            const exports = Reflect.getMetadata('exports', UtilsModule);
            expect(exports).toContain(OtherUtils);
        });

        it('should export ConfigUtils', () => {
            const exports = Reflect.getMetadata('exports', UtilsModule);
            expect(exports).toContain(ConfigUtils);
        });

        it('should export FilesUtils', () => {
            const exports = Reflect.getMetadata('exports', UtilsModule);
            expect(exports).toContain(FilesUtils);
        });

        it('should export GlobalUtils', () => {
            const exports = Reflect.getMetadata('exports', UtilsModule);
            expect(exports).toContain(GlobalUtils);
        });

        it('should export AuthUtils', () => {
            const exports = Reflect.getMetadata('exports', UtilsModule);
            expect(exports).toContain(AuthUtils);
        });

        it('should export all providers', () => {
            const exports = Reflect.getMetadata('exports', UtilsModule);
            expect(exports.length).toBe(6);
        });
    });

    describe('Module Structure', () => {
        it('should have no imports', () => {
            const imports = Reflect.getMetadata('imports', UtilsModule) || [];
            expect(imports.length).toBe(0);
        });

        it('should have all required providers', () => {
            const providers = Reflect.getMetadata('providers', UtilsModule) || [];
            expect(providers.length).toBeGreaterThan(0);
        });

        it('should have no controllers', () => {
            const controllers = Reflect.getMetadata('controllers', UtilsModule) || [];
            expect(controllers.length).toBe(0);
        });

        it('should have all required exports', () => {
            const exports = Reflect.getMetadata('exports', UtilsModule) || [];
            expect(exports.length).toBeGreaterThan(0);
        });
    });

    describe('Provider Configuration', () => {
        it('should configure EnvConfigService correctly', () => {
            const providers = Reflect.getMetadata('providers', UtilsModule);
            expect(providers).toContain(EnvConfigService);
        });

        it('should configure all utility services correctly', () => {
            const providers = Reflect.getMetadata('providers', UtilsModule);
            expect(providers).toContain(OtherUtils);
            expect(providers).toContain(ConfigUtils);
            expect(providers).toContain(FilesUtils);
            expect(providers).toContain(GlobalUtils);
            expect(providers).toContain(AuthUtils);
        });
    });

    describe('Service Instances', () => {
        it('should get EnvConfigService instance', () => {
            const service = module.get(EnvConfigService);
            expect(service).toBe(mockEnvConfigService);
        });

        it('should get OtherUtils instance', () => {
            const utils = module.get(OtherUtils);
            expect(utils).toBe(mockOtherUtils);
        });

        it('should get ConfigUtils instance', () => {
            const utils = module.get(ConfigUtils);
            expect(utils).toBe(mockConfigUtils);
        });

        it('should get FilesUtils instance', () => {
            const utils = module.get(FilesUtils);
            expect(utils).toBe(mockFilesUtils);
        });

        it('should get GlobalUtils instance', () => {
            const utils = module.get(GlobalUtils);
            expect(utils).toBe(mockGlobalUtils);
        });

        it('should get AuthUtils instance', () => {
            const utils = module.get(AuthUtils);
            expect(utils).toBe(mockAuthUtils);
        });
    });

    describe('Provider Dependencies', () => {
        it('should have all utility dependencies resolved', () => {
            expect(module.get(EnvConfigService)).toBeDefined();
            expect(module.get(OtherUtils)).toBeDefined();
            expect(module.get(ConfigUtils)).toBeDefined();
            expect(module.get(FilesUtils)).toBeDefined();
            expect(module.get(GlobalUtils)).toBeDefined();
            expect(module.get(AuthUtils)).toBeDefined();
        });
    });

    describe('Module Exports Validation', () => {
        it('should export all six providers', () => {
            const exports = Reflect.getMetadata('exports', UtilsModule);
            expect(exports).toContain(EnvConfigService);
            expect(exports).toContain(OtherUtils);
            expect(exports).toContain(ConfigUtils);
            expect(exports).toContain(FilesUtils);
            expect(exports).toContain(GlobalUtils);
            expect(exports).toContain(AuthUtils);
            expect(exports.length).toBe(6);
        });

        it('should have matching exports and providers for all items', () => {
            const exports = Reflect.getMetadata('exports', UtilsModule);
            const providers = Reflect.getMetadata('providers', UtilsModule);

            exports.forEach((exp: any) => {
                expect(providers).toContain(exp);
            });
        });

        it('should export 100% of providers', () => {
            const exports = Reflect.getMetadata('exports', UtilsModule);
            const providers = Reflect.getMetadata('providers', UtilsModule);

            expect(providers.length).toBe(exports.length);
            expect(exports.length).toBe(6);
        });
    });

    describe('Module Compilation', () => {
        it('should compile without errors', () => {
            expect(module).toBeDefined();
            expect(module).toBeInstanceOf(TestingModule);
        });

        it('should initialize all providers', () => {
            expect(module.get(EnvConfigService)).toBeDefined();
            expect(module.get(OtherUtils)).toBeDefined();
            expect(module.get(ConfigUtils)).toBeDefined();
            expect(module.get(FilesUtils)).toBeDefined();
            expect(module.get(GlobalUtils)).toBeDefined();
            expect(module.get(AuthUtils)).toBeDefined();
        });

        it('should have no controllers to initialize', () => {
            const controllers = Reflect.getMetadata('controllers', UtilsModule) || [];
            expect(controllers.length).toBe(0);
        });
    });

    describe('Provider Uniqueness', () => {
        it('should have unique service instances per module', () => {
            const service1 = module.get<EnvConfigService>(EnvConfigService);
            const service2 = module.get<EnvConfigService>(EnvConfigService);

            expect(service1).toBe(service2);
        });

        it('should have unique utility instances per module', () => {
            const utils1 = module.get<AuthUtils>(AuthUtils);
            const utils2 = module.get<AuthUtils>(AuthUtils);

            expect(utils1).toBe(utils2);
        });
    });

    describe('Complete Module Structure', () => {
        it('should have correct module structure', () => {
            const controllers = Reflect.getMetadata('controllers', UtilsModule);
            const providers = Reflect.getMetadata('providers', UtilsModule);
            const exports = Reflect.getMetadata('exports', UtilsModule);
            const imports = Reflect.getMetadata('imports', UtilsModule);

            expect(controllers).toBeUndefined();
            expect(providers).toBeDefined();
            expect(exports).toBeDefined();
            expect(imports).toBeUndefined();

            expect(providers.length).toBe(6);
            expect(exports.length).toBe(6);
        });
    });

    describe('Full Export Strategy', () => {
        it('should export all providers as utilities module', () => {
            const exports = Reflect.getMetadata('exports', UtilsModule);

            expect(exports).toContain(EnvConfigService);
            expect(exports).toContain(OtherUtils);
            expect(exports).toContain(ConfigUtils);
            expect(exports).toContain(FilesUtils);
            expect(exports).toContain(GlobalUtils);
            expect(exports).toContain(AuthUtils);
            expect(exports.length).toBe(6);
        });

        it('should have no private providers', () => {
            const exports = Reflect.getMetadata('exports', UtilsModule);
            const providers = Reflect.getMetadata('providers', UtilsModule);

            const privateProviders = providers.filter((p: any) => !exports.includes(p));

            expect(privateProviders.length).toBe(0);
        });

        it('should expose all utilities globally', () => {
            const exports = Reflect.getMetadata('exports', UtilsModule);
            const providers = Reflect.getMetadata('providers', UtilsModule);

            expect(exports.length).toBe(providers.length);
        });
    });

    describe('Module Provider Order', () => {
        it('should have providers in correct order', () => {
            const providers = Reflect.getMetadata('providers', UtilsModule);
            expect(providers[0]).toBe(EnvConfigService);
            expect(providers[1]).toBe(OtherUtils);
            expect(providers[2]).toBe(ConfigUtils);
            expect(providers[3]).toBe(FilesUtils);
            expect(providers[4]).toBe(GlobalUtils);
            expect(providers[5]).toBe(AuthUtils);
        });
    });

    describe('Module Export Order', () => {
        it('should have exports in correct order', () => {
            const exports = Reflect.getMetadata('exports', UtilsModule);
            expect(exports[0]).toBe(EnvConfigService);
            expect(exports[1]).toBe(OtherUtils);
            expect(exports[2]).toBe(ConfigUtils);
            expect(exports[3]).toBe(FilesUtils);
            expect(exports[4]).toBe(GlobalUtils);
            expect(exports[5]).toBe(AuthUtils);
        });

        it('should match provider order', () => {
            const exports = Reflect.getMetadata('exports', UtilsModule);
            const providers = Reflect.getMetadata('providers', UtilsModule);

            expect(exports).toEqual(providers);
        });
    });

    describe('Utility Services Architecture', () => {
        it('should have six utility providers', () => {
            const providers = Reflect.getMetadata('providers', UtilsModule);
            expect(providers.length).toBe(6);
        });

        it('should be able to inject all utility services', () => {
            const envConfigService = module.get<EnvConfigService>(EnvConfigService);
            const otherUtils = module.get<OtherUtils>(OtherUtils);
            const configUtils = module.get<ConfigUtils>(ConfigUtils);
            const filesUtils = module.get<FilesUtils>(FilesUtils);
            const globalUtils = module.get<GlobalUtils>(GlobalUtils);
            const authUtils = module.get<AuthUtils>(AuthUtils);

            expect(envConfigService).toBeDefined();
            expect(otherUtils).toBeDefined();
            expect(configUtils).toBeDefined();
            expect(filesUtils).toBeDefined();
            expect(globalUtils).toBeDefined();
            expect(authUtils).toBeDefined();
        });
    });

    describe('Module Encapsulation', () => {
        it('should expose all providers to other modules', () => {
            const exports = Reflect.getMetadata('exports', UtilsModule);
            expect(exports.length).toBe(6);
            expect(exports).toEqual([
                EnvConfigService,
                OtherUtils,
                ConfigUtils,
                FilesUtils,
                GlobalUtils,
                AuthUtils,
            ]);
        });

        it('should have no internal providers', () => {
            const providers = Reflect.getMetadata('providers', UtilsModule);
            const exports = Reflect.getMetadata('exports', UtilsModule);

            const internalCount = providers.length - exports.length;
            expect(internalCount).toBe(0);
        });

        it('should provide complete utility API', () => {
            const exports = Reflect.getMetadata('exports', UtilsModule);
            expect(exports).toEqual([
                EnvConfigService,
                OtherUtils,
                ConfigUtils,
                FilesUtils,
                GlobalUtils,
                AuthUtils,
            ]);
        });
    });

    describe('Global Module Availability', () => {
        it('should be available globally due to @Global decorator', () => {
            const isGlobal = Reflect.getMetadata('__module:global__', UtilsModule);
            expect(isGlobal).toBe(true);
        });

        it('should make all utilities available across entire application', () => {
            const exports = Reflect.getMetadata('exports', UtilsModule);
            const isGlobal = Reflect.getMetadata('__module:global__', UtilsModule);

            expect(isGlobal).toBe(true);
            expect(exports.length).toBe(6);
        });

        it('should export utilities without requiring imports in consuming modules', () => {
            const isGlobal = Reflect.getMetadata('__module:global__', UtilsModule);
            const exports = Reflect.getMetadata('exports', UtilsModule);

            expect(isGlobal).toBe(true);
            expect(exports.length).toBeGreaterThan(0);
        });
    });

    describe('No External Dependencies', () => {
        it('should have no module imports', () => {
            const imports = Reflect.getMetadata('imports', UtilsModule);
            expect(imports).toBeUndefined();
        });

        it('should be self-contained', () => {
            const imports = Reflect.getMetadata('imports', UtilsModule) || [];
            expect(imports.length).toBe(0);
        });

        it('should have no controllers', () => {
            const controllers = Reflect.getMetadata('controllers', UtilsModule);
            expect(controllers).toBeUndefined();
        });
    });

    describe('Dependency Injection', () => {
        it('should resolve all dependencies correctly', () => {
            expect(() => module.get(EnvConfigService)).not.toThrow();
            expect(() => module.get(OtherUtils)).not.toThrow();
            expect(() => module.get(ConfigUtils)).not.toThrow();
            expect(() => module.get(FilesUtils)).not.toThrow();
            expect(() => module.get(GlobalUtils)).not.toThrow();
            expect(() => module.get(AuthUtils)).not.toThrow();
        });

        it('should use singleton pattern for providers', () => {
            const service1 = module.get(EnvConfigService);
            const service2 = module.get(EnvConfigService);
            expect(service1).toBe(service2);

            const utils1 = module.get(AuthUtils);
            const utils2 = module.get(AuthUtils);
            expect(utils1).toBe(utils2);
        });
    });

    describe('Module Architecture', () => {
        it('should follow NestJS global utility module pattern', () => {
            const controllers = Reflect.getMetadata('controllers', UtilsModule);
            const providers = Reflect.getMetadata('providers', UtilsModule);
            const exports = Reflect.getMetadata('exports', UtilsModule);
            const imports = Reflect.getMetadata('imports', UtilsModule);
            const isGlobal = Reflect.getMetadata('__module:global__', UtilsModule);

            expect(controllers).toBeUndefined();
            expect(providers).toBeDefined();
            expect(exports).toBeDefined();
            expect(imports).toBeUndefined();
            expect(isGlobal).toBe(true);
        });

        it('should be a pure utility module', () => {
            const providers = Reflect.getMetadata('providers', UtilsModule);
            const exports = Reflect.getMetadata('exports', UtilsModule);
            const controllers = Reflect.getMetadata('controllers', UtilsModule);

            expect(providers.length).toBe(6);
            expect(exports.length).toBe(6);
            expect(controllers).toBeUndefined();
        });
    });

    describe('Public API Surface', () => {
        it('should expose configuration service', () => {
            const exports = Reflect.getMetadata('exports', UtilsModule);
            expect(exports).toContain(EnvConfigService);
        });

        it('should expose all utility services', () => {
            const exports = Reflect.getMetadata('exports', UtilsModule);
            expect(exports).toContain(OtherUtils);
            expect(exports).toContain(ConfigUtils);
            expect(exports).toContain(FilesUtils);
            expect(exports).toContain(GlobalUtils);
            expect(exports).toContain(AuthUtils);
        });

        it('should have no hidden implementation details', () => {
            const exports = Reflect.getMetadata('exports', UtilsModule);
            const providers = Reflect.getMetadata('providers', UtilsModule);

            expect(exports.length).toBe(providers.length);
        });
    });

    describe('Utility Module Pattern', () => {
        it('should export all providers as shared utilities', () => {
            const providers = Reflect.getMetadata('providers', UtilsModule);
            const exports = Reflect.getMetadata('exports', UtilsModule);

            expect(exports).toEqual(providers);
        });

        it('should have no business logic separation', () => {
            const exports = Reflect.getMetadata('exports', UtilsModule);
            const providers = Reflect.getMetadata('providers', UtilsModule);

            const privateProviders = providers.filter((p: any) => !exports.includes(p));

            expect(privateProviders.length).toBe(0);
        });

        it('should follow 100% export pattern for utilities', () => {
            const exports = Reflect.getMetadata('exports', UtilsModule);
            const providers = Reflect.getMetadata('providers', UtilsModule);

            const exportPercentage = (exports.length / providers.length) * 100;
            expect(exportPercentage).toBe(100);
        });
    });

    describe('Configuration Service', () => {
        it('should provide EnvConfigService for environment configuration', () => {
            const providers = Reflect.getMetadata('providers', UtilsModule);
            const exports = Reflect.getMetadata('exports', UtilsModule);

            expect(providers).toContain(EnvConfigService);
            expect(exports).toContain(EnvConfigService);
        });

        it('should make EnvConfigService globally available', () => {
            const service = module.get(EnvConfigService);
            const isGlobal = Reflect.getMetadata('__module:global__', UtilsModule);

            expect(service).toBeDefined();
            expect(isGlobal).toBe(true);
        });
    });

    describe('Utility Categories', () => {
        it('should provide authentication utilities', () => {
            const authUtils = module.get(AuthUtils);
            expect(authUtils).toBeDefined();
        });

        it('should provide file utilities', () => {
            const filesUtils = module.get(FilesUtils);
            expect(filesUtils).toBeDefined();
        });

        it('should provide configuration utilities', () => {
            const configUtils = module.get(ConfigUtils);
            expect(configUtils).toBeDefined();
        });

        it('should provide global utilities', () => {
            const globalUtils = module.get(GlobalUtils);
            expect(globalUtils).toBeDefined();
        });

        it('should provide other miscellaneous utilities', () => {
            const otherUtils = module.get(OtherUtils);
            expect(otherUtils).toBeDefined();
        });
    });

    describe('Cross-Cutting Concerns', () => {
        it('should provide utilities for cross-cutting concerns', () => {
            const providers = Reflect.getMetadata('providers', UtilsModule);

            expect(providers).toContain(EnvConfigService);
            expect(providers).toContain(AuthUtils);
            expect(providers).toContain(FilesUtils);
            expect(providers).toContain(ConfigUtils);
            expect(providers).toContain(GlobalUtils);
            expect(providers).toContain(OtherUtils);
        });

        it('should export all cross-cutting utilities globally', () => {
            const exports = Reflect.getMetadata('exports', UtilsModule);
            const isGlobal = Reflect.getMetadata('__module:global__', UtilsModule);

            expect(exports.length).toBe(6);
            expect(isGlobal).toBe(true);
        });
    });

    describe('Standalone Module Pattern', () => {
        it('should be a standalone module with no imports', () => {
            const imports = Reflect.getMetadata('imports', UtilsModule);
            expect(imports).toBeUndefined();
        });

        it('should be a standalone module with no controllers', () => {
            const controllers = Reflect.getMetadata('controllers', UtilsModule);
            expect(controllers).toBeUndefined();
        });

        it('should only provide utility services', () => {
            const providers = Reflect.getMetadata('providers', UtilsModule);
            const exports = Reflect.getMetadata('exports', UtilsModule);

            expect(providers.length).toBe(6);
            expect(exports.length).toBe(6);
            expect(providers).toEqual(exports);
        });
    });

    describe('Global Utilities Availability', () => {
        it('should make utilities available without imports', () => {
            const isGlobal = Reflect.getMetadata('__module:global__', UtilsModule);
            expect(isGlobal).toBe(true);
        });

        it('should provide all utilities to any module', () => {
            const exports = Reflect.getMetadata('exports', UtilsModule);
            const isGlobal = Reflect.getMetadata('__module:global__', UtilsModule);

            expect(isGlobal).toBe(true);
            expect(exports).toContain(EnvConfigService);
            expect(exports).toContain(OtherUtils);
            expect(exports).toContain(ConfigUtils);
            expect(exports).toContain(FilesUtils);
            expect(exports).toContain(GlobalUtils);
            expect(exports).toContain(AuthUtils);
        });
    });

    describe('Module Simplicity', () => {
        it('should have simple structure with only providers and exports', () => {
            const imports = Reflect.getMetadata('imports', UtilsModule);
            const controllers = Reflect.getMetadata('controllers', UtilsModule);
            const providers = Reflect.getMetadata('providers', UtilsModule);
            const exports = Reflect.getMetadata('exports', UtilsModule);

            expect(imports).toBeUndefined();
            expect(controllers).toBeUndefined();
            expect(providers).toBeDefined();
            expect(exports).toBeDefined();
        });

        it('should have 1:1 provider to export ratio', () => {
            const providers = Reflect.getMetadata('providers', UtilsModule);
            const exports = Reflect.getMetadata('exports', UtilsModule);

            expect(providers.length).toBe(exports.length);
            expect(providers).toEqual(exports);
        });
    });

    describe('Utility Module Best Practices', () => {
        it('should export all providers for shared utilities', () => {
            const providers = Reflect.getMetadata('providers', UtilsModule);
            const exports = Reflect.getMetadata('exports', UtilsModule);

            providers.forEach((provider: any) => {
                expect(exports).toContain(provider);
            });
        });

        it('should be globally scoped for application-wide access', () => {
            const isGlobal = Reflect.getMetadata('__module:global__', UtilsModule);
            expect(isGlobal).toBe(true);
        });

        it('should have no dependencies on other modules', () => {
            const imports = Reflect.getMetadata('imports', UtilsModule) || [];
            expect(imports.length).toBe(0);
        });

        it('should be self-contained and reusable', () => {
            const imports = Reflect.getMetadata('imports', UtilsModule);
            const providers = Reflect.getMetadata('providers', UtilsModule);
            const exports = Reflect.getMetadata('exports', UtilsModule);

            expect(imports).toBeUndefined();
            expect(providers).toEqual(exports);
        });
    });
});
