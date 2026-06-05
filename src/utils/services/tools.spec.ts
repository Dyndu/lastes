import { Test, TestingModule } from '@nestjs/testing';
import * as crypto from 'node:crypto';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ConfigUtils, FilesUtils, OtherUtils, GlobalUtils, AuthUtils } from './tools';
import { ErrorHandlerService } from '../../common/response';
import { ExistenceCheckModeEnum, FileTypeEnum, UsagePeriod } from '../../common/enum';
import * as sanitizeHtml from 'sanitize-html';

jest.mock('fs');
jest.mock('path');
jest.mock('sanitize-html', () => jest.fn((value: string) => value));

describe('FilesUtils', () => {
    let service: FilesUtils;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [FilesUtils],
        }).compile();

        service = module.get<FilesUtils>(FilesUtils);
    });

    describe('generateObjectName', () => {
        it('should generate object name with uuid and sanitized filename', () => {
            const uuid = 'test-uuid-123';
            const filename = 'My Document.pdf';

            const result = service.generateObjectName(uuid, filename);

            expect(result).toBe('test-uuid-123-My_Document.pdf');
        });

        it('should handle filenames with multiple spaces', () => {
            const uuid = 'abc-123';
            const filename = 'Multiple   Spaces   File.txt';

            const result = service.generateObjectName(uuid, filename);

            expect(result).toBe('abc-123-Multiple_Spaces_File.txt');
        });

        it('should handle filenames with special characters', () => {
            const uuid = 'xyz-789';
            const filename = 'Special@#$%Characters.pdf';

            const result = service.generateObjectName(uuid, filename);

            expect(result).toBe('xyz-789-SpecialCharacters.pdf');
        });

        it('should preserve dots and hyphens in filename', () => {
            const uuid = 'uuid-456';
            const filename = 'my-file.backup.tar.gz';

            const result = service.generateObjectName(uuid, filename);

            expect(result).toBe('uuid-456-my-file.backup.tar.gz');
        });

        it('should handle complex real-world filenames', () => {
            const uuid = '550e8400-e29b-41d4-a716-446655440000';
            const filename = 'Financial Report (2024) - Final!.xlsx';

            const result = service.generateObjectName(uuid, filename);

            expect(result).toBe(
                '550e8400-e29b-41d4-a716-446655440000-Financial_Report_2024_-_Final.xlsx',
            );
        });

        it('should handle simple filenames without changes', () => {
            const uuid = 'simple-uuid';
            const filename = 'document.pdf';

            const result = service.generateObjectName(uuid, filename);

            expect(result).toBe('simple-uuid-document.pdf');
        });

        it('should handle filenames with accents and special unicode', () => {
            const uuid = 'test-123';
            const filename = 'Été 2024 Café.jpg';

            const result = service.generateObjectName(uuid, filename);

            expect(result).toBe('test-123-t_2024_Caf.jpg');
        });
    });

    describe('sanitizeFilename', () => {
        it('should replace spaces with underscores', () => {
            expect(service.sanitizeFilename('My file important.pdf')).toBe('My_file_important.pdf');
            expect(service.sanitizeFilename('multiple   spaces.txt')).toBe('multiple_spaces.txt');
        });

        it('should remove special characters', () => {
            expect(service.sanitizeFilename('file@#$%^&*().txt')).toBe('file.txt');
            expect(service.sanitizeFilename('document[2024].pdf')).toBe('document2024.pdf');
        });

        it('should keep dots and hyphens', () => {
            expect(service.sanitizeFilename('my-file.test.pdf')).toBe('my-file.test.pdf');
            expect(service.sanitizeFilename('file-name-2024.backup.tar.gz')).toBe(
                'file-name-2024.backup.tar.gz',
            );
        });

        it('should handle mixed cases', () => {
            expect(service.sanitizeFilename('Financial Report (2024) - Final!.xlsx')).toBe(
                'Financial_Report_2024_-_Final.xlsx',
            );
            expect(service.sanitizeFilename('Photo été 2024 #holidays.jpg')).toBe(
                'Photo_t_2024_holidays.jpg',
            );
        });

        it('should handle edge cases', () => {
            expect(service.sanitizeFilename('simple.txt')).toBe('simple.txt');
            expect(service.sanitizeFilename('___file___.txt')).toBe('___file___.txt');
            expect(service.sanitizeFilename('123-456.789')).toBe('123-456.789');
        });
    });

    describe('getRandomColor', () => {
        const originalCrypto = globalThis.crypto;

        afterEach(() => {
            Object.defineProperty(globalThis, 'crypto', {
                value: originalCrypto,
                configurable: true,
            });
        });

        it('should return a color from the default list', () => {
            Object.defineProperty(globalThis, 'crypto', {
                value: {
                    getRandomValues: (array: any) => {
                        array[0] = 0;
                        return array;
                    },
                },
                configurable: true,
            });

            const color = FilesUtils.getRandomColor();
            const defaultColors = ['#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51'];
            expect(defaultColors).toContain(color);
        });

        it('should return a color from custom list', () => {
            Object.defineProperty(globalThis, 'crypto', {
                value: {
                    getRandomValues: (array: any) => {
                        array[0] = 1;
                        return array;
                    },
                },
                configurable: true,
            });

            const customColors = ['#FF0000', '#00FF00', '#0000FF'];
            const color = FilesUtils.getRandomColor(customColors);
            expect(customColors).toContain(color);
        });

        it('should throw error for empty array', () => {
            expect(() => FilesUtils.getRandomColor([])).toThrow('Colors array cannot be empty');
        });
    });

    describe('determineFileType', () => {
        it('should return AUDIO for audio mimeType', () => {
            expect(service.determineFileType('audio/mp3')).toBe(FileTypeEnum.AUDIO);
        });
        it('should return VIDEO for video mimeType', () => {
            expect(service.determineFileType('video/mp4')).toBe(FileTypeEnum.VIDEO);
        });
        it('should return IMAGE for image mimeType', () => {
            expect(service.determineFileType('image/png')).toBe(FileTypeEnum.IMAGE);
        });
        it('should return PDF for pdf mimeType', () => {
            expect(service.determineFileType('application/pdf')).toBe(FileTypeEnum.PDF);
        });
        it('should return DOCUMENT for document mimeType', () => {
            expect(service.determineFileType('application/msword')).toBe(FileTypeEnum.DOCUMENT);
        });
        it('should return OTHER for unknown mimeType', () => {
            expect(service.determineFileType('application/zip')).toBe(FileTypeEnum.OTHER);
        });
    });
});

