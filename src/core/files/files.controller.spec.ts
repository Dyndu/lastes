import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { FilesService } from './services/files.service';
import { NotFoundException } from '@nestjs/common';
import { FileEntity } from './entities/file.entity';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('FilesController', () => {
    let controller: FilesController;
    let service: jest.Mocked<FilesService>;

    const mockFileEntity: FileEntity = {
        id: 'file-123',
        filename: 'test.pdf',
        originalName: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        path: '/uploads/test.pdf',
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    } as any;

    const mockMulterFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        destination: '/uploads',
        filename: 'test.pdf',
        path: '/uploads/test.pdf',
        buffer: Buffer.from('test'),
        stream: null,
    } as any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [FilesController],
            providers: [
                {
                    provide: FilesService,
                    useValue: {
                        createFileFromUpload: jest.fn(),
                        createFilesFromUploads: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<FilesController>(FilesController);
        service = module.get(FilesService);

        jest.clearAllMocks();
    });

    describe('createFile', () => {
        it('should create a file successfully', async () => {
            service.createFileFromUpload.mockResolvedValue(mockFileEntity);

            const result = await controller.createFile(mockMulterFile);

            expect(service.createFileFromUpload).toHaveBeenCalledWith(mockMulterFile);
            expect(result).toEqual(mockFileEntity);
        });

        it('should throw NotFoundException when file is undefined', async () => {
            await expect(controller.createFile(undefined!)).rejects.toThrow(NotFoundException);
            await expect(controller.createFile(undefined!)).rejects.toThrow('File is undefined');
            expect(service.createFileFromUpload).not.toHaveBeenCalled();
        });

        it('should throw NotFoundException when file is null', async () => {
            await expect(controller.createFile(null!)).rejects.toThrow(NotFoundException);
            expect(service.createFileFromUpload).not.toHaveBeenCalled();
        });
    });

    describe('createMultipleFiles', () => {
        it('should create multiple files successfully', async () => {
            const mockFiles: Express.Multer.File[] = [
                mockMulterFile,
                {
                    ...mockMulterFile,
                    originalname: 'test2.pdf',
                    filename: 'test2.pdf',
                },
            ];

            const mockFileEntities: FileEntity[] = [
                mockFileEntity,
                { ...mockFileEntity, id: 'file-456', label: 'test2.pdf' },
            ];

            service.createFilesFromUploads.mockResolvedValue(mockFileEntities);

            const result = await controller.createMultipleFiles(mockFiles);

            expect(service.createFilesFromUploads).toHaveBeenCalledWith(mockFiles);
            expect(result).toEqual(mockFileEntities);
        });

        it('should throw NotFoundException when files array is undefined', async () => {
            await expect(controller.createMultipleFiles(undefined!)).rejects.toThrow(
                NotFoundException,
            );
            await expect(controller.createMultipleFiles(undefined!)).rejects.toThrow(
                'No files were uploaded',
            );
            expect(service.createFilesFromUploads).not.toHaveBeenCalled();
        });

        it('should throw NotFoundException when files array is null', async () => {
            await expect(controller.createMultipleFiles(null!)).rejects.toThrow(NotFoundException);
            expect(service.createFilesFromUploads).not.toHaveBeenCalled();
        });

        it('should throw NotFoundException when files array is empty', async () => {
            await expect(controller.createMultipleFiles([])).rejects.toThrow(NotFoundException);
            await expect(controller.createMultipleFiles([])).rejects.toThrow(
                'No files were uploaded',
            );
            expect(service.createFilesFromUploads).not.toHaveBeenCalled();
        });

        it('should handle single file in array', async () => {
            const mockFiles = [mockMulterFile];
            const mockFileEntities = [mockFileEntity];

            service.createFilesFromUploads.mockResolvedValue(mockFileEntities);

            const result = await controller.createMultipleFiles(mockFiles);

            expect(service.createFilesFromUploads).toHaveBeenCalledWith(mockFiles);
            expect(result).toEqual(mockFileEntities);
        });
    });

    describe('Controller initialization', () => {
        it('should be defined', () => {
            expect(controller).toBeDefined();
        });

        it('should have service injected', () => {
            expect(controller['service']).toBeDefined();
        });
    });
});
