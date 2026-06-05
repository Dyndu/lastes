import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { S3Client } from '@aws-sdk/client-s3';
import { AwsService } from './aws.service';
import { ErrorHandlerService } from '../../../common/response/errorHandler.service';
import { FilesUtils } from '../../../utils/services/tools';

jest.mock('@aws-sdk/client-s3');

describe('AwsService', () => {
    let service: AwsService;
    let mockLogger: any;
    let mockConfigService: any;
    let mockFilesUtils: any;
    let mockErrorHandlerService: any;
    let mockS3Client: any;

    beforeEach(async () => {
        mockLogger = {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            info: jest.fn(),
        };

        mockConfigService = {
            get: jest.fn((key: string) => {
                const config: Record<string, string> = {
                    AWS_BUCKET_NAME: 'test-bucket',
                    AWS_ENDPOINT: 's3.amazonaws.com',
                    AWS_REGION: 'us-east-1',
                    AWS_ACCESS_KEY_ID: 'test-access-key',
                    AWS_SECRET_KEY: 'test-secret-key',
                };
                return config[key];
            }),
        };

        mockFilesUtils = {
            generateObjectName: jest.fn((uuid: string, filename: string) => {
                return `${uuid}/${filename}`;
            }),
        };

        mockErrorHandlerService = {
            fail: jest.fn(),
        };

        mockS3Client = {
            send: jest.fn(),
        };

        (S3Client as jest.MockedClass<typeof S3Client>).mockImplementation(() => mockS3Client);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AwsService,
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: mockLogger,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
                {
                    provide: FilesUtils,
                    useValue: mockFilesUtils,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
            ],
        }).compile();

        service = module.get<AwsService>(AwsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should initialize S3Client with correct configuration', () => {
        expect(S3Client).toHaveBeenCalledWith({
            region: 'us-east-1',
            endpoint: 'https://s3.amazonaws.com',
            credentials: {
                accessKeyId: 'test-access-key',
                secretAccessKey: 'test-secret-key',
            },
            forcePathStyle: true,
        });
    });

    it('should have correct bucket name and endpoint', () => {
        expect(service.bucketName).toBe('test-bucket');
        expect(service.awsEndpoint).toBe('https://s3.amazonaws.com');
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

            mockS3Client.send.mockResolvedValue({});

            const result = await service.uploadFile(mockFile, uuid);

            expect(mockLogger.info).toHaveBeenCalledWith('Uploading file in AWS S3 bucket');
            expect(mockFilesUtils.generateObjectName).toHaveBeenCalledWith(
                uuid,
                mockFile.originalname,
            );
            expect(mockS3Client.send).toHaveBeenCalled();
            expect(result).toBe('https://s3.amazonaws.com/test-bucket/test-uuid-123/test.jpg');
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

            mockS3Client.send.mockRejectedValue(error);

            await service.uploadFile(mockFile, uuid);

            expect(mockErrorHandlerService.fail).toHaveBeenCalledWith(
                'Error uploading file to S3: Upload failed',
                'Error: Upload failed',
            );
        });
    });

    describe('deleteFile', () => {
        it('should delete file successfully', async () => {
            const path = 'https://s3.amazonaws.com/test-bucket/test-uuid-123/test.jpg';

            mockS3Client.send.mockResolvedValue({});

            const result = await service.deleteFile(path);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Delete file by path: ${path} from aws store`,
            );
            expect(mockS3Client.send).toHaveBeenCalled();
            expect(result).toEqual({ message: 'File deleted successfully' });
        });

        it('should handle delete errors', async () => {
            const path = 'https://s3.amazonaws.com/test-bucket/test-uuid-123/test.jpg';
            const error = new Error('Delete failed');

            mockS3Client.send.mockRejectedValue(error);

            await service.deleteFile(path);

            expect(mockErrorHandlerService.fail).toHaveBeenCalledWith(
                'Error deleting file: Delete failed',
                'Error deleting file: Delete failed',
            );
        });

        it('should extract correct key from path', async () => {
            const path = 'https://s3.amazonaws.com/test-bucket/folder/subfolder/file.jpg';

            mockS3Client.send.mockResolvedValue({});

            await service.deleteFile(path);

            expect(mockS3Client.send).toHaveBeenCalled();
        });
    });
});