describe('ConfigUtils', () => {
    let service: ConfigUtils;
    let configService: ConfigService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ConfigUtils, ConfigService],
        }).compile();

        service = module.get<ConfigUtils>(ConfigUtils);
        configService = module.get<ConfigService>(ConfigService);
    });

    describe('parseNumber', () => {
        it('should parse valid numbers', () => {
            expect(service.parseNumber('42', 'TEST_KEY')).toBe(42);
            expect(service.parseNumber('0', 'TEST_KEY')).toBe(0);
            expect(service.parseNumber('3.14', 'TEST_KEY')).toBeCloseTo(3.14);
        });

        it('should throw error for invalid numbers', () => {
            expect(() => service.parseNumber('abc', 'TEST_KEY')).toThrow(
                'Configuration TEST_KEY must be a valid number, got: abc',
            );
            expect(() => service.parseNumber('', 'TEST_KEY')).toThrow(
                'Configuration TEST_KEY must be a valid number, got: ',
            );
        });
    });

    describe('parseBoolean', () => {
        it('should parse true values', () => {
            expect(service.parseBoolean('true', 'TEST')).toBe(true);
            expect(service.parseBoolean('1', 'TEST')).toBe(true);
            expect(service.parseBoolean('yes', 'TEST')).toBe(true);
            expect(service.parseBoolean(' TRUE ', 'TEST')).toBe(true);
        });

        it('should parse false values', () => {
            expect(service.parseBoolean('false', 'TEST')).toBe(false);
            expect(service.parseBoolean('0', 'TEST')).toBe(false);
            expect(service.parseBoolean('no', 'TEST')).toBe(false);
            expect(service.parseBoolean('', 'TEST')).toBe(false);
        });

        it('should throw error for invalid boolean', () => {
            expect(() => service.parseBoolean('maybe', 'TEST')).toThrow(
                'Configuration TEST must be a valid boolean (true/false, 1/0, yes/no), got: maybe',
            );
        });
    });

    describe('getConfig', () => {
        beforeEach(() => {
            jest.spyOn(configService, 'get').mockImplementation((key: string) => {
                const map: Record<string, string> = {
                    REQUIRED_STRING: 'hello',
                    NUMBER_STRING: '42',
                    BOOLEAN_TRUE: 'yes',
                    BOOLEAN_FALSE: 'no',
                    EMPTY_STRING: '',
                };
                return map[key];
            });
        });

        it('should return string by default', () => {
            const result = service.getConfig(configService, 'REQUIRED_STRING');
            expect(result).toBe('hello');
        });

        it('should parse number', () => {
            const result = service.getConfig(configService, 'NUMBER_STRING', {
                type: 'number',
            });
            expect(result).toBe(42);
        });

        it('should parse boolean', () => {
            expect(
                service.getConfig(configService, 'BOOLEAN_TRUE', {
                    type: 'boolean',
                }),
            ).toBe(true);
            expect(
                service.getConfig(configService, 'BOOLEAN_FALSE', {
                    type: 'boolean',
                }),
            ).toBe(false);
        });

        it('should normalize strings', () => {
            const result = service.getConfig(configService, 'REQUIRED_STRING', {
                normalize: true,
            });
            expect(result).toBe('hello');
        });

        it('should use default value if optional', () => {
            const result = service.getConfig(configService, 'MISSING_KEY', {
                optional: true,
                defaultValue: 'default',
            });
            expect(result).toBe('default');
        });

        it('should throw if required and missing', () => {
            expect(() => service.getConfig(configService, 'MISSING_KEY')).toThrow(
                'Missing required configuration: MISSING_KEY',
            );
        });
    });
});

