import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { MinioService } from './minio.service';
import { ErrorHandlerService } from '../../../common/response/errorHandler.service';
import { FilesUtils } from '../../../utils/services/tools';

describe('MinioService', () => {
    let service: MinioService;
    let mockLogger: any;
    let mockMinioClient: any;
    let mockConfigService: any;
    let mockErrorHandlerService: any;
    let mockFilesUtils: any;

    beforeEach(async () => {
        mockLogger = {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            info: jest.fn(),
        };

        mockMinioClient = {
            bucketExists: jest.fn(),
            makeBucket: jest.fn(),
            putObject: jest.fn(),
            removeObject: jest.fn(),
            presignedGetObject: jest.fn(),
        };

        mockConfigService = {
            get: jest.fn((key: string) => {
                const config: Record<string, string> = {
                    MINIO_BUCKET_NAME: 'test-bucket',
                    MINIO_ENDPOINT: 'localhost',
                    MINIO_PORT: '9000',
                    MINIO_USE_SSL: 'false',
                    MINIO_ROOT_USER: 'minioadmin',
                    MINIO_ROOT_PASSWORD: 'minioadmin',
                };
                return config[key];
            }),
        };

        mockErrorHandlerService = {
            fail: jest.fn(),
        };

        mockFilesUtils = {
            generateObjectName: jest.fn((uuid: string, filename: string) => {
                return `${uuid}/${filename}`;
            }),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MinioService,
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: mockLogger,
                },
                {
                    provide: 'MINIO_CLIENT',
                    useValue: mockMinioClient,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
                {
                    provide: FilesUtils,
                    useValue: mockFilesUtils,
                },
            ],
        }).compile();

        service = module.get<MinioService>(MinioService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should have correct bucket name', () => {
        expect(service.bucketName).toBe('test-bucket');
    });

    describe('ensureBucketExists', () => {
        it('should not create bucket if it already exists', async () => {
            const bucketName = 'test-bucket';
            mockMinioClient.bucketExists.mockResolvedValue(true);

            await service.ensureBucketExists(bucketName);

            expect(mockMinioClient.bucketExists).toHaveBeenCalledWith(bucketName);
            expect(mockMinioClient.makeBucket).not.toHaveBeenCalled();
        });

        it('should create bucket if it does not exist', async () => {
            const bucketName = 'new-bucket';
            mockMinioClient.bucketExists.mockResolvedValue(false);
            mockMinioClient.makeBucket.mockResolvedValue(undefined);

            await service.ensureBucketExists(bucketName);

            expect(mockMinioClient.bucketExists).toHaveBeenCalledWith(bucketName);
            expect(mockLogger.info).toHaveBeenCalledWith(
                `Bucket ${bucketName} does not exist. Creating...`,
            );
            expect(mockMinioClient.makeBucket).toHaveBeenCalledWith(bucketName);
        });
    });

    describe('generatePresignedUrl', () => {
        it('should generate presigned URL successfully', async () => {
            const bucketName = 'test-bucket';
            const objectName = 'test-uuid/test.jpg';
            const mimetype = 'image/jpeg';
            const expectedUrl = 'https://minio.example.com/presigned-url';

            mockMinioClient.presignedGetObject.mockResolvedValue(expectedUrl);

            const result = await service.generatePresignedUrl(bucketName, objectName, mimetype);

            expect(mockMinioClient.presignedGetObject).toHaveBeenCalledWith(
                bucketName,
                objectName,
                604800,
                {
                    'response-content-disposition': 'inline',
                    'response-content-type': mimetype,
                },
            );
            expect(result).toBe(expectedUrl);
        });
    });

    describe('uploadFile', () => {
        it('should upload file successfully', async () => {
            const mockFile = {
                fieldname: 'file',
                originalname: 'test.jpg',
                encoding: '7bit',
                mimetype: 'image/jpeg',
                size: 1024,
                buffer: Buffer.from('test'),
                stream: null,
                destination: '',
                filename: '',
                path: '',
            } as unknown as Express.Multer.File;
            const uuid = 'test-uuid-123';
            const expectedUrl = 'https://minio.example.com/presigned-url';

            mockMinioClient.bucketExists.mockResolvedValue(true);
            mockMinioClient.putObject.mockResolvedValue(undefined);
            mockMinioClient.presignedGetObject.mockResolvedValue(expectedUrl);

            const result = await service.uploadFile(mockFile, uuid);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Uploading file: ${mockFile.originalname}`,
            );
            expect(mockFilesUtils.generateObjectName).toHaveBeenCalledWith(
                uuid,
                mockFile.originalname,
            );
            expect(mockMinioClient.bucketExists).toHaveBeenCalledWith('test-bucket');
            expect(mockMinioClient.putObject).toHaveBeenCalledWith(
                'test-bucket',
                'test-uuid-123/test.jpg',
                mockFile.buffer,
            );
            expect(result).toBe(expectedUrl);
        });

        it('should create bucket if it does not exist during upload', async () => {
            const mockFile = {
                fieldname: 'file',
                originalname: 'test.jpg',
                encoding: '7bit',
                mimetype: 'image/jpeg',
                size: 1024,
                buffer: Buffer.from('test'),
                stream: null,
                destination: '',
                filename: '',
                path: '',
            } as unknown as Express.Multer.File;
            const uuid = 'test-uuid-123';
            const expectedUrl = 'https://minio.example.com/presigned-url';

            mockMinioClient.bucketExists.mockResolvedValue(false);
            mockMinioClient.makeBucket.mockResolvedValue(undefined);
            mockMinioClient.putObject.mockResolvedValue(undefined);
            mockMinioClient.presignedGetObject.mockResolvedValue(expectedUrl);

            const result = await service.uploadFile(mockFile, uuid);

            expect(mockMinioClient.bucketExists).toHaveBeenCalledWith('test-bucket');
            expect(mockMinioClient.makeBucket).toHaveBeenCalledWith('test-bucket');
            expect(result).toBe(expectedUrl);
        });

        it('should handle upload errors', async () => {
            const mockFile = {
                fieldname: 'file',
                originalname: 'test.jpg',
                encoding: '7bit',
                mimetype: 'image/jpeg',
                size: 1024,
                buffer: Buffer.from('test'),
                stream: null,
                destination: '',
                filename: '',
                path: '',
            } as unknown as Express.Multer.File;
            const uuid = 'test-uuid-123';
            const error = new Error('Upload failed');

            mockMinioClient.bucketExists.mockResolvedValue(true);
            mockMinioClient.putObject.mockRejectedValue(error);

            await service.uploadFile(mockFile, uuid);

            expect(mockErrorHandlerService.fail).toHaveBeenCalledWith(
                expect.stringContaining('Error uploading file:'),
                expect.stringContaining('Upload failed'),
            );
        });
    });

    describe('deleteFile', () => {
        it('should delete file successfully', async () => {
            const objectName = 'test-uuid-123/test.jpg';

            mockMinioClient.removeObject.mockResolvedValue(undefined);

            const result = await service.deleteFile(objectName);

            expect(mockMinioClient.removeObject).toHaveBeenCalledWith('test-bucket', objectName);
            expect(result).toEqual({ message: 'File deleted successfully' });
        });

        it('should handle delete errors', async () => {
            const objectName = 'test-uuid-123/test.jpg';
            const error = { message: 'Delete failed' };

            mockMinioClient.removeObject.mockRejectedValue(error);

            await service.deleteFile(objectName);

            expect(mockErrorHandlerService.fail).toHaveBeenCalledWith(
                'Error deleting file: Delete failed',
                'Error deleting file: Delete failed',
            );
        });
    });
});
