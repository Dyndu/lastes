import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { FilesService } from './files.service';
import fromBuffer from 'image-size';
import { FileStorageInterface } from '../../../interface';
import { GlobalUtils } from '../../../utils/services/tools';
import { FilesRepository } from '../repositories/files.repository';
import { FileTypeEnum } from '../../../common/enum';
import { FileEntity } from '../entities/file.entity';
import { FileLinksRepository } from '../repositories/file-links.repository';
import { NotFoundException } from '@nestjs/common';
import { ErrorHandlerService } from '../../../common/response';
import { FileLinksService } from './file-links.service';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

jest.mock('image-size', () => ({
    __esModule: true,
    default: jest.fn(),
}));

describe('FilesService', () => {
    let service: FilesService;
    let filesRepository: any;
    let storage: any;
    let globalUtils: any;
    let logger: any;

    const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    };

    const mockStorage: Partial<FileStorageInterface> = {
        uploadFile: jest.fn(),
    };

    const mockFilesRepository = {
        create: jest.fn(),
        createMany: jest.fn(),
        findActiveOne: jest.fn(),
    };

    const mockFileLinksRepository = {
        create: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
    };

    const mockErrorHandlerService = {
        notFound: jest.fn((_msg, userMsg) => {
            throw new NotFoundException(userMsg);
        }),
    };

    const mockGlobalUtils = {
        files: {
            determineFileType: jest.fn(),
            generateObjectName: jest.fn(),
        },
        others: {
            formatCriteria: jest.fn((criteria) => JSON.stringify(criteria)),
        },
    };

    const mockFileLinksService = {};

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FilesService,
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: mockLogger,
                },
                {
                    provide: 'FileStorageInterface',
                    useValue: mockStorage,
                },
                {
                    provide: FilesRepository,
                    useValue: mockFilesRepository,
                },
                {
                    provide: FileLinksRepository,
                    useValue: mockFileLinksRepository,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
                {
                    provide: GlobalUtils,
                    useValue: mockGlobalUtils,
                },
                {
                    provide: FileLinksService,
                    useValue: mockFileLinksService,
                },
            ],
        }).compile();

        service = module.get<FilesService>(FilesService);
        filesRepository = module.get(FilesRepository);
        storage = module.get('FileStorageInterface');
        globalUtils = module.get(GlobalUtils);
        logger = module.get(WINSTON_MODULE_PROVIDER);
        module.get(ErrorHandlerService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('retrieveFileByCriteria', () => {
        it('should retrieve file when found', async () => {
            const criteria = { id: 'file-123' };
            const mockFile = {
                id: 'file-123',
                label: 'test.pdf',
            } as FileEntity;

            mockFilesRepository.findActiveOne.mockResolvedValue(mockFile);

            const result = await service.retrieveFileByCriteria(criteria);

            expect(globalUtils.others.formatCriteria).toHaveBeenCalledWith(criteria);
            expect(logger.info).toHaveBeenCalledWith(
                `Finding a file by criteria ${JSON.stringify(criteria)}`,
            );
            expect(mockFilesRepository.findActiveOne).toHaveBeenCalledWith(
                mockFilesRepository,
                criteria,
            );
            expect(result).toEqual(mockFile);
        });

        it('should throw not found error when file does not exist', async () => {
            const criteria = { id: 'non-existent' };

            mockFilesRepository.findActiveOne.mockResolvedValue(null);

            await expect(service.retrieveFileByCriteria(criteria)).rejects.toThrow(
                NotFoundException,
            );

            expect(mockErrorHandlerService.notFound).toHaveBeenCalledWith(
                `File not found with entry ${JSON.stringify(criteria)}`,
                'File not found',
            );
        });

        it('should handle different criteria', async () => {
            const criteria = { path: '/uploads/test.jpg' };
            const mockFile = { id: 'file-456' } as FileEntity;

            mockFilesRepository.findActiveOne.mockResolvedValue(mockFile);

            await service.retrieveFileByCriteria(criteria);

            expect(globalUtils.others.formatCriteria).toHaveBeenCalledWith(criteria);
        });
    });

    describe('logicBeforeSavingFile', () => {
        it('should process and create file entities for non-image file', async () => {
            const mockFile: Express.Multer.File = {
                fieldname: 'file',
                originalname: 'document.pdf',
                encoding: '7bit',
                mimetype: 'application/pdf',
                size: 1024,
                buffer: Buffer.from('test'),
                stream: null as any,
                destination: '',
                filename: 'document.pdf',
                path: '',
            };

            const mockPath = 'storage/path/mock-uuid-1234-document.pdf';
            (storage.uploadFile as jest.Mock).mockResolvedValue(mockPath);
            (globalUtils.files.determineFileType as jest.Mock).mockReturnValue(
                FileTypeEnum.DOCUMENT,
            );
            (globalUtils.files.generateObjectName as jest.Mock).mockReturnValue(
                'mock-uuid-1234-document.pdf',
            );

            const result = await service.logicBeforeSavingFile(mockFile);

            expect(storage.uploadFile).toHaveBeenCalledWith(mockFile, 'mock-uuid-1234');
            expect(globalUtils.files.determineFileType).toHaveBeenCalledWith('application/pdf');
            expect(globalUtils.files.generateObjectName).toHaveBeenCalledWith(
                'mock-uuid-1234',
                'document.pdf',
            );
            expect(result).toBeInstanceOf(FileEntity);
            expect(result.label).toBe('mock-uuid-1234-document.pdf');
            expect(result.path).toBe(mockPath);
            expect(result.size).toBe(1024);
            expect(result.type).toBe(FileTypeEnum.DOCUMENT);
            expect(result.width).toBeUndefined();
            expect(result.height).toBeUndefined();
        });

        it('should process and create file entities with dimensions for image file', async () => {
            const mockFile: Express.Multer.File = {
                fieldname: 'file',
                originalname: 'photo.jpg',
                encoding: '7bit',
                mimetype: 'image/jpeg',
                size: 2048,
                buffer: Buffer.from('fake-image-data'),
                stream: null as any,
                destination: '',
                filename: 'photo.jpg',
                path: '',
            };

            const mockPath = 'storage/path/mock-uuid-1234-photo.jpg';
            (storage.uploadFile as jest.Mock).mockResolvedValue(mockPath);
            (globalUtils.files.determineFileType as jest.Mock).mockReturnValue(FileTypeEnum.IMAGE);
            (globalUtils.files.generateObjectName as jest.Mock).mockReturnValue(
                'mock-uuid-1234-photo.jpg',
            );
            (fromBuffer as jest.Mock).mockReturnValue({
                width: 800,
                height: 600,
            });

            const result = await service.logicBeforeSavingFile(mockFile);

            expect(storage.uploadFile).toHaveBeenCalledWith(mockFile, 'mock-uuid-1234');
            expect(globalUtils.files.determineFileType).toHaveBeenCalledWith('image/jpeg');
            expect(globalUtils.files.generateObjectName).toHaveBeenCalledWith(
                'mock-uuid-1234',
                'photo.jpg',
            );
            expect(fromBuffer).toHaveBeenCalledWith(mockFile.buffer);
            expect(result).toBeInstanceOf(FileEntity);
            expect(result.label).toBe('mock-uuid-1234-photo.jpg');
            expect(result.path).toBe(mockPath);
            expect(result.size).toBe(2048);
            expect(result.type).toBe(FileTypeEnum.IMAGE);
            expect(result.width).toBe(800);
            expect(result.height).toBe(600);
        });

        it('should handle video file type', async () => {
            const mockFile: Express.Multer.File = {
                fieldname: 'file',
                originalname: 'video.mp4',
                encoding: '7bit',
                mimetype: 'video/mp4',
                size: 5120,
                buffer: Buffer.from('video-data'),
                stream: null as any,
                destination: '',
                filename: 'video.mp4',
                path: '',
            };

            (storage.uploadFile as jest.Mock).mockResolvedValue('storage/path/video.mp4');
            (globalUtils.files.determineFileType as jest.Mock).mockReturnValue(FileTypeEnum.VIDEO);
            (globalUtils.files.generateObjectName as jest.Mock).mockReturnValue(
                'mock-uuid-1234-video.mp4',
            );

            const result = await service.logicBeforeSavingFile(mockFile);

            expect(result.type).toBe(FileTypeEnum.VIDEO);
            expect(result.width).toBeUndefined();
            expect(result.height).toBeUndefined();
        });

        it('should handle image with different dimensions', async () => {
            const mockFile: Express.Multer.File = {
                fieldname: 'file',
                originalname: 'banner.png',
                encoding: '7bit',
                mimetype: 'image/png',
                size: 3072,
                buffer: Buffer.from('image-data'),
                stream: null as any,
                destination: '',
                filename: 'banner.png',
                path: '',
            };

            (storage.uploadFile as jest.Mock).mockResolvedValue('storage/path/banner.png');
            (globalUtils.files.determineFileType as jest.Mock).mockReturnValue(FileTypeEnum.IMAGE);
            (globalUtils.files.generateObjectName as jest.Mock).mockReturnValue(
                'mock-uuid-1234-banner.png',
            );
            (fromBuffer as jest.Mock).mockReturnValue({
                width: 1920,
                height: 1080,
            });

            const result = await service.logicBeforeSavingFile(mockFile);

            expect(result.width).toBe(1920);
            expect(result.height).toBe(1080);
        });
    });

    describe('createFileFromUpload', () => {
        it('should create and save a file entities from upload', async () => {
            const mockFile: Express.Multer.File = {
                fieldname: 'file',
                originalname: 'test.txt',
                encoding: '7bit',
                mimetype: 'text/plain',
                size: 512,
                buffer: Buffer.from('content'),
                stream: null as any,
                destination: '',
                filename: 'test.txt',
                path: '',
            };

            const mockFileEntity = new FileEntity();
            mockFileEntity.label = 'mock-uuid-1234-test.txt';
            mockFileEntity.path = 'storage/path/mock-uuid-1234-test.txt';
            mockFileEntity.size = 512;
            mockFileEntity.type = FileTypeEnum.DOCUMENT;

            const savedFileEntity = { ...mockFileEntity, id: 'file-1' };

            (storage.uploadFile as jest.Mock).mockResolvedValue(mockFileEntity.path);
            (globalUtils.files.determineFileType as jest.Mock).mockReturnValue(
                FileTypeEnum.DOCUMENT,
            );
            (globalUtils.files.generateObjectName as jest.Mock).mockReturnValue(
                'mock-uuid-1234-test.txt',
            );
            (filesRepository.create as jest.Mock).mockResolvedValue(savedFileEntity);

            const result = await service.createFileFromUpload(mockFile);

            expect(logger.info).toHaveBeenCalledWith('Creating file from upload with data');
            expect(filesRepository.create).toHaveBeenCalledWith(expect.any(FileEntity));
            expect(result).toEqual(savedFileEntity);
        });

        it('should create image file with dimensions', async () => {
            const mockFile: Express.Multer.File = {
                fieldname: 'file',
                originalname: 'avatar.jpg',
                encoding: '7bit',
                mimetype: 'image/jpeg',
                size: 1024,
                buffer: Buffer.from('image'),
                stream: null as any,
                destination: '',
                filename: 'avatar.jpg',
                path: '',
            };

            const savedFileEntity = {
                id: 'file-2',
                label: 'mock-uuid-1234-avatar.jpg',
                width: 400,
                height: 400,
            };

            (storage.uploadFile as jest.Mock).mockResolvedValue('storage/path');
            (globalUtils.files.determineFileType as jest.Mock).mockReturnValue(FileTypeEnum.IMAGE);
            (globalUtils.files.generateObjectName as jest.Mock).mockReturnValue(
                'mock-uuid-1234-avatar.jpg',
            );
            (fromBuffer as jest.Mock).mockReturnValue({
                width: 400,
                height: 400,
            });
            (filesRepository.create as jest.Mock).mockResolvedValue(savedFileEntity);

            const result = await service.createFileFromUpload(mockFile);

            expect(fromBuffer).toHaveBeenCalledWith(mockFile.buffer);
            expect(result).toEqual(savedFileEntity);
        });
    });

    describe('createFilesFromUploads', () => {
        it('should create and save multiple file entities from uploads', async () => {
            const mockFiles: Express.Multer.File[] = [
                {
                    fieldname: 'files',
                    originalname: 'file1.txt',
                    encoding: '7bit',
                    mimetype: 'text/plain',
                    size: 100,
                    buffer: Buffer.from('content1'),
                    stream: null as any,
                    destination: '',
                    filename: 'file1.txt',
                    path: '',
                },
                {
                    fieldname: 'files',
                    originalname: 'file2.jpg',
                    encoding: '7bit',
                    mimetype: 'image/jpeg',
                    size: 200,
                    buffer: Buffer.from('content2'),
                    stream: null as any,
                    destination: '',
                    filename: 'file2.jpg',
                    path: '',
                },
            ];

            const savedEntities = [
                { id: 'file-1', label: 'mock-uuid-1234-file1.txt' },
                { id: 'file-2', label: 'mock-uuid-1234-file2.jpg' },
            ];

            (storage.uploadFile as jest.Mock).mockResolvedValue('storage/path/file');
            (globalUtils.files.determineFileType as jest.Mock)
                .mockReturnValueOnce(FileTypeEnum.DOCUMENT)
                .mockReturnValueOnce(FileTypeEnum.IMAGE);
            (globalUtils.files.generateObjectName as jest.Mock)
                .mockReturnValueOnce('mock-uuid-1234-file1.txt')
                .mockReturnValueOnce('mock-uuid-1234-file2.jpg');
            (fromBuffer as jest.Mock).mockReturnValue({
                width: 640,
                height: 480,
            });
            (filesRepository.createMany as jest.Mock).mockResolvedValue(savedEntities);

            const result = await service.createFilesFromUploads(mockFiles);

            expect(logger.info).toHaveBeenCalledWith('Creating multiple files from uploads');
            expect(storage.uploadFile).toHaveBeenCalledTimes(2);
            expect(globalUtils.files.determineFileType).toHaveBeenCalledTimes(2);
            expect(globalUtils.files.generateObjectName).toHaveBeenCalledTimes(2);
            expect(filesRepository.createMany).toHaveBeenCalledWith(
                expect.arrayContaining([expect.any(FileEntity), expect.any(FileEntity)]),
            );
            expect(result).toEqual(savedEntities);
        });

        it('should handle empty array of files', async () => {
            const mockFiles: Express.Multer.File[] = [];
            (filesRepository.createMany as jest.Mock).mockResolvedValue([]);

            const result = await service.createFilesFromUploads(mockFiles);

            expect(logger.info).toHaveBeenCalledWith('Creating multiple files from uploads');
            expect(storage.uploadFile).not.toHaveBeenCalled();
            expect(filesRepository.createMany).toHaveBeenCalledWith([]);
            expect(result).toEqual([]);
        });

        it('should handle multiple images with different dimensions', async () => {
            const mockFiles: Express.Multer.File[] = [
                {
                    fieldname: 'files',
                    originalname: 'img1.png',
                    encoding: '7bit',
                    mimetype: 'image/png',
                    size: 300,
                    buffer: Buffer.from('image1'),
                    stream: null as any,
                    destination: '',
                    filename: 'img1.png',
                    path: '',
                },
                {
                    fieldname: 'files',
                    originalname: 'img2.png',
                    encoding: '7bit',
                    mimetype: 'image/png',
                    size: 400,
                    buffer: Buffer.from('image2'),
                    stream: null as any,
                    destination: '',
                    filename: 'img2.png',
                    path: '',
                },
            ];

            (storage.uploadFile as jest.Mock).mockResolvedValue('storage/path');
            (globalUtils.files.determineFileType as jest.Mock).mockReturnValue(FileTypeEnum.IMAGE);
            (globalUtils.files.generateObjectName as jest.Mock)
                .mockReturnValueOnce('img1.png')
                .mockReturnValueOnce('img2.png');
            (fromBuffer as jest.Mock)
                .mockReturnValueOnce({ width: 100, height: 100 })
                .mockReturnValueOnce({ width: 200, height: 200 });
            (filesRepository.createMany as jest.Mock).mockResolvedValue([]);

            await service.createFilesFromUploads(mockFiles);

            expect(fromBuffer).toHaveBeenCalledTimes(2);
        });

        it('should handle single file in array', async () => {
            const mockFiles: Express.Multer.File[] = [
                {
                    fieldname: 'files',
                    originalname: 'single.pdf',
                    encoding: '7bit',
                    mimetype: 'application/pdf',
                    size: 500,
                    buffer: Buffer.from('pdf'),
                    stream: null as any,
                    destination: '',
                    filename: 'single.pdf',
                    path: '',
                },
            ];

            (storage.uploadFile as jest.Mock).mockResolvedValue('storage/path');
            (globalUtils.files.determineFileType as jest.Mock).mockReturnValue(
                FileTypeEnum.DOCUMENT,
            );
            (globalUtils.files.generateObjectName as jest.Mock).mockReturnValue('single.pdf');
            (filesRepository.createMany as jest.Mock).mockResolvedValue([{ id: 'file-1' }]);

            const result = await service.createFilesFromUploads(mockFiles);

            expect(filesRepository.createMany).toHaveBeenCalledWith(
                expect.arrayContaining([expect.any(FileEntity)]),
            );
            expect(result).toHaveLength(1);
        });
    });
});