describe('AuthUtils', () => {
    let authUtils: AuthUtils;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AuthUtils],
        }).compile();

        authUtils = module.get<AuthUtils>(AuthUtils);
    });

    describe('hashToken', () => {
        it('should generate a valid SHA-256 hash', () => {
            const token = 'test-token-123';
            const hash = authUtils.hashToken(token);

            expect(hash).toHaveLength(64);
            expect(hash).toMatch(/^[a-f0-9]{64}$/);
        });

        it('should generate consistent hash for the same input', () => {
            const token = 'same-token';
            const hash1 = authUtils.hashToken(token);
            const hash2 = authUtils.hashToken(token);

            expect(hash1).toBe(hash2);
        });

        it('should generate different hashes for different inputs', () => {
            const token1 = 'token-one';
            const token2 = 'token-two';
            const hash1 = authUtils.hashToken(token1);
            const hash2 = authUtils.hashToken(token2);

            expect(hash1).not.toBe(hash2);
        });

        it('should handle empty string', () => {
            const hash = authUtils.hashToken('');

            const expectedHash = crypto.createHash('sha256').update('').digest('hex');
            expect(hash).toBe(expectedHash);
            expect(hash).toHaveLength(64);
        });

        it('should handle special characters', () => {
            const token = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
            const hash = authUtils.hashToken(token);

            expect(hash).toHaveLength(64);
            expect(hash).toMatch(/^[a-f0-9]{64}$/);
        });

        it('should handle unicode characters', () => {
            const token = '你好世界🚀émojis';
            const hash = authUtils.hashToken(token);

            expect(hash).toHaveLength(64);
            expect(hash).toMatch(/^[a-f0-9]{64}$/);
        });

        it('should be case-sensitive', () => {
            const token1 = 'MyToken';
            const token2 = 'mytoken';
            const hash1 = authUtils.hashToken(token1);
            const hash2 = authUtils.hashToken(token2);

            expect(hash1).not.toBe(hash2);
        });
    });

    describe('generateRefreshToken', () => {
        it('should generate a token', () => {
            const token = authUtils.generateRefreshToken();

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
        });

        it('should generate a 128-character hex string', () => {
            const token = authUtils.generateRefreshToken();

            expect(token).toHaveLength(128);
            expect(token).toMatch(/^[a-f0-9]{128}$/);
        });

        it('should generate unique tokens', () => {
            const token1 = authUtils.generateRefreshToken();
            const token2 = authUtils.generateRefreshToken();
            const token3 = authUtils.generateRefreshToken();

            expect(token1).not.toBe(token2);
            expect(token2).not.toBe(token3);
            expect(token1).not.toBe(token3);
        });

        it('should generate cryptographically random tokens', () => {
            const tokens = new Set<string>();
            const iterations = 1000;

            for (let i = 0; i < iterations; i++) {
                tokens.add(authUtils.generateRefreshToken());
            }

            expect(tokens.size).toBe(iterations);
        });

        it('should generate high-entropy tokens', () => {
            const token = authUtils.generateRefreshToken();
            const uniqueChars = new Set(token.split('')).size;
            expect(uniqueChars).toBeGreaterThan(10);
        });
    });

    describe('parseDeviceName', () => {
        it('should return "Unknown device" when userAgent is undefined', () => {
            const result = authUtils.parseDeviceName(undefined);
            expect(result).toBe('Unknown device');
        });

        it('should return "Unknown device" when userAgent is empty string', () => {
            const result = authUtils.parseDeviceName('');
            expect(result).toBe('Unknown device');
        });

        it('should parse mobile device correctly', () => {
            const mobileUA =
                'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1';
            const result = authUtils.parseDeviceName(mobileUA);

            expect(result).toContain('Mobile');
            expect(result).toContain('Safari');
            expect(result).toContain('iOS');
        });

        it('should parse tablet device correctly', () => {
            const tabletUA =
                'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
            const result = authUtils.parseDeviceName(tabletUA);

            expect(result).toContain('Tablet');
            expect(result).toContain('Safari');
            expect(result).toContain('iOS');
        });

        it('should parse desktop device correctly', () => {
            const desktopUA =
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
            const result = authUtils.parseDeviceName(desktopUA);

            expect(result).toContain('Desktop');
            expect(result).toContain('Chrome');
            expect(result).toContain('Windows');
        });

        it('should parse Android mobile device correctly', () => {
            const androidUA =
                'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36';
            const result = authUtils.parseDeviceName(androidUA);

            expect(result).toContain('Mobile');
            expect(result).toContain('Chrome');
            expect(result).toContain('Android');
        });

        it('should parse Android tablet correctly', () => {
            const androidTabletUA =
                'Mozilla/5.0 (Linux; Android 11; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Safari/537.36';
            const result = authUtils.parseDeviceName(androidTabletUA);

            expect(result).toContain('Tablet');
            expect(result).toContain('Chrome');
            expect(result).toContain('Android');
        });

        it('should parse macOS desktop correctly', () => {
            const macUA =
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
            const result = authUtils.parseDeviceName(macUA);

            expect(result).toContain('Desktop');
            expect(result).toContain('Chrome');
            expect(result).toContain('macOS');
        });

        it('should parse Firefox correctly', () => {
            const firefoxUA =
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0';
            const result = authUtils.parseDeviceName(firefoxUA);

            expect(result).toContain('Desktop');
            expect(result).toContain('Firefox');
            expect(result).toContain('Windows');
        });

        it('should format output with bullet separator', () => {
            const desktopUA =
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
            const result = authUtils.parseDeviceName(desktopUA);

            expect(result).toMatch(/.*·.*·.*/);
        });

        it('should filter out falsy values', () => {
            const unknownUA = 'UnknownBrowser/1.0';
            const result = authUtils.parseDeviceName(unknownUA);

            expect(result).not.toContain('undefined');
            expect(result).not.toContain('null');
        });

        it('should handle edge case with minimal user agent', () => {
            const minimalUA = 'CustomBot/1.0';
            const result = authUtils.parseDeviceName(minimalUA);

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        it('should consistently parse the same user agent', () => {
            const ua =
                'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1';
            const result1 = authUtils.parseDeviceName(ua);
            const result2 = authUtils.parseDeviceName(ua);

            expect(result1).toBe(result2);
        });
    });

    describe('Integration tests', () => {
        it('should hash generated refresh tokens consistently', () => {
            const refreshToken = authUtils.generateRefreshToken();
            const hash1 = authUtils.hashToken(refreshToken);
            const hash2 = authUtils.hashToken(refreshToken);

            expect(hash1).toBe(hash2);
        });

        it('should generate different hashes for different refresh tokens', () => {
            const token1 = authUtils.generateRefreshToken();
            const token2 = authUtils.generateRefreshToken();
            const hash1 = authUtils.hashToken(token1);
            const hash2 = authUtils.hashToken(token2);

            expect(hash1).not.toBe(hash2);
        });
    });
});

