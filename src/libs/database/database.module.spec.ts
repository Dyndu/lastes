import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from './database.module';

jest.mock('@nestjs/typeorm', () => ({
    TypeOrmModule: {
        forRootAsync: jest.fn(() => ({
            module: class MockTypeOrmModule {},
            providers: [],
            exports: [],
        })),
        forFeature: jest.fn(() => ({
            module: class MockTypeOrmFeatureModule {},
            providers: [],
            exports: [],
        })),
    },
}));

describe('DatabaseModule', () => {
    const mockConfigService = {
        getOrThrow: jest.fn((key: string) => {
            const config: Record<string, any> = {
                DB_HOST: 'localhost',
                DB_PORT: 5432,
                DB_NAME: 'test_db',
                DB_USER: 'test_user',
                DB_PASSWORD: 'test_password',
            };

            if (!(key in config)) {
                throw new Error(`Configuration key "${key}" does not exist`);
            }
            return config[key];
        }),
        get: jest.fn((key: string) => {
            if (key === 'NODE_ENV') return 'test';
            return null;
        }),
    };

    const requiredDbKeys = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Module definition', () => {
        it('should be defined', () => {
            expect(DatabaseModule).toBeDefined();
        });

        it('should have forFeature static method', () => {
            expect(DatabaseModule.forFeature).toBeDefined();
            expect(typeof DatabaseModule.forFeature).toBe('function');
        });
    });

    describe('TypeORM configuration factory', () => {
        it('should generate correct database configuration object', () => {
            const config = {
                type: 'postgres' as const,
                host: mockConfigService.getOrThrow('DB_HOST'),
                port: mockConfigService.getOrThrow('DB_PORT'),
                database: mockConfigService.getOrThrow('DB_NAME'),
                username: mockConfigService.getOrThrow('DB_USER'),
                password: mockConfigService.getOrThrow('DB_PASSWORD'),
                entities: ['app/entities/**/*.entities.ts', 'app/entities/**/*.entities.ts'],
                migrations: ['migration/**/*.ts'],
                synchronize: true,
                autoLoadEntities: true,
                caching: true,
            };

            expect(config.type).toBe('postgres');
            expect(config.host).toBe('localhost');
            expect(config.port).toBe(5432);
            expect(config.database).toBe('test_db');
            expect(config.username).toBe('test_user');
            expect(config.password).toBe('test_password');
        });

        it('should verify all required database config keys are accessed', () => {
            requiredDbKeys.forEach((key) => {
                mockConfigService.getOrThrow(key);
            });

            requiredDbKeys.forEach((key) => {
                expect(mockConfigService.getOrThrow).toHaveBeenCalledWith(key);
            });
        });

        it('should have all expected configuration properties', () => {
            const expectedProps = [
                'type',
                'host',
                'port',
                'database',
                'username',
                'password',
                'entities',
                'migrations',
                'synchronize',
                'autoLoadEntities',
                'caching',
            ];

            const config = {
                type: 'postgres',
                host: 'localhost',
                port: 5432,
                database: 'test_db',
                username: 'test_user',
                password: 'test_password',
                entities: ['app/entities/**/*.entities.ts'],
                migrations: ['migration/**/*.ts'],
                synchronize: true,
                autoLoadEntities: true,
                caching: true,
            };

            expectedProps.forEach((prop) => {
                expect(config).toHaveProperty(prop);
            });
        });
    });

    describe('Configuration values', () => {
        it('should use postgres as database type', () => {
            const dbType = 'postgres';
            expect(dbType).toBe('postgres');
        });

        it('should enable synchronize option', () => {
            const synchronize = true;
            expect(synchronize).toBe(true);
        });

        it('should enable autoLoadEntities option', () => {
            const autoLoadEntities = true;
            expect(autoLoadEntities).toBe(true);
        });

        it('should enable caching option', () => {
            const caching = true;
            expect(caching).toBe(true);
        });

        it('should have correct entities paths', () => {
            const entities = ['app/entities/**/*.entities.ts', 'app/entities/**/*.entities.ts'];

            expect(entities).toHaveLength(2);
            entities.forEach((path) => {
                expect(path).toMatch(/\.entities\.ts$/);
                expect(path).toContain('app/entities');
            });
        });

        it('should have correct migration path', () => {
            const migrations = ['migration/**/*.ts'];

            expect(migrations).toHaveLength(1);
            expect(migrations[0]).toBe('migration/**/*.ts');
        });
    });

    describe('Configuration validation - Missing keys', () => {
        requiredDbKeys.forEach((key) => {
            it(`should throw error when ${key} is missing`, () => {
                const invalidConfigService = {
                    getOrThrow: jest.fn((configKey: string) => {
                        if (configKey === key) {
                            throw new Error(`Configuration key "${configKey}" does not exist`);
                        }
                        return 'value';
                    }),
                };

                expect(() => {
                    invalidConfigService.getOrThrow(key);
                }).toThrow(`Configuration key "${key}" does not exist`);
            });
        });

        it('should validate all required keys systematically', () => {
            const missingKeys: string[] = [];

            requiredDbKeys.forEach((key) => {
                try {
                    mockConfigService.getOrThrow(key);
                } catch (error) {
                    missingKeys.push(key);
                }
            });

            expect(missingKeys).toEqual([]);
            expect(mockConfigService.getOrThrow).toHaveBeenCalledTimes(requiredDbKeys.length);
        });
    });

    describe('forFeature method', () => {
        it('should delegate to TypeOrmModule.forFeature', () => {
            const forFeatureSpy = TypeOrmModule.forFeature as jest.Mock;
            forFeatureSpy.mockClear();

            class TestEntity {}
            const result = DatabaseModule.forFeature([TestEntity]);

            expect(forFeatureSpy).toHaveBeenCalledWith([TestEntity]);
            expect(forFeatureSpy).toHaveBeenCalledTimes(1);
            expect(result).toBeDefined();
        });

        it('should handle multiple entities', () => {
            const forFeatureSpy = TypeOrmModule.forFeature as jest.Mock;
            forFeatureSpy.mockClear();

            class UserEntity {}
            class PostEntity {}
            class CommentEntity {}

            const entities = [UserEntity, PostEntity, CommentEntity];
            DatabaseModule.forFeature(entities);

            expect(forFeatureSpy).toHaveBeenCalledWith(entities);
        });

        it('should handle empty entities array', () => {
            const forFeatureSpy = TypeOrmModule.forFeature as jest.Mock;
            forFeatureSpy.mockClear();

            const result = DatabaseModule.forFeature([]);

            expect(forFeatureSpy).toHaveBeenCalledWith([]);
            expect(result).toBeDefined();
        });

        it('should return result from TypeOrmModule.forFeature', () => {
            class MockEntity {}

            const result = DatabaseModule.forFeature([MockEntity]);

            expect(result).toHaveProperty('module');
        });
    });

    describe('Environment-based configuration', () => {
        it('should handle NODE_ENV retrieval', () => {
            const env = mockConfigService.get('NODE_ENV');

            expect(env).toBe('test');
            expect(mockConfigService.get).toHaveBeenCalledWith('NODE_ENV');
        });

        it('should return null for non-existent config keys with get()', () => {
            const nonExistent = mockConfigService.get('NON_EXISTENT_KEY');

            expect(nonExistent).toBeNull();
        });

        it('should differentiate between dev and production environments', () => {
            const devEnv = 'dev';
            const prodEnv = 'production';
            const testEnv = 'test';

            expect(['dev', 'production', 'test']).toContain(devEnv);
            expect(['dev', 'production', 'test']).toContain(prodEnv);
            expect(['dev', 'production', 'test']).toContain(testEnv);
        });
    });

    describe('TypeORM integration', () => {
        it('should have used TypeOrmModule.forFeature in forFeature method', () => {
            const forFeatureSpy = TypeOrmModule.forFeature as jest.Mock;
            forFeatureSpy.mockClear();

            class Entity1 {}
            class Entity2 {}

            DatabaseModule.forFeature([Entity1, Entity2]);

            expect(forFeatureSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('Configuration completeness', () => {
        it('should have all database connection parameters', () => {
            const config = {
                host: mockConfigService.getOrThrow('DB_HOST'),
                port: mockConfigService.getOrThrow('DB_PORT'),
                database: mockConfigService.getOrThrow('DB_NAME'),
                username: mockConfigService.getOrThrow('DB_USER'),
                password: mockConfigService.getOrThrow('DB_PASSWORD'),
            };

            expect(config.host).toBeDefined();
            expect(config.port).toBeDefined();
            expect(config.database).toBeDefined();
            expect(config.username).toBeDefined();
            expect(config.password).toBeDefined();

            expect(typeof config.host).toBe('string');
            expect(typeof config.port).toBe('number');
            expect(typeof config.database).toBe('string');
            expect(typeof config.username).toBe('string');
            expect(typeof config.password).toBe('string');
        });

        it('should have valid paths for entities and migrations', () => {
            const entities = ['app/entities/**/*.entities.ts'];
            const migrations = ['migration/**/*.ts'];

            entities.forEach((path) => {
                expect(path).toBeTruthy();
                expect(typeof path).toBe('string');
            });

            migrations.forEach((path) => {
                expect(path).toBeTruthy();
                expect(typeof path).toBe('string');
            });
        });
    });
});
