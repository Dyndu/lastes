import { Test, TestingModule } from '@nestjs/testing';
import { FileLinksService } from './file-links.service';
import { FilesService } from './files.service';
import { FileUsageEnum } from '../../../common/enum';
import { FileLinksEntity } from '../entities/file-links.entity';
import { FileEntity } from '../entities/file.entity';
import { In } from 'typeorm';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('FileLinksService', () => {
    let service: FileLinksService;
    let filesService: any;
    let fLinksRepository: any;
    let filesRepository: any;
    let storage: any;
    let logger: any;
    let errorHandler: any;

    const mockFile: FileEntity = {
        id: 'file-123',
        filename: 'test.pdf',
        path: '/uploads/test.pdf',
        url: 'https://example.com/test.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        createdAt: new Date(),
        updatedAt: new Date(),
    } as any;

    const mockFileLink: FileLinksEntity = {
        id: 'file-link-123',
        file: mockFile,
        usage: FileUsageEnum.GUIDES,
        createdAt: new Date(),
        updatedAt: new Date(),
    } as FileLinksEntity;

    beforeEach(async () => {
        logger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
        };

        errorHandler = {
            forbidden: jest.fn(),
            notFound: jest.fn(),
        };

        fLinksRepository = {
            create: jest.fn(),
            createMany: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        };

        filesRepository = {
            find: jest.fn(),
            delete: jest.fn(),
        };

        storage = {
            deleteFile: jest.fn(),
        };

        const mockFilesService = {
            retrieveFileByCriteria: jest.fn(),
            fLinksRepository,
            filesRepository,
            storage,
            logger,
            errorHandler,
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FileLinksService,
                {
                    provide: FilesService,
                    useValue: mockFilesService,
                },
            ],
        }).compile();

        service = module.get<FileLinksService>(FileLinksService);
        filesService = module.get(FilesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('linkFileToEntity', () => {
        it('should link a file to an entities successfully', async () => {
            const fileId = 'file-123';
            const usage = FileUsageEnum.GUIDES;

            filesService.retrieveFileByCriteria.mockResolvedValue(mockFile);
            fLinksRepository.create.mockResolvedValue(mockFileLink);

            const result = await service.linkFileToEntity(fileId, usage);

            expect(filesService.retrieveFileByCriteria).toHaveBeenCalledWith({
                id: fileId,
            });
            expect(fLinksRepository.create).toHaveBeenCalled();

            const createdLink = fLinksRepository.create.mock.calls[0][0];
            expect(createdLink.file).toEqual(mockFile);
            expect(createdLink.usage).toEqual(usage);
            expect(result).toEqual(mockFileLink);
        });

        it('should link file with PROFILE_PICTURE usage', async () => {
            const fileId = 'file-456';
            const usage = FileUsageEnum.USER_AVATAR;

            filesService.retrieveFileByCriteria.mockResolvedValue(mockFile);
            fLinksRepository.create.mockResolvedValue({
                ...mockFileLink,
                usage: FileUsageEnum.USER_AVATAR,
            });

            await service.linkFileToEntity(fileId, usage);

            const createdLink = fLinksRepository.create.mock.calls[0][0];
            expect(createdLink.usage).toEqual(FileUsageEnum.USER_AVATAR);
        });

        it('should link file with DOCUMENTS usage', async () => {
            const fileId = 'file-789';
            const usage = FileUsageEnum.GUIDES;

            filesService.retrieveFileByCriteria.mockResolvedValue(mockFile);
            fLinksRepository.create.mockResolvedValue({
                ...mockFileLink,
                usage: FileUsageEnum.GUIDES,
            });

            await service.linkFileToEntity(fileId, usage);

            const createdLink = fLinksRepository.create.mock.calls[0][0];
            expect(createdLink.usage).toEqual(FileUsageEnum.GUIDES);
        });

        it('should create a new FileLinksEntity instance', async () => {
            const fileId = 'file-123';
            const usage = FileUsageEnum.GUIDES;

            filesService.retrieveFileByCriteria.mockResolvedValue(mockFile);
            fLinksRepository.create.mockResolvedValue(mockFileLink);

            await service.linkFileToEntity(fileId, usage);

            const createdLink = fLinksRepository.create.mock.calls[0][0];
            expect(createdLink).toBeInstanceOf(FileLinksEntity);
        });
    });

    describe('linkFilesToEntity', () => {
        it('should link multiple files to a message entities successfully', async () => {
            const fileIds = ['file-1', 'file-2'];
            const usage = FileUsageEnum.GUIDES;
            const mockMessage = { id: 'message-123' } as any;

            const mockFiles = [
                { id: 'file-1', filename: 'file1.pdf' },
                { id: 'file-2', filename: 'file2.pdf' },
            ] as any[];

            const mockFileLinks = [
                { id: 'link-1', file: mockFiles[0], usage },
                { id: 'link-2', file: mockFiles[1], usage },
            ] as any[];

            filesRepository.find.mockResolvedValue(mockFiles);
            fLinksRepository.createMany.mockResolvedValue(mockFileLinks);

            const result = await service.linkFilesToEntity(fileIds, usage, {
                message: mockMessage,
            });

            expect(logger.info).toHaveBeenCalledWith(
                'Link files with ids file-1, file-2 to guides',
            );
            expect(filesRepository.find).toHaveBeenCalledWith({
                where: { id: In(fileIds) },
            });
            expect(fLinksRepository.createMany).toHaveBeenCalled();
            expect(result).toEqual(mockFileLinks);
        });

        it('should create FileLinksEntity instances with correct properties', async () => {
            const fileIds = ['file-1'];
            const usage = FileUsageEnum.USER_AVATAR;
            const mockMessage = { id: 'message-123' } as any;

            const mockFiles = [{ id: 'file-1', filename: 'file1.pdf' }] as any[];

            filesRepository.find.mockResolvedValue(mockFiles);
            fLinksRepository.createMany.mockImplementation((links: any) => Promise.resolve(links));

            await service.linkFilesToEntity(fileIds, usage, {
                message: mockMessage,
            });

            const createdLinks = fLinksRepository.createMany.mock.calls[0][0];
            expect(createdLinks).toHaveLength(1);
            expect(createdLinks[0]).toBeInstanceOf(FileLinksEntity);
            expect(createdLinks[0].usage).toBe(usage);
        });

        it('should throw forbidden error when no entities is provided', async () => {
            const fileIds = ['file-1'];
            const usage = FileUsageEnum.GUIDES;

            errorHandler.forbidden.mockImplementation(() => {
                throw new Error('Forbidden');
            });

            await expect(service.linkFilesToEntity(fileIds, usage, {})).rejects.toThrow(
                'Forbidden',
            );

            expect(errorHandler.forbidden).toHaveBeenCalledWith(
                'You must provide exactly one target entities to link files to',
                'You must provide exactly one target entities to link files to',
            );
        });

        it('should throw forbidden error when multiple entities are provided', async () => {
            const fileIds = ['file-1'];
            const usage = FileUsageEnum.GUIDES;
            const mockMessage = { id: 'message-123' } as any;
            const mockOtherEntity = { id: 'other-123' } as any;

            errorHandler.forbidden.mockImplementation(() => {
                throw new Error('Forbidden');
            });

            await expect(
                service.linkFilesToEntity(fileIds, usage, {
                    message: mockMessage,
                    other: mockOtherEntity,
                } as any),
            ).rejects.toThrow('Forbidden');

            expect(errorHandler.forbidden).toHaveBeenCalledWith(
                'You must provide exactly one target entities to link files to',
                'You must provide exactly one target entities to link files to',
            );
        });

        it('should throw not found error when some files are not found', async () => {
            const fileIds = ['file-1', 'file-2', 'file-3'];
            const usage = FileUsageEnum.GUIDES;
            const mockMessage = { id: 'message-123' } as any;

            const mockFiles = [
                { id: 'file-1', filename: 'file1.pdf' },
                { id: 'file-2', filename: 'file2.pdf' },
            ] as any[];

            filesRepository.find.mockResolvedValue(mockFiles);
            errorHandler.notFound.mockImplementation(() => {
                throw new Error('Not found');
            });

            await expect(
                service.linkFilesToEntity(fileIds, usage, {
                    message: mockMessage,
                }),
            ).rejects.toThrow('Not found');

            expect(errorHandler.notFound).toHaveBeenCalledWith(
                "Some files aren't found for 3 files",
                'Files not found',
            );
        });

        it('should handle entities with undefined values correctly', async () => {
            const fileIds = ['file-1'];
            const usage = FileUsageEnum.GUIDES;
            const mockMessage = { id: 'message-123' } as any;

            const mockFiles = [{ id: 'file-1', filename: 'file1.pdf' }] as any[];

            filesRepository.find.mockResolvedValue(mockFiles);
            fLinksRepository.createMany.mockResolvedValue([]);

            await service.linkFilesToEntity(fileIds, usage, {
                message: mockMessage,
                other: undefined,
            } as any);

            expect(filesRepository.find).toHaveBeenCalled();
            expect(fLinksRepository.createMany).toHaveBeenCalled();
        });

        it('should link files with different usage types', async () => {
            const fileIds = ['file-1'];
            const usage = FileUsageEnum.USER_AVATAR;
            const mockMessage = { id: 'message-123' } as any;

            const mockFiles = [{ id: 'file-1', filename: 'file1.pdf' }] as any[];

            filesRepository.find.mockResolvedValue(mockFiles);
            fLinksRepository.createMany.mockResolvedValue([]);

            await service.linkFilesToEntity(fileIds, usage, {
                message: mockMessage,
            });

            expect(logger.info).toHaveBeenCalledWith('Link files with ids file-1 to user_avatar');
        });

        it('should handle single file linking', async () => {
            const fileIds = ['file-1'];
            const usage = FileUsageEnum.GUIDES;
            const mockMessage = { id: 'message-123' } as any;

            const mockFiles = [{ id: 'file-1', filename: 'file1.pdf' }] as any[];

            filesRepository.find.mockResolvedValue(mockFiles);
            fLinksRepository.createMany.mockResolvedValue([]);

            await service.linkFilesToEntity(fileIds, usage, {
                message: mockMessage,
            });

            const createdLinks = fLinksRepository.createMany.mock.calls[0][0];
            expect(createdLinks).toHaveLength(1);
        });

        it('should handle multiple files linking', async () => {
            const fileIds = ['file-1', 'file-2', 'file-3'];
            const usage = FileUsageEnum.GUIDES;
            const mockMessage = { id: 'message-123' } as any;

            const mockFiles = [
                { id: 'file-1', filename: 'file1.pdf' },
                { id: 'file-2', filename: 'file2.pdf' },
                { id: 'file-3', filename: 'file3.pdf' },
            ] as any[];

            filesRepository.find.mockResolvedValue(mockFiles);
            fLinksRepository.createMany.mockResolvedValue([]);

            await service.linkFilesToEntity(fileIds, usage, {
                message: mockMessage,
            });

            const createdLinks = fLinksRepository.createMany.mock.calls[0][0];
            expect(createdLinks).toHaveLength(3);
        });

        it('should assign file, usage and entities to FileLinksEntity using Object.assign', async () => {
            const fileIds = ['file-1'];
            const usage = FileUsageEnum.GUIDES;
            const mockMessage = { id: 'message-123', content: 'test' } as any;

            const mockFiles = [
                {
                    id: 'file-1',
                    filename: 'file1.pdf',
                    path: '/path/file1.pdf',
                },
            ] as any[];

            filesRepository.find.mockResolvedValue(mockFiles);
            fLinksRepository.createMany.mockImplementation((links: any) => Promise.resolve(links));

            await service.linkFilesToEntity(fileIds, usage, {
                message: mockMessage,
            });

            const createdLinks = fLinksRepository.createMany.mock.calls[0][0];

            // Object.assign copies properties from file, usage object, and entities
            // So the link will have file properties AND the message property
            expect(createdLinks[0]).toMatchObject({
                file: mockFiles[0],
                usage: usage,
                message: mockMessage,
            });
        });

        it('should log correct file IDs in info message', async () => {
            const fileIds = ['abc-123', 'def-456', 'ghi-789'];
            const usage = FileUsageEnum.GUIDES;
            const mockMessage = { id: 'message-123' } as any;

            const mockFiles = fileIds.map((id) => ({
                id,
                filename: `${id}.pdf`,
            })) as any[];

            filesRepository.find.mockResolvedValue(mockFiles);
            fLinksRepository.createMany.mockResolvedValue([]);

            await service.linkFilesToEntity(fileIds, usage, {
                message: mockMessage,
            });

            expect(logger.info).toHaveBeenCalledWith(
                'Link files with ids abc-123, def-456, ghi-789 to guides',
            );
        });

        it('should throw not found error when no files are found', async () => {
            const fileIds = ['file-1', 'file-2'];
            const usage = FileUsageEnum.GUIDES;
            const mockMessage = { id: 'message-123' } as any;

            filesRepository.find.mockResolvedValue([]);
            errorHandler.notFound.mockImplementation(() => {
                throw new Error('Not found');
            });

            await expect(
                service.linkFilesToEntity(fileIds, usage, {
                    message: mockMessage,
                }),
            ).rejects.toThrow('Not found');

            expect(errorHandler.notFound).toHaveBeenCalledWith(
                "Some files aren't found for 2 files",
                'Files not found',
            );
        });

        it('should filter out undefined entities before validation', async () => {
            const fileIds = ['file-1'];
            const usage = FileUsageEnum.GUIDES;

            errorHandler.forbidden.mockImplementation(() => {
                throw new Error('Forbidden');
            });

            await expect(
                service.linkFilesToEntity(fileIds, usage, {
                    message: undefined,
                }),
            ).rejects.toThrow('Forbidden');

            expect(errorHandler.forbidden).toHaveBeenCalled();
        });

        it('should validate entries length equals 1', async () => {
            const fileIds = ['file-1'];
            const usage = FileUsageEnum.GUIDES;
            const mockMessage = { id: 'message-123' } as any;

            const mockFiles = [{ id: 'file-1', filename: 'file1.pdf' }] as any[];

            filesRepository.find.mockResolvedValue(mockFiles);
            fLinksRepository.createMany.mockResolvedValue([]);

            await service.linkFilesToEntity(fileIds, usage, {
                message: mockMessage,
            });

            expect(errorHandler.forbidden).not.toHaveBeenCalled();
        });

        it('should call Object.assign with link, file, usage and entities', async () => {
            const fileIds = ['file-1'];
            const usage = FileUsageEnum.GUIDES;
            const mockMessage = { id: 'message-123' } as any;

            const mockFiles = [{ id: 'file-1', filename: 'file1.pdf', size: 2048 }] as any[];

            filesRepository.find.mockResolvedValue(mockFiles);
            fLinksRepository.createMany.mockImplementation((links: any) => Promise.resolve(links));

            await service.linkFilesToEntity(fileIds, usage, {
                message: mockMessage,
            });

            const createdLinks = fLinksRepository.createMany.mock.calls[0][0];

            // Verify that the link has the correct structure after Object.assign
            expect(createdLinks[0]).toBeInstanceOf(FileLinksEntity);
            expect(createdLinks[0].file).toEqual(mockFiles[0]);
            expect(createdLinks[0].usage).toBe(usage);
            expect(createdLinks[0].message).toEqual(mockMessage);
        });
    });

    describe('unlinkAndCleanup', () => {
        it('should unlink file and delete it when no remaining links exist', async () => {
            const fileLinkId = 'file-link-123';

            fLinksRepository.findOne.mockResolvedValue(mockFileLink);
            fLinksRepository.delete.mockResolvedValue({ affected: 1 });
            fLinksRepository.count.mockResolvedValue(0);
            storage.deleteFile.mockResolvedValue(undefined);
            filesRepository.delete.mockResolvedValue({ affected: 1 });

            await service.unlinkAndCleanup(fileLinkId);

            expect(fLinksRepository.findOne).toHaveBeenCalledWith({
                where: { id: fileLinkId },
                relations: ['file'],
            });
            expect(fLinksRepository.delete).toHaveBeenCalledWith({
                id: fileLinkId,
            });
            expect(fLinksRepository.count).toHaveBeenCalledWith({
                where: { file: { id: mockFile.id } },
            });
            expect(logger.info).toHaveBeenCalledWith(
                `No more links for file ${mockFile.id}, deleting from storage`,
            );
            expect(storage.deleteFile).toHaveBeenCalledWith(mockFile.path);
            expect(filesRepository.delete).toHaveBeenCalledWith({
                id: mockFile.id,
            });
        });

        it('should unlink file but keep it when remaining links exist', async () => {
            const fileLinkId = 'file-link-123';

            fLinksRepository.findOne.mockResolvedValue(mockFileLink);
            fLinksRepository.delete.mockResolvedValue({ affected: 1 });
            fLinksRepository.count.mockResolvedValue(2);

            await service.unlinkAndCleanup(fileLinkId);

            expect(fLinksRepository.findOne).toHaveBeenCalledWith({
                where: { id: fileLinkId },
                relations: ['file'],
            });
            expect(fLinksRepository.delete).toHaveBeenCalledWith({
                id: fileLinkId,
            });
            expect(fLinksRepository.count).toHaveBeenCalledWith({
                where: { file: { id: mockFile.id } },
            });
            expect(logger.info).not.toHaveBeenCalled();
            expect(storage.deleteFile).not.toHaveBeenCalled();
            expect(filesRepository.delete).not.toHaveBeenCalled();
        });

        it('should do nothing when file link does not exist', async () => {
            const fileLinkId = 'non-existent-link';

            fLinksRepository.findOne.mockResolvedValue(null);

            await service.unlinkAndCleanup(fileLinkId);

            expect(fLinksRepository.findOne).toHaveBeenCalledWith({
                where: { id: fileLinkId },
                relations: ['file'],
            });
            expect(fLinksRepository.delete).not.toHaveBeenCalled();
            expect(fLinksRepository.count).not.toHaveBeenCalled();
            expect(storage.deleteFile).not.toHaveBeenCalled();
            expect(filesRepository.delete).not.toHaveBeenCalled();
        });

        it('should handle undefined file link gracefully', async () => {
            const fileLinkId = 'file-link-456';

            fLinksRepository.findOne.mockResolvedValue(undefined);

            await service.unlinkAndCleanup(fileLinkId);

            expect(fLinksRepository.delete).not.toHaveBeenCalled();
        });

        it('should delete file from storage with correct path', async () => {
            const fileLinkId = 'file-link-123';
            const customPath = '/custom/path/file.pdf';
            const fileLinkWithCustomPath = {
                ...mockFileLink,
                file: { ...mockFile, path: customPath },
            };

            fLinksRepository.findOne.mockResolvedValue(fileLinkWithCustomPath);
            fLinksRepository.delete.mockResolvedValue({ affected: 1 });
            fLinksRepository.count.mockResolvedValue(0);
            storage.deleteFile.mockResolvedValue(undefined);
            filesRepository.delete.mockResolvedValue({ affected: 1 });

            await service.unlinkAndCleanup(fileLinkId);

            expect(storage.deleteFile).toHaveBeenCalledWith(customPath);
        });

        it('should check remaining links for correct file id', async () => {
            const fileLinkId = 'file-link-123';
            const specificFileId = 'specific-file-id';
            const fileLinkWithSpecificFile = {
                ...mockFileLink,
                file: { ...mockFile, id: specificFileId },
            };

            fLinksRepository.findOne.mockResolvedValue(fileLinkWithSpecificFile);
            fLinksRepository.delete.mockResolvedValue({ affected: 1 });
            fLinksRepository.count.mockResolvedValue(1);

            await service.unlinkAndCleanup(fileLinkId);

            expect(fLinksRepository.count).toHaveBeenCalledWith({
                where: { file: { id: specificFileId } },
            });
        });

        it('should perform cleanup operations in correct order', async () => {
            const fileLinkId = 'file-link-123';
            const callOrder: string[] = [];

            fLinksRepository.findOne.mockImplementation(() => {
                callOrder.push('findOne');
                return Promise.resolve(mockFileLink);
            });
            fLinksRepository.delete.mockImplementation(() => {
                callOrder.push('deleteLink');
                return Promise.resolve({ affected: 1 });
            });
            fLinksRepository.count.mockImplementation(() => {
                callOrder.push('count');
                return Promise.resolve(0);
            });
            storage.deleteFile.mockImplementation(() => {
                callOrder.push('deleteFromStorage');
                return Promise.resolve();
            });
            filesRepository.delete.mockImplementation(() => {
                callOrder.push('deleteFile');
                return Promise.resolve({ affected: 1 });
            });

            await service.unlinkAndCleanup(fileLinkId);

            expect(callOrder).toEqual([
                'findOne',
                'deleteLink',
                'count',
                'deleteFromStorage',
                'deleteFile',
            ]);
        });
    });
});