describe('OtherUtils', () => {
    let service: OtherUtils;
    let errorHandler: ErrorHandlerService;

    const mockErrorHandler = {
        forbidden: jest.fn((_message: string, userMessage: string) => {
            throw new Error(userMessage);
        }),
        fail: jest.fn((message: string) => {
            throw new Error(message);
        }),
        badRequest: jest.fn((_message: string, userMessage: string) => {
            throw new Error(userMessage);
        }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OtherUtils,
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandler,
                },
            ],
        }).compile();

        service = module.get<OtherUtils>(OtherUtils);
        errorHandler = module.get<ErrorHandlerService>(ErrorHandlerService);
        jest.clearAllMocks();
    });

    describe('changeFirstLetterToUpperCase', () => {
        it('should capitalize first letter', () => {
            expect(service.changeFirstLetterToUpperCase('hello')).toBe('Hello');
        });
    });

    describe('resolvePeriodDates', () => {
        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2025-06-15T12:00:00.000Z'));
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should return correct dates for ONE_DAY period', () => {
            const { startDate, previousStartDate, endDate } = service.resolvePeriodDates(
                UsagePeriod.ONE_DAY,
            );
            const now = new Date('2025-06-15T12:00:00.000Z');

            expect(endDate).toEqual(now);
            expect(startDate).toEqual(new Date('2025-06-14T12:00:00.000Z'));
            expect(previousStartDate).toEqual(new Date('2025-06-13T12:00:00.000Z'));
        });

        it('should return correct dates for ONE_WEEK period', () => {
            const { startDate, previousStartDate, endDate } = service.resolvePeriodDates(
                UsagePeriod.ONE_WEEK,
            );
            const now = new Date('2025-06-15T12:00:00.000Z');

            expect(endDate).toEqual(now);
            expect(startDate).toEqual(new Date('2025-06-08T12:00:00.000Z'));
            expect(previousStartDate).toEqual(new Date('2025-06-01T12:00:00.000Z'));
        });

        it('should return correct dates for ONE_MONTH period', () => {
            const { startDate, previousStartDate, endDate } = service.resolvePeriodDates(
                UsagePeriod.ONE_MONTH,
            );
            const now = new Date('2025-06-15T12:00:00.000Z');

            expect(endDate).toEqual(now);
            expect(startDate).toEqual(new Date('2025-05-15T12:00:00.000Z'));
            expect(previousStartDate).toEqual(new Date('2025-04-14T12:00:00.000Z'));
        });

        it('should return correct dates for ONE_YEAR period', () => {
            const { startDate, previousStartDate, endDate } = service.resolvePeriodDates(
                UsagePeriod.ONE_YEAR,
            );
            const now = new Date('2025-06-15T12:00:00.000Z');

            expect(endDate).toEqual(now);
            expect(startDate).toEqual(new Date('2024-06-15T12:00:00.000Z'));
            expect(previousStartDate).toEqual(new Date('2023-06-16T12:00:00.000Z'));
        });

        it('should have endDate equal to now', () => {
            const now = new Date('2025-06-15T12:00:00.000Z');
            const { endDate } = service.resolvePeriodDates(UsagePeriod.ONE_DAY);

            expect(endDate).toEqual(now);
        });

        it('should have previousStartDate earlier than startDate', () => {
            for (const period of Object.values(UsagePeriod)) {
                const { startDate, previousStartDate } = service.resolvePeriodDates(period);
                expect(previousStartDate.getTime()).toBeLessThan(startDate.getTime());
            }
        });

        it('should have startDate earlier than endDate', () => {
            for (const period of Object.values(UsagePeriod)) {
                const { startDate, endDate } = service.resolvePeriodDates(period);
                expect(startDate.getTime()).toBeLessThan(endDate.getTime());
            }
        });

        it('should have equal duration between periods', () => {
            const { startDate, previousStartDate, endDate } = service.resolvePeriodDates(
                UsagePeriod.ONE_WEEK,
            );

            const currentDuration = endDate.getTime() - startDate.getTime();
            const previousDuration = startDate.getTime() - previousStartDate.getTime();

            expect(currentDuration).toBe(previousDuration);
        });
    });

    describe('validateAndParsePhone', () => {
        it('should parse valid French phone number', () => {
            const result = service.validateAndParsePhone('+33612345678');
            expect(result.country).toBe('FR');
            expect(result.prefix).toBe('33');
            expect(result.phone).toBe('612345678');
        });

        it('should parse valid US phone number', () => {
            const result = service.validateAndParsePhone('+14155552671');
            expect(result.country).toBe('US');
            expect(result.prefix).toBe('1');
            expect(result.phone).toBe('4155552671');
        });

        it('should parse phone number with spaces', () => {
            const result = service.validateAndParsePhone('  +33612345678  ');
            expect(result.country).toBe('FR');
            expect(result.prefix).toBe('33');
            expect(result.phone).toBe('612345678');
        });

        it('should throw error for invalid phone number', () => {
            expect(() => service.validateAndParsePhone('12345')).toThrow('Invalid phone number');
        });

        it('should throw error for empty phone number', () => {
            expect(() => service.validateAndParsePhone('')).toThrow('Invalid phone number');
        });

        it('should throw error for invalid format', () => {
            expect(() => service.validateAndParsePhone('abc123')).toThrow('Invalid phone number');
        });
    });

    describe('generateNumber', () => {
        it('should generate a number string of given length', () => {
            const result = service.generateNumber(5);
            expect(result).toHaveLength(5);
            expect(/^\d{5}$/.test(result)).toBe(true);
        });

        it('should return empty string if length <= 0', () => {
            expect(service.generateNumber(0)).toBe('');
        });
    });

    describe('assertState', () => {
        describe('MUST_EXIST mode', () => {
            it('should not throw when values match', () => {
                expect(() =>
                    service.assertState('active', 'active', ExistenceCheckModeEnum.MUST_EXIST),
                ).not.toThrow();
                expect(errorHandler.forbidden).not.toHaveBeenCalled();
            });

            it('should throw when values do not match', () => {
                expect(() =>
                    service.assertState('inactive', 'active', ExistenceCheckModeEnum.MUST_EXIST),
                ).toThrow();
                expect(errorHandler.forbidden).toHaveBeenCalledWith(
                    'Invalid value: expected active, got inactive',
                    'Forbidden: value must match the expected value',
                );
            });

            it('should throw with custom label and entities name', () => {
                expect(() =>
                    service.assertState('pending', 'active', ExistenceCheckModeEnum.MUST_EXIST, {
                        label: 'status',
                        entityName: 'User',
                    }),
                ).toThrow();
                expect(errorHandler.forbidden).toHaveBeenCalledWith(
                    'Invalid status of User: expected active, got pending',
                    'Forbidden: status of User must match the expected value',
                );
            });
        });

        describe('MUST_NOT_EXIST mode', () => {
            it('should not throw when values do not match', () => {
                expect(() =>
                    service.assertState(
                        'inactive',
                        'active',
                        ExistenceCheckModeEnum.MUST_NOT_EXIST,
                    ),
                ).not.toThrow();
                expect(errorHandler.forbidden).not.toHaveBeenCalled();
            });

            it('should throw when values match', () => {
                expect(() =>
                    service.assertState('active', 'active', ExistenceCheckModeEnum.MUST_NOT_EXIST),
                ).toThrow();
                expect(errorHandler.forbidden).toHaveBeenCalledWith(
                    'value must not be equal to active',
                    'Forbidden: value cannot have this value',
                );
            });

            it('should throw with custom label and entities name', () => {
                expect(() =>
                    service.assertState(
                        'deleted',
                        'deleted',
                        ExistenceCheckModeEnum.MUST_NOT_EXIST,
                        {
                            label: 'status',
                            entityName: 'Account',
                        },
                    ),
                ).toThrow();
                expect(errorHandler.forbidden).toHaveBeenCalledWith(
                    'status of Account must not be equal to deleted',
                    'Forbidden: status of Account cannot have this value',
                );
            });
        });

        describe('Invalid mode', () => {
            it('should throw for unknown mode', () => {
                expect(() =>
                    service.assertState(
                        'active',
                        'active',
                        'INVALID_MODE' as ExistenceCheckModeEnum,
                    ),
                ).toThrow();
                expect(errorHandler.forbidden).toHaveBeenCalledWith(
                    'Unknown ExistenceCheckMode',
                    'Unknown ExistenceCheckMode',
                );
            });
        });
    });

    describe('buildEmailTemplate', () => {
        const mockTemplatePath = '/mock/path/to/template.hbs';
        const mockTemplateContent = '<h1>Hello {{name}}</h1>';

        beforeEach(() => {
            (path.join as jest.Mock).mockReturnValue(mockTemplatePath);
            (fs.readFileSync as jest.Mock).mockReturnValue(mockTemplateContent);
        });

        it('should build email template with provided data', () => {
            const result = service.buildEmailTemplate('templates/email.hbs', {
                name: 'John',
            });

            expect(path.join).toHaveBeenCalledWith(__dirname, 'templates/email.hbs');
            expect(fs.readFileSync).toHaveBeenCalledWith(mockTemplatePath, 'utf8');
            expect(result).toContain('Hello');
        });

        it('should compile template with handlebars', () => {
            const result = service.buildEmailTemplate('templates/welcome.hbs', {
                name: 'Jane',
                email: 'jane@example.com',
            });

            expect(fs.readFileSync).toHaveBeenCalledWith(mockTemplatePath, 'utf8');
            expect(result).toBeDefined();
        });

        it('should handle template with multiple variables', () => {
            (fs.readFileSync as jest.Mock).mockReturnValue('<h1>{{title}}</h1><p>{{message}}</p>');

            const result = service.buildEmailTemplate('templates/notification.hbs', {
                title: 'Welcome',
                message: 'Thank you for joining',
            });

            expect(result).toBeDefined();
            expect(path.join).toHaveBeenCalled();
        });

        it('should join template path correctly', () => {
            service.buildEmailTemplate('emails/reset-password.hbs', {});

            expect(path.join).toHaveBeenCalledWith(__dirname, 'emails/reset-password.hbs');
        });

        it('should read file with utf8 encoding', () => {
            service.buildEmailTemplate('templates/test.hbs', {});

            expect(fs.readFileSync).toHaveBeenCalledWith(mockTemplatePath, 'utf8');
        });

        it('should handle empty template data', () => {
            (fs.readFileSync as jest.Mock).mockReturnValue('<h1>Static Content</h1>');

            const result = service.buildEmailTemplate('templates/static.hbs', {});

            expect(result).toBeDefined();
        });

        it('should handle nested template paths', () => {
            service.buildEmailTemplate('emails/auth/verify.hbs', {
                code: '123456',
            });

            expect(path.join).toHaveBeenCalledWith(__dirname, 'emails/auth/verify.hbs');
        });

        it('should throw error if template file does not exist', () => {
            (fs.readFileSync as jest.Mock).mockImplementation(() => {
                throw new Error('ENOENT: no such file or directory');
            });

            expect(() => service.buildEmailTemplate('nonexistent.hbs', {})).toThrow(
                'ENOENT: no such file or directory',
            );
        });

        it('should handle template with conditional blocks', () => {
            (fs.readFileSync as jest.Mock).mockReturnValue(
                '{{#if verified}}<p>Verified</p>{{/if}}',
            );

            const result = service.buildEmailTemplate('templates/status.hbs', {
                verified: true,
            });

            expect(result).toBeDefined();
        });

        it('should handle template with loops', () => {
            (fs.readFileSync as jest.Mock).mockReturnValue(
                '{{#each items}}<li>{{this}}</li>{{/each}}',
            );

            const result = service.buildEmailTemplate('templates/list.hbs', {
                items: ['Item 1', 'Item 2', 'Item 3'],
            });

            expect(result).toBeDefined();
        });

        it('should sanitize string fields before passing to template', () => {
            (fs.readFileSync as jest.Mock).mockReturnValue('<p>{{{content}}}</p>');

            service.buildEmailTemplate('templates/email.hbs', {
                content: '<script>alert("xss")</script>Hello',
            });

            expect(sanitizeHtml).toHaveBeenCalledWith(
                '<script>alert("xss")</script>Hello',
                expect.objectContaining({
                    allowedTags: expect.arrayContaining(['b', 'strong', 'br', 'a', 'span']),
                    allowedAttributes: expect.objectContaining({ a: ['href'], span: ['style'] }),
                    allowedSchemes: ['https'],
                }),
            );
        });

        it('should sanitize all string fields in data', () => {
            (fs.readFileSync as jest.Mock).mockReturnValue('<p>{{name}} {{{content}}}</p>');

            service.buildEmailTemplate('templates/email.hbs', {
                name: 'John<b>',
                content: '<em>Hello</em>',
            });

            expect(sanitizeHtml).toHaveBeenCalledTimes(2);
        });

        it('should not sanitize non-string fields', () => {
            (fs.readFileSync as jest.Mock).mockReturnValue('<p>{{count}}</p>');

            service.buildEmailTemplate('templates/email.hbs', {
                count: 42,
                flag: true,
                data: { nested: 'obj' },
            });

            expect(sanitizeHtml).not.toHaveBeenCalled();
        });

        it('should preserve non-string fields unchanged in template output', () => {
            (fs.readFileSync as jest.Mock).mockReturnValue('<p>{{count}}</p>');

            const result = service.buildEmailTemplate('templates/email.hbs', {
                count: 99,
            });

            expect(result).toContain('99');
        });

        it('should handle mixed string and non-string fields', () => {
            (fs.readFileSync as jest.Mock).mockReturnValue('<p>{{name}} {{count}}</p>');

            service.buildEmailTemplate('templates/email.hbs', {
                name: 'Alice',
                count: 5,
                active: true,
            });

            expect(sanitizeHtml).toHaveBeenCalledTimes(1);
            expect(sanitizeHtml).toHaveBeenCalledWith('Alice', expect.any(Object));
        });
    });

    describe('formatCriteria', () => {
        it('should format single key-value pair', () => {
            const result = service.formatCriteria({ name: 'John' });
            expect(result).toBe('name: John');
        });

        it('should format multiple key-value pairs with comma separation', () => {
            const result = service.formatCriteria({
                name: 'John',
                age: 30,
                city: 'Paris',
            });
            expect(result).toBe('name: John, age: 30, city: Paris');
        });

        it('should handle empty object', () => {
            const result = service.formatCriteria({});
            expect(result).toBe('');
        });

        it('should handle boolean values', () => {
            const result = service.formatCriteria({
                isActive: true,
                isVerified: false,
            });
            expect(result).toBe('isActive: true, isVerified: false');
        });

        it('should handle null values', () => {
            const result = service.formatCriteria({
                status: null,
                role: 'admin',
            });
            expect(result).toBe('status: null, role: admin');
        });

        it('should handle undefined values', () => {
            const result = service.formatCriteria({
                email: undefined,
                name: 'Jane',
            });
            expect(result).toBe('email: undefined, name: Jane');
        });

        it('should handle numeric values', () => {
            const result = service.formatCriteria({
                count: 0,
                price: 99.99,
                quantity: -5,
            });
            expect(result).toBe('count: 0, price: 99.99, quantity: -5');
        });

        it('should handle array values', () => {
            const result = service.formatCriteria({
                tags: ['tag1', 'tag2'],
                ids: [1, 2, 3],
            });
            expect(result).toBe('tags: tag1,tag2, ids: 1,2,3');
        });

        it('should handle object values', () => {
            const result = service.formatCriteria({
                user: { id: 1, name: 'John' },
                metadata: { version: 2 },
            });
            expect(result).toBe('user: [object Object], metadata: [object Object]');
        });

        it('should handle string values with special characters', () => {
            const result = service.formatCriteria({
                message: 'Hello, World!',
                path: '/api/v1/users',
            });
            expect(result).toBe('message: Hello, World!, path: /api/v1/users');
        });

        it('should maintain key order for consistent results', () => {
            const criteria = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
            };
            const result = service.formatCriteria(criteria);
            expect(result).toContain('firstName: John');
            expect(result).toContain('lastName: Doe');
            expect(result).toContain('email: john@example.com');
        });

        it('should handle empty string values', () => {
            const result = service.formatCriteria({
                name: '',
                description: '',
            });
            expect(result).toBe('name: , description: ');
        });

        it('should handle date objects', () => {
            const date = new Date('2025-01-18');
            const result = service.formatCriteria({
                createdAt: date,
            });
            expect(result).toContain('createdAt: ');
            expect(result).toContain(date.toString());
        });
    });

    describe('paginateResultsFromCache', () => {
        it('should return paginated results with correct metadata', () => {
            const results = [{ id: 1 }, { id: 2 }, { id: 3 }];
            const result = service.paginateResultsFromCache(results, 10, 2, 5);

            expect(result).toEqual({
                data: results,
                total: 10,
                page: 2,
                limit: 5,
            });
        });

        it('should return empty object when results array is empty', () => {
            const result = service.paginateResultsFromCache([], 0, 1, 10);

            expect(result).toEqual({
                data: [],
                total: 0,
                page: 0,
                limit: 10,
            });
        });

        it('should return empty object when results is null', () => {
            const result = service.paginateResultsFromCache(null!, 0, 1, 10);

            expect(result).toEqual({
                data: [],
                total: 0,
                page: 0,
                limit: 10,
            });
        });

        it('should return empty object when results is undefined', () => {
            const result = service.paginateResultsFromCache(undefined!, 0, 1, 10);

            expect(result).toEqual({
                data: [],
                total: 0,
                page: 0,
                limit: 10,
            });
        });

        it('should throw error when results is not an array', () => {
            expect(() =>
                service.paginateResultsFromCache('not an array' as any, 10, 1, 10),
            ).toThrow('Expected an array');
            expect(mockErrorHandler.fail).toHaveBeenCalledWith('Expected an array');
        });

        it('should default page to 1 when page < 1', () => {
            const results = [{ id: 1 }];
            const result = service.paginateResultsFromCache(results, 5, 0, 10);

            expect(result).toEqual({
                data: results,
                total: 5,
                page: 1,
                limit: 10,
            });
        });

        it('should default page to 1 when page is negative', () => {
            const results = [{ id: 1 }];
            const result = service.paginateResultsFromCache(results, 5, -3, 10);

            expect(result).toEqual({
                data: results,
                total: 5,
                page: 1,
                limit: 10,
            });
        });

        it('should default limit to 10 when limit < 1', () => {
            const results = [{ id: 1 }];
            const result = service.paginateResultsFromCache(results, 5, 1, 0);

            expect(result).toEqual({
                data: results,
                total: 5,
                page: 1,
                limit: 10,
            });
        });

        it('should default limit to 10 when limit is negative', () => {
            const results = [{ id: 1 }];
            const result = service.paginateResultsFromCache(results, 5, 1, -5);

            expect(result).toEqual({
                data: results,
                total: 5,
                page: 1,
                limit: 10,
            });
        });

        it('should handle both page and limit defaults', () => {
            const results = [{ id: 1 }];
            const result = service.paginateResultsFromCache(results, 5, -1, -1);

            expect(result).toEqual({
                data: results,
                total: 5,
                page: 1,
                limit: 10,
            });
        });

        it('should handle large result sets', () => {
            const results = Array.from({ length: 100 }, (_, i) => ({ id: i }));
            const result = service.paginateResultsFromCache(results, 1000, 5, 100);

            expect(result).toEqual({
                data: results,
                total: 1000,
                page: 5,
                limit: 100,
            });
        });

        it('should handle single item result', () => {
            const results = [{ id: 1 }];
            const result = service.paginateResultsFromCache(results, 1, 1, 1);

            expect(result).toEqual({
                data: results,
                total: 1,
                page: 1,
                limit: 1,
            });
        });

        it('should preserve original results array', () => {
            const results = [{ id: 1 }, { id: 2 }];
            const result = service.paginateResultsFromCache(results, 10, 1, 10);

            expect(result['data']).toBe(results);
            expect(result['data']).toEqual(results);
        });
    });

    describe('isDateTodayOrFuture', () => {
        it('should return true for today', () => {
            const today = new Date();
            expect(service.isDateTodayOrFuture(today)).toBe(true);
        });

        it('should return true for future date', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 10);
            expect(service.isDateTodayOrFuture(futureDate)).toBe(true);
        });

        it('should return false for past date', () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);
            expect(service.isDateTodayOrFuture(pastDate)).toBe(false);
        });

        it('should return true for today even with different hours', () => {
            const todayMorning = new Date();
            todayMorning.setHours(8, 30, 0, 0);
            expect(service.isDateTodayOrFuture(todayMorning)).toBe(true);
        });

        it('should normalize time to midnight when comparing', () => {
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            expect(service.isDateTodayOrFuture(today)).toBe(true);
        });

        it('should handle date strings', () => {
            const futureDate = new Date('2030-12-31T00:00:00.000Z');
            expect(service.isDateTodayOrFuture(futureDate)).toBe(true);
        });

        it('should return false for yesterday', () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(23, 59, 59, 999);
            expect(service.isDateTodayOrFuture(yesterday)).toBe(false);
        });

        it('should return true for tomorrow', () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            expect(service.isDateTodayOrFuture(tomorrow)).toBe(true);
        });
    });

    describe('isEndDateValid', () => {
        it('should return true when endDate equals startDate', () => {
            const date = new Date('2026-12-01T00:00:00.000Z');
            expect(service.isEndDateValid(date, date)).toBe(true);
        });

        it('should return true when endDate is after startDate', () => {
            const startDate = new Date('2026-12-01T00:00:00.000Z');
            const endDate = new Date('2026-12-31T00:00:00.000Z');
            expect(service.isEndDateValid(startDate, endDate)).toBe(true);
        });

        it('should return false when endDate is before startDate', () => {
            const startDate = new Date('2026-12-31T00:00:00.000Z');
            const endDate = new Date('2026-12-01T00:00:00.000Z');
            expect(service.isEndDateValid(startDate, endDate)).toBe(false);
        });

        it('should handle dates with different times on same day', () => {
            const startDate = new Date('2026-12-01T08:00:00.000Z');
            const endDate = new Date('2026-12-01T18:00:00.000Z');
            expect(service.isEndDateValid(startDate, endDate)).toBe(true);
        });

        it('should return true when endDate is one day after startDate', () => {
            const startDate = new Date('2026-12-01T00:00:00.000Z');
            const endDate = new Date('2026-12-02T00:00:00.000Z');
            expect(service.isEndDateValid(startDate, endDate)).toBe(true);
        });

        it('should return true when endDate is far in the future', () => {
            const startDate = new Date('2026-12-01T00:00:00.000Z');
            const endDate = new Date('2030-12-31T00:00:00.000Z');
            expect(service.isEndDateValid(startDate, endDate)).toBe(true);
        });

        it('should handle date strings', () => {
            const startDate = new Date('2026-01-01');
            const endDate = new Date('2026-12-31');
            expect(service.isEndDateValid(startDate, endDate)).toBe(true);
        });
    });

    describe('validateAdsDates', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should not throw when both dates are valid', () => {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + 1);
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 7);

            expect(() => service.validateAdsDates(startDate, endDate)).not.toThrow();
        });

        it('should throw when startDate is in the past', () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 5);
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 7);

            expect(() => service.validateAdsDates(pastDate, endDate)).toThrow();
        });

        it('should throw when endDate is before startDate', () => {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + 10);
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 5);

            expect(() => service.validateAdsDates(startDate, endDate)).toThrow();
        });

        it('should throw when both startDate is past and endDate is before startDate', () => {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 10);
            const endDate = new Date();
            endDate.setDate(endDate.getDate() - 15);

            expect(() => service.validateAdsDates(startDate, endDate)).toThrow();
        });

        it('should accept when startDate is today', () => {
            const today = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 7);

            expect(() => service.validateAdsDates(today, endDate)).not.toThrow();
        });

        it('should accept when startDate and endDate are the same', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 5);

            expect(() => service.validateAdsDates(futureDate, futureDate)).not.toThrow();
        });

        it('should throw with both error messages when both validations fail', () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 5);
            const endDate = new Date();
            endDate.setDate(endDate.getDate() - 10);

            expect(() => service.validateAdsDates(pastDate, endDate)).toThrow();
        });

        it('should handle dates with time components correctly', () => {
            const startDate = new Date();
            startDate.setHours(23, 59, 59, 999);
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 1);
            endDate.setHours(0, 0, 0, 0);

            expect(() => service.validateAdsDates(startDate, endDate)).not.toThrow();
        });

        it('should accept far future dates', () => {
            const startDate = new Date('2030-01-01T00:00:00.000Z');
            const endDate = new Date('2030-12-31T00:00:00.000Z');

            expect(() => service.validateAdsDates(startDate, endDate)).not.toThrow();
        });

        it('should handle ISO 8601 date strings', () => {
            const startDate = new Date('2026-12-01T00:00:00.000Z');
            const endDate = new Date('2026-12-31T23:59:59.999Z');

            expect(() => service.validateAdsDates(startDate, endDate)).not.toThrow();
        });
    });
});

