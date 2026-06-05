import { Test, TestingModule } from '@nestjs/testing';
import * as Minio from 'minio';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ConfigService } from '@nestjs/config';
import { MinioService } from './minio.service';
import { ErrorHandlerService } from '../../../common/response/errorHandler.service';
import { FilesUtils } from '../../../utils/services/tools';

describe('MinioModule', () => {
    let module: TestingModule;
    let minioService: MinioService;
    let minioClient: Minio.Client;

    beforeEach(async () => {
        const mockConfigService = {
            get: jest.fn((key: string, defaultValue?: any) => {
                const config = {
                    MINIO_ENDPOINT: 'localhost',
                    MINIO_PORT: '9000',
                    MINIO_USE_SSL: 'false',
                    MINIO_ROOT_USER: 'minioadmin',
                    MINIO_ROOT_PASSWORD: 'minioadmin',
                    MINIO_BUCKET_NAME: 'test-bucket',
                };
                return config[key] ?? defaultValue;
            }),
        };

        module = await Test.createTestingModule({
            providers: [
                MinioService,
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
                {
                    provide: 'MINIO_CLIENT',
                    useFactory: (configService: ConfigService) => {
                        return new Minio.Client({
                            endPoint: configService.get<string>('MINIO_ENDPOINT', 'localhost'),
                            port: Number.parseInt(
                                configService.get<string>('MINIO_PORT', '9000'),
                                10,
                            ),
                            useSSL: configService.get<string>('MINIO_USE_SSL') === 'true',
                            accessKey: configService.get<string>('MINIO_ROOT_USER', 'minioadmin'),
                            secretKey: configService.get<string>(
                                'MINIO_ROOT_PASSWORD',
                                'minioadmin',
                            ),
                        });
                    },
                    inject: [ConfigService],
                },
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: {
                        log: jest.fn(),
                        error: jest.fn(),
                        warn: jest.fn(),
                        debug: jest.fn(),
                        info: jest.fn(),
                    },
                },
                {
                    provide: ErrorHandlerService,
                    useValue: {
                        fail: jest.fn(),
                    },
                },
                {
                    provide: FilesUtils,
                    useValue: {
                        sanitizeFilename: jest.fn(),
                    },
                },
            ],
        }).compile();

        minioService = module.get<MinioService>(MinioService);
        minioClient = module.get<Minio.Client>('MINIO_CLIENT');
    });

    it('should be defined', () => {
        expect(minioService).toBeDefined();
        expect(minioClient).toBeDefined();
    });

    it('should be a Minio client instance', () => {
        expect(minioClient).toBeInstanceOf(Minio.Client);
    });

    it('should have correct minio configuration', () => {
        expect(minioClient).toBeDefined();
        expect(minioClient.bucketExists).toBeDefined();
        expect(minioClient.putObject).toBeDefined();
    });
});