describe('GlobalUtils', () => {
    let globalUtils: GlobalUtils;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ConfigUtils,
                FilesUtils,
                OtherUtils,
                AuthUtils,
                GlobalUtils,
                ConfigService,
                ErrorHandlerService,
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: {
                        error: jest.fn(),
                        warn: jest.fn(),
                    },
                },
            ],
        }).compile();

        globalUtils = module.get<GlobalUtils>(GlobalUtils);
        module.get<ConfigService>(ConfigService);
    });

    it('should provide access to config utils', () => {
        expect(globalUtils.config).toBeInstanceOf(ConfigUtils);
        expect(globalUtils.config.parseNumber('42', 'TEST')).toBe(42);
    });

    it('should provide access to files utils', () => {
        expect(globalUtils.files).toBeInstanceOf(FilesUtils);
        expect(globalUtils.files.sanitizeFilename('test file.pdf')).toBe('test_file.pdf');
    });

    it('should provide access to auth utils', () => {
        expect(globalUtils.auth).toBeInstanceOf(AuthUtils);
        expect(globalUtils.auth.hashToken('test-token-123')).toHaveLength(64);
    });

    it('should provide access to other utils', () => {
        expect(globalUtils.others).toBeInstanceOf(OtherUtils);
        const result = globalUtils.others.validateAndParsePhone('+33612345678');
        expect(result.country).toBe('FR');
    });
});
