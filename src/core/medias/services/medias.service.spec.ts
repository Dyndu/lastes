import { Test, TestingModule } from '@nestjs/testing';
import { MediasService } from './medias.service';
import { FooterInfoRepository, MediasRepository, SocialRepository } from '../repositories';
import { FileLinksService } from '../../files/services/file-links.service';
import { UsersEntityTransformService } from '../../users/services';
import { ErrorHandlerService } from '../../../common/response';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AddMediaDto } from '../dto/add-media.dto';
import { MediaEntity } from '../entities';
import { FileUsageEnum } from '../../../common/enum';
import { SocialService } from './social.service';
import { FInfoService } from './f-info.service';
import { SocketService } from '../../../helpers/socket/socket.service';
import { OtherUtils } from '../../../utils/services/tools';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('MediasService', () => {
    let service: MediasService;
    let mediasRepository: MediasRepository;
    let fileLinksService: FileLinksService;
    let transformService: UsersEntityTransformService;
    let errorHandler: ErrorHandlerService;
    let logger: Logger;

    const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    };

    const mockMediasRepository = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };

    const mockFooterRepository = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
    };

    const mockSocialRepository = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
    };

    const mockFileLinksService = {
        linkFileToEntity: jest.fn(),
        unlinkAndCleanup: jest.fn(),
    };

    const mockTransformService = {
        transformFiles: jest.fn(),
    };

    const mockSocialService = {
        allSocials: jest.fn(),
        toggleSocial: jest.fn(),
    };

    const mockFInfoService = {
        footerInfo: jest.fn(),
        updateFInfo: jest.fn(),
    };

    const mockErrorHandler = {
        badRequest: jest.fn(),
        notFound: jest.fn(),
        internalServerError: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MediasService,
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: mockLogger,
                },
                {
                    provide: MediasRepository,
                    useValue: mockMediasRepository,
                },
                {
                    provide: FooterInfoRepository,
                    useValue: mockFooterRepository,
                },
                {
                    provide: SocialRepository,
                    useValue: mockSocialRepository,
                },
                {
                    provide: FileLinksService,
                    useValue: mockFileLinksService,
                },
                {
                    provide: UsersEntityTransformService,
                    useValue: mockTransformService,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandler,
                },
                {
                    provide: SocketService,
                    useValue: {},
                },
                {
                    provide: OtherUtils,
                    useValue: {
                        validateAndParsePhone: jest.fn(),
                    },
                },
                {
                    provide: SocialService,
                    useValue: mockSocialService,
                },
                {
                    provide: FInfoService,
                    useValue: mockFInfoService,
                },
            ],
        }).compile();

        service = module.get<MediasService>(MediasService);
        mediasRepository = module.get<MediasRepository>(MediasRepository);
        fileLinksService = module.get<FileLinksService>(FileLinksService);
        transformService = module.get<UsersEntityTransformService>(UsersEntityTransformService);
        errorHandler = module.get<ErrorHandlerService>(ErrorHandlerService);
        logger = module.get<Logger>(WINSTON_MODULE_PROVIDER);

        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Service Definition', () => {
        it('should be defined', () => {
            expect(service).toBeDefined();
        });

        it('should have logger injected', () => {
            expect(service.logger).toBe(logger);
        });

        it('should have mediasRepository injected', () => {
            expect(service.mediasRepository).toBe(mediasRepository);
        });

        it('should have errorHandler injected', () => {
            expect(service.errorHandler).toBe(errorHandler);
        });

        it('should have fileLinksService injected', () => {
            expect(service.fileLinksService).toBe(fileLinksService);
        });

        it('should have transformService injected', () => {
            expect(service.transformService).toBe(transformService);
        });
    });

    describe('loadMedia', () => {
        it('should load media with all relations', async () => {
            const mockMedia = {
                id: '1',
                deleted: false,
                file: {
                    id: 'file-1',
                    file: { id: 'actual-file-1' },
                },
                thumbnail: {
                    id: 'thumb-1',
                    file: { id: 'actual-thumb-1' },
                },
            } as MediaEntity;

            mockMediasRepository.findOne.mockResolvedValue(mockMedia);

            const result = await service.loadMedia();

            expect(result).toEqual(mockMedia);
            expect(mediasRepository.findOne).toHaveBeenCalledWith({
                where: { deleted: false },
                relations: ['file', 'file.file', 'thumbnail', 'thumbnail.file'],
            });
            expect(mediasRepository.findOne).toHaveBeenCalledTimes(1);
        });

        it('should return null when no media exists', async () => {
            mockMediasRepository.findOne.mockResolvedValue(null);

            const result = await service.loadMedia();

            expect(result).toBeNull();
            expect(mediasRepository.findOne).toHaveBeenCalledWith({
                where: { deleted: false },
                relations: ['file', 'file.file', 'thumbnail', 'thumbnail.file'],
            });
        });

        it('should only query non-deleted media', async () => {
            mockMediasRepository.findOne.mockResolvedValue(null);

            await service.loadMedia();

            expect(mediasRepository.findOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { deleted: false },
                }),
            );
        });

        it('should include all required relations', async () => {
            mockMediasRepository.findOne.mockResolvedValue(null);

            await service.loadMedia();

            const callArgs = mockMediasRepository.findOne.mock.calls[0][0];
            expect(callArgs.relations).toEqual([
                'file',
                'file.file',
                'thumbnail',
                'thumbnail.file',
            ]);
        });
    });

    describe('resolveThumbnail', () => {
        it('should throw error when both thumbnailId and thumbnailLink are provided', async () => {
            const dto: AddMediaDto = {
                fileId: 'file-1',
                thumbnailId: 'thumb-1',
                thumbnailLink: 'https://example.com/thumb.jpg',
            } as AddMediaDto;

            mockErrorHandler.badRequest.mockImplementation(() => {
                throw new Error('Cannot provide both thumbnailId and thumbnailLink');
            });

            await expect(service.resolveThumbnail(dto)).rejects.toThrow(
                'Cannot provide both thumbnailId and thumbnailLink',
            );

            expect(errorHandler.badRequest).toHaveBeenCalledWith(
                'Cannot provide both thumbnailId and thumbnailLink',
                'Cannot provide both thumbnailId and thumbnailLink',
            );
        });

        it('should throw error when neither thumbnailId nor thumbnailLink are provided', async () => {
            const dto: AddMediaDto = {
                fileId: 'file-1',
            } as AddMediaDto;

            mockErrorHandler.badRequest.mockImplementation(() => {
                throw new Error('Either thumbnailId or thumbnailLink must be provided');
            });

            await expect(service.resolveThumbnail(dto)).rejects.toThrow(
                'Either thumbnailId or thumbnailLink must be provided',
            );

            expect(errorHandler.badRequest).toHaveBeenCalledWith(
                'Either thumbnailId or thumbnailLink must be provided',
                'Either thumbnailId or thumbnailLink must be provided',
            );
        });

        it('should link file when thumbnailId is provided', async () => {
            const dto: AddMediaDto = {
                fileId: 'file-1',
                thumbnailId: 'thumb-1',
            } as AddMediaDto;

            const mockLinkedFile = { id: 'linked-thumb-1' };
            mockFileLinksService.linkFileToEntity.mockResolvedValue(mockLinkedFile);

            const result = await service.resolveThumbnail(dto);

            expect(result).toEqual({
                thumbnail: mockLinkedFile,
                thumbnailLink: null,
            });
            expect(fileLinksService.linkFileToEntity).toHaveBeenCalledWith(
                'thumb-1',
                FileUsageEnum.MEDIAS_THUMBNAIL,
            );
            expect(fileLinksService.linkFileToEntity).toHaveBeenCalledTimes(1);
        });

        it('should return thumbnailLink when provided without thumbnailId', async () => {
            const dto: AddMediaDto = {
                fileId: 'file-1',
                thumbnailLink: 'https://example.com/thumbnail.jpg',
            } as AddMediaDto;

            const result = await service.resolveThumbnail(dto);

            expect(result).toEqual({
                thumbnail: null,
                thumbnailLink: 'https://example.com/thumbnail.jpg',
            });
            expect(fileLinksService.linkFileToEntity).not.toHaveBeenCalled();
        });

        it('should handle different thumbnailLink formats', async () => {
            const links = [
                'https://example.com/thumb.jpg',
                'https://cdn.example.com/images/thumb.png',
                'https://example.com/path/to/thumbnail.webp',
            ];

            for (const link of links) {
                const dto: AddMediaDto = {
                    fileId: 'file-1',
                    thumbnailLink: link,
                } as AddMediaDto;

                const result = await service.resolveThumbnail(dto);

                expect(result.thumbnailLink).toBe(link);
                expect(result.thumbnail).toBeNull();
            }
        });

        it('should handle different thumbnailId values', async () => {
            const thumbnailIds = ['thumb-1', 'thumb-2', 'thumb-abc'];

            for (const thumbnailId of thumbnailIds) {
                const dto: AddMediaDto = {
                    fileId: 'file-1',
                    thumbnailId,
                } as AddMediaDto;

                const mockLinkedFile = { id: `linked-${thumbnailId}` };
                mockFileLinksService.linkFileToEntity.mockResolvedValue(mockLinkedFile);

                const result = await service.resolveThumbnail(dto);

                expect(result.thumbnail).toEqual(mockLinkedFile);
                expect(result.thumbnailLink).toBeNull();
                expect(fileLinksService.linkFileToEntity).toHaveBeenCalledWith(
                    thumbnailId,
                    FileUsageEnum.MEDIAS_THUMBNAIL,
                );
            }
        });
    });

    describe('changeFile', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should create new media when no media exists (with fileId and thumbnailId)', async () => {
            const dto: AddMediaDto = {
                fileId: 'file-1',
                thumbnailId: 'thumb-1',
            } as AddMediaDto;

            const mockFile = { id: 'linked-file-1' };
            const mockThumbnail = { id: 'linked-thumb-1' };

            mockMediasRepository.findOne.mockResolvedValue(null);
            mockFileLinksService.linkFileToEntity
                .mockResolvedValueOnce(mockFile)
                .mockResolvedValueOnce(mockThumbnail);
            mockMediasRepository.create.mockResolvedValue({});

            const result = await service.changeFile(dto);

            expect(result).toEqual({
                message: 'Media file updated successfully',
            });
            expect(logger.info).toHaveBeenCalledWith('Set or update media file');
            expect(mediasRepository.findOne).toHaveBeenCalledTimes(1);
            expect(fileLinksService.linkFileToEntity).toHaveBeenCalledWith(
                'file-1',
                FileUsageEnum.MEDIAS,
            );
            expect(fileLinksService.linkFileToEntity).toHaveBeenCalledWith(
                'thumb-1',
                FileUsageEnum.MEDIAS_THUMBNAIL,
            );

            const savedEntity = mockMediasRepository.create.mock.calls[0][0];
            expect(savedEntity.file).toEqual(mockFile);
            expect(savedEntity.fileLink).toBeNull();
            expect(savedEntity.thumbnail).toEqual(mockThumbnail);
            expect(savedEntity.thumbnailLink).toBeNull();
        });

        it('should create new media with fileLink and thumbnailLink', async () => {
            const dto: AddMediaDto = {
                fileLink: 'https://example2.com/video.mp4',
                thumbnailLink: 'https://example.com/thumb.jpg',
            } as AddMediaDto;

            mockMediasRepository.findOne.mockResolvedValue(null);
            mockMediasRepository.create.mockResolvedValue({});

            const result = await service.changeFile(dto);

            expect(result).toEqual({
                message: 'Media file updated successfully',
            });

            const savedEntity = mockMediasRepository.create.mock.calls[0][0];
            expect(savedEntity.file).toBeNull();
            expect(savedEntity.fileLink).toBe('https://example2.com/video.mp4');
            expect(savedEntity.thumbnail).toBeNull();
            expect(savedEntity.thumbnailLink).toBe('https://example.com/thumb.jpg');
        });

        it('should create new media with fileId and thumbnailLink', async () => {
            const dto: AddMediaDto = {
                fileId: 'file-1',
                thumbnailLink: 'https://example.com/thumb.jpg',
            } as AddMediaDto;

            const mockFile = { id: 'linked-file-1' };

            mockMediasRepository.findOne.mockResolvedValue(null);
            mockFileLinksService.linkFileToEntity.mockResolvedValue(mockFile);
            mockMediasRepository.create.mockResolvedValue({});

            const result = await service.changeFile(dto);

            expect(result).toEqual({
                message: 'Media file updated successfully',
            });

            const savedEntity = mockMediasRepository.create.mock.calls[0][0];
            expect(savedEntity.file).toEqual(mockFile);
            expect(savedEntity.fileLink).toBeNull();
            expect(savedEntity.thumbnail).toBeNull();
            expect(savedEntity.thumbnailLink).toBe('https://example.com/thumb.jpg');
        });

        it('should create new media with fileLink and thumbnailId', async () => {
            const dto: AddMediaDto = {
                fileLink: 'https://example.com/video.mp4',
                thumbnailId: 'thumb-1',
            } as AddMediaDto;

            const mockThumbnail = { id: 'linked-thumb-1' };

            mockMediasRepository.findOne.mockResolvedValue(null);
            mockFileLinksService.linkFileToEntity.mockResolvedValue(mockThumbnail);
            mockMediasRepository.create.mockResolvedValue({});

            const result = await service.changeFile(dto);

            expect(result).toEqual({
                message: 'Media file updated successfully',
            });

            const savedEntity = mockMediasRepository.create.mock.calls[0][0];
            expect(savedEntity.file).toBeNull();
            expect(savedEntity.fileLink).toBe('https://example.com/video.mp4');
            expect(savedEntity.thumbnail).toEqual(mockThumbnail);
            expect(savedEntity.thumbnailLink).toBeNull();
        });

        it('should update existing media and cleanup old files', async () => {
            const dto: AddMediaDto = {
                fileId: 'new-file-1',
                thumbnailId: 'new-thumb-1',
            } as AddMediaDto;

            const existingMedia = {
                id: 'media-1',
                file: {
                    id: 'old-file-link',
                    file: { id: 'old-file-1' },
                },
                thumbnail: {
                    id: 'old-thumb-link',
                    file: { id: 'old-thumb-1' },
                },
            } as any;

            const mockNewFile = { id: 'new-linked-file-1' };
            const mockNewThumbnail = { id: 'new-linked-thumb-1' };

            mockMediasRepository.findOne.mockResolvedValue(existingMedia);
            mockFileLinksService.linkFileToEntity
                .mockResolvedValueOnce(mockNewFile)
                .mockResolvedValueOnce(mockNewThumbnail);
            mockMediasRepository.create.mockResolvedValue({});
            mockFileLinksService.unlinkAndCleanup.mockResolvedValue(undefined);

            const result = await service.changeFile(dto);

            expect(result).toEqual({
                message: 'Media file updated successfully',
            });

            const savedEntity = mockMediasRepository.create.mock.calls[0][0];
            expect(savedEntity).toBe(existingMedia);
            expect(savedEntity.file).toEqual(mockNewFile);
            expect(savedEntity.thumbnail).toEqual(mockNewThumbnail);

            jest.runAllTimers();
            await Promise.resolve();

            expect(fileLinksService.unlinkAndCleanup).toHaveBeenCalledWith('old-file-1');
            expect(fileLinksService.unlinkAndCleanup).toHaveBeenCalledWith('old-thumb-1');
            expect(fileLinksService.unlinkAndCleanup).toHaveBeenCalledTimes(2);
        });

        it('should handle cleanup when only old file exists', async () => {
            const dto: AddMediaDto = {
                fileId: 'new-file-1',
                thumbnailLink: 'https://example.com/thumb.jpg',
            } as AddMediaDto;

            const existingMedia = {
                id: 'media-1',
                file: {
                    id: 'old-file-link',
                    file: { id: 'old-file-1' },
                },
                thumbnail: null,
            } as any;

            const mockNewFile = { id: 'new-linked-file-1' };

            mockMediasRepository.findOne.mockResolvedValue(existingMedia);
            mockFileLinksService.linkFileToEntity.mockResolvedValue(mockNewFile);
            mockMediasRepository.create.mockResolvedValue({});
            mockFileLinksService.unlinkAndCleanup.mockResolvedValue(undefined);

            await service.changeFile(dto);

            jest.runAllTimers();
            await Promise.resolve();

            expect(fileLinksService.unlinkAndCleanup).toHaveBeenCalledWith('old-file-1');
            expect(fileLinksService.unlinkAndCleanup).toHaveBeenCalledTimes(1);
        });

        it('should handle cleanup when only old thumbnail exists', async () => {
            const dto: AddMediaDto = {
                fileLink: 'https://example.com/video.mp4',
                thumbnailId: 'new-thumb-1',
            } as AddMediaDto;

            const existingMedia = {
                id: 'media-1',
                file: null,
                thumbnail: {
                    id: 'old-thumb-link',
                    file: { id: 'old-thumb-1' },
                },
            } as any;

            const mockNewThumbnail = { id: 'new-linked-thumb-1' };

            mockMediasRepository.findOne.mockResolvedValue(existingMedia);
            mockFileLinksService.linkFileToEntity.mockResolvedValue(mockNewThumbnail);
            mockMediasRepository.create.mockResolvedValue({});
            mockFileLinksService.unlinkAndCleanup.mockResolvedValue(undefined);

            await service.changeFile(dto);

            jest.runAllTimers();
            await Promise.resolve();

            expect(fileLinksService.unlinkAndCleanup).toHaveBeenCalledWith('old-thumb-1');
            expect(fileLinksService.unlinkAndCleanup).toHaveBeenCalledTimes(1);
        });

        it('should not cleanup when no old files exist', async () => {
            const dto: AddMediaDto = {
                fileLink: 'https://example.com/video.mp4',
                thumbnailLink: 'https://example.com/thumb.jpg',
            } as AddMediaDto;

            const existingMedia = {
                id: 'media-1',
                file: null,
                thumbnail: null,
            } as any;

            mockMediasRepository.findOne.mockResolvedValue(existingMedia);
            mockMediasRepository.create.mockResolvedValue({});

            await service.changeFile(dto);

            jest.runAllTimers();
            await Promise.resolve();

            expect(fileLinksService.unlinkAndCleanup).not.toHaveBeenCalled();
        });

        it('should log error when cleanup fails', async () => {
            const dto: AddMediaDto = {
                fileId: 'new-file-1',
                thumbnailId: 'new-thumb-1',
            } as AddMediaDto;

            const existingMedia = {
                id: 'media-1',
                file: {
                    id: 'old-file-link',
                    file: { id: 'old-file-1' },
                },
                thumbnail: {
                    id: 'old-thumb-link',
                    file: { id: 'old-thumb-1' },
                },
            } as any;

            const mockNewFile = { id: 'new-linked-file-1' };
            const mockNewThumbnail = { id: 'new-linked-thumb-1' };
            const cleanupError = new Error('Cleanup failed');

            mockMediasRepository.findOne.mockResolvedValue(existingMedia);
            mockFileLinksService.linkFileToEntity
                .mockResolvedValueOnce(mockNewFile)
                .mockResolvedValueOnce(mockNewThumbnail);
            mockMediasRepository.create.mockResolvedValue({});
            mockFileLinksService.unlinkAndCleanup.mockRejectedValue(cleanupError);

            await service.changeFile(dto);

            jest.runAllTimers();
            await Promise.resolve();
            await Promise.resolve();

            expect(logger.error).toHaveBeenCalledWith(
                'Failed to cleanup old media files',
                cleanupError,
            );
        });

        it('should handle resolveFile errors', async () => {
            const dto: AddMediaDto = {
                fileId: 'file-1',
                fileLink: 'https://example.com/video.mp4',
            } as AddMediaDto;

            mockMediasRepository.findOne.mockResolvedValue(null);
            mockErrorHandler.badRequest.mockImplementation(() => {
                throw new Error('Cannot provide both fileId and fileLink');
            });

            await expect(service.changeFile(dto)).rejects.toThrow(
                'Cannot provide both fileId and fileLink',
            );
        });

        it('should handle resolveThumbnail errors', async () => {
            const dto: AddMediaDto = {
                fileId: 'file-1',
                thumbnailId: 'thumb-1',
                thumbnailLink: 'https://example.com/thumb.jpg',
            } as AddMediaDto;

            mockMediasRepository.findOne.mockResolvedValue(null);
            mockFileLinksService.linkFileToEntity.mockResolvedValue({
                id: 'file-1',
            });
            mockErrorHandler.badRequest.mockImplementation(() => {
                throw new Error('Cannot provide both thumbnailId and thumbnailLink');
            });

            await expect(service.changeFile(dto)).rejects.toThrow(
                'Cannot provide both thumbnailId and thumbnailLink',
            );
        });

        it('should handle file linking errors', async () => {
            const dto: AddMediaDto = {
                fileId: 'file-1',
                thumbnailId: 'thumb-1',
            } as AddMediaDto;

            const linkError = new Error('File not found');

            mockMediasRepository.findOne.mockResolvedValue(null);
            mockFileLinksService.linkFileToEntity.mockRejectedValue(linkError);

            await expect(service.changeFile(dto)).rejects.toThrow('File not found');
            expect(logger.info).toHaveBeenCalledWith('Set or update media file');
        });

        it('should handle repository save errors', async () => {
            const dto: AddMediaDto = {
                fileId: 'file-1',
                thumbnailId: 'thumb-1',
            } as AddMediaDto;

            const saveError = new Error('Database error');

            mockMediasRepository.findOne.mockResolvedValue(null);
            mockFileLinksService.linkFileToEntity.mockResolvedValue({
                id: 'file-1',
            });
            mockMediasRepository.create.mockRejectedValue(saveError);

            await expect(service.changeFile(dto)).rejects.toThrow('Database error');
        });
    });

    describe('resolveFile', () => {
        it('should throw error when both fileId and fileLink are provided', async () => {
            const dto: AddMediaDto = {
                fileId: 'file-1',
                fileLink: 'https://example.com/file.mp4',
            } as AddMediaDto;

            mockErrorHandler.badRequest.mockImplementation(() => {
                throw new Error('Cannot provide both fileId and fileLink');
            });

            await expect(service.resolveFile(dto)).rejects.toThrow(
                'Cannot provide both fileId and fileLink',
            );

            expect(errorHandler.badRequest).toHaveBeenCalledWith(
                'Cannot provide both fileId and fileLink',
                'Cannot provide both fileId and fileLink',
            );
        });

        it('should throw error when neither fileId nor fileLink are provided', async () => {
            const dto: AddMediaDto = {} as AddMediaDto;

            mockErrorHandler.badRequest.mockImplementation(() => {
                throw new Error('Either fileId or fileLink must be provided');
            });

            await expect(service.resolveFile(dto)).rejects.toThrow(
                'Either fileId or fileLink must be provided',
            );

            expect(errorHandler.badRequest).toHaveBeenCalledWith(
                'Either fileId or fileLink must be provided',
                'Either fileId or fileLink must be provided',
            );
        });

        it('should link file when fileId is provided', async () => {
            const dto: AddMediaDto = {
                fileId: 'file-1',
            } as AddMediaDto;

            const mockLinkedFile = { id: 'linked-file-1' };
            mockFileLinksService.linkFileToEntity.mockResolvedValue(mockLinkedFile);

            const result = await service.resolveFile(dto);

            expect(result).toEqual({
                file: mockLinkedFile,
                fileLink: null,
            });
            expect(fileLinksService.linkFileToEntity).toHaveBeenCalledWith(
                'file-1',
                FileUsageEnum.MEDIAS,
            );
        });

        it('should return fileLink when provided without fileId', async () => {
            const dto: AddMediaDto = {
                fileLink: 'https://example.com/video.mp4',
            } as AddMediaDto;

            const result = await service.resolveFile(dto);

            expect(result).toEqual({
                file: null,
                fileLink: 'https://example.com/video.mp4',
            });
            expect(fileLinksService.linkFileToEntity).not.toHaveBeenCalled();
        });
    });

    describe('transformMediaFile', () => {
        it('should transform media with file and file thumbnail', () => {
            const mediaEntity = {
                id: 'media-1',
                file: {
                    id: 'file-link-1',
                    file: {
                        id: 'file-1',
                        name: 'video.mp4',
                        url: 'https://example.com/video.mp4',
                    },
                },
                fileLink: null,
                thumbnail: {
                    id: 'thumb-link-1',
                    file: {
                        id: 'thumb-1',
                        name: 'thumbnail.jpg',
                        url: 'https://example.com/thumb.jpg',
                    },
                },
                thumbnailLink: null,
            } as any;

            const mockTransformedFile = {
                id: 'file-1',
                name: 'video.mp4',
                url: 'https://example.com/video.mp4',
            };
            const mockTransformedThumb = {
                id: 'thumb-1',
                name: 'thumbnail.jpg',
                url: 'https://example.com/thumb.jpg',
            };

            mockTransformService.transformFiles
                .mockReturnValueOnce(mockTransformedFile)
                .mockReturnValueOnce(mockTransformedThumb);

            const result = service.transformMediaFile(mediaEntity);

            expect(result).toEqual({
                file: {
                    type: 'file',
                    value: mockTransformedFile,
                },
                thumbnail: {
                    type: 'file',
                    value: mockTransformedThumb,
                },
            });
            expect(transformService.transformFiles).toHaveBeenCalledWith(mediaEntity.file.file);
            expect(transformService.transformFiles).toHaveBeenCalledWith(
                mediaEntity.thumbnail.file,
            );
            expect(transformService.transformFiles).toHaveBeenCalledTimes(2);
        });

        it('should transform media with fileLink and thumbnailLink', () => {
            const mediaEntity = {
                id: 'media-1',
                file: null,
                fileLink: 'https://example.com/video.mp4',
                thumbnail: null,
                thumbnailLink: 'https://example.com/external-thumb.jpg',
            } as any;

            const result = service.transformMediaFile(mediaEntity);

            expect(result).toEqual({
                file: {
                    type: 'link',
                    value: 'https://example.com/video.mp4',
                },
                thumbnail: {
                    type: 'link',
                    value: 'https://example.com/external-thumb.jpg',
                },
            });
            expect(transformService.transformFiles).not.toHaveBeenCalled();
        });

        it('should transform media with file and thumbnailLink', () => {
            const mediaEntity = {
                id: 'media-1',
                file: {
                    id: 'file-link-1',
                    file: {
                        id: 'file-1',
                        name: 'video.mp4',
                        url: 'https://example.com/video.mp4',
                    },
                },
                fileLink: null,
                thumbnail: null,
                thumbnailLink: 'https://example.com/external-thumb.jpg',
            } as any;

            const mockTransformedFile = {
                id: 'file-1',
                name: 'video.mp4',
                url: 'https://example.com/video.mp4',
            };

            mockTransformService.transformFiles.mockReturnValue(mockTransformedFile);

            const result = service.transformMediaFile(mediaEntity);

            expect(result).toEqual({
                file: {
                    type: 'file',
                    value: mockTransformedFile,
                },
                thumbnail: {
                    type: 'link',
                    value: 'https://example.com/external-thumb.jpg',
                },
            });
            expect(transformService.transformFiles).toHaveBeenCalledTimes(1);
        });

        it('should transform media with fileLink and file thumbnail', () => {
            const mediaEntity = {
                id: 'media-1',
                file: null,
                fileLink: 'https://example.com/video.mp4',
                thumbnail: {
                    id: 'thumb-link-1',
                    file: {
                        id: 'thumb-1',
                        name: 'thumbnail.jpg',
                        url: 'https://example.com/thumb.jpg',
                    },
                },
                thumbnailLink: null,
            } as any;

            const mockTransformedThumb = {
                id: 'thumb-1',
                name: 'thumbnail.jpg',
                url: 'https://example.com/thumb.jpg',
            };

            mockTransformService.transformFiles.mockReturnValue(mockTransformedThumb);

            const result = service.transformMediaFile(mediaEntity);

            expect(result).toEqual({
                file: {
                    type: 'link',
                    value: 'https://example.com/video.mp4',
                },
                thumbnail: {
                    type: 'file',
                    value: mockTransformedThumb,
                },
            });
            expect(transformService.transformFiles).toHaveBeenCalledTimes(1);
        });

        it('should correctly determine file type based on file presence', () => {
            const mediaWithFile = {
                file: { file: { id: '1' } },
                fileLink: null,
                thumbnail: null,
                thumbnailLink: 'https://example.com/thumb.jpg',
            } as any;

            const mediaWithFileLink = {
                file: null,
                fileLink: 'https://example.com/video.mp4',
                thumbnail: null,
                thumbnailLink: 'https://example.com/thumb.jpg',
            } as any;

            mockTransformService.transformFiles.mockReturnValue({
                id: 'transformed',
            });

            const result1 = service.transformMediaFile(mediaWithFile);
            expect(result1.file.type).toBe('file');

            const result2 = service.transformMediaFile(mediaWithFileLink);
            expect(result2.file.type).toBe('link');
        });

        it('should correctly determine thumbnail type based on thumbnail presence', () => {
            const mediaWithFileThumbnail = {
                file: null,
                fileLink: 'https://example.com/video.mp4',
                thumbnail: { file: { id: 'thumb' } },
                thumbnailLink: null,
            } as any;

            const mediaWithLinkThumbnail = {
                file: null,
                fileLink: 'https://example.com/video.mp4',
                thumbnail: null,
                thumbnailLink: 'https://example.com/thumb.jpg',
            } as any;

            mockTransformService.transformFiles.mockReturnValue({
                id: 'transformed',
            });

            const result1 = service.transformMediaFile(mediaWithFileThumbnail);
            expect(result1.thumbnail.type).toBe('file');

            const result2 = service.transformMediaFile(mediaWithLinkThumbnail);
            expect(result2.thumbnail.type).toBe('link');
        });
    });

    describe('retrieveMedias', () => {
        it('should retrieve and transform media when it exists', async () => {
            const mockMedia = {
                id: 'media-1',
                file: {
                    id: 'file-link-1',
                    file: {
                        id: 'file-1',
                        name: 'video.mp4',
                        url: 'https://example.com/video.mp4',
                    },
                },
                fileLink: null,
                thumbnail: {
                    id: 'thumb-link-1',
                    file: {
                        id: 'thumb-1',
                        name: 'thumbnail.jpg',
                        url: 'https://example.com/thumb.jpg',
                    },
                },
                thumbnailLink: null,
            } as any;

            const mockTransformedFile = {
                id: 'file-1',
                name: 'video.mp4',
                url: 'https://example.com/video.mp4',
            };
            const mockTransformedThumb = {
                id: 'thumb-1',
                name: 'thumbnail.jpg',
                url: 'https://example.com/thumb.jpg',
            };

            mockMediasRepository.findOne.mockResolvedValue(mockMedia);
            mockTransformService.transformFiles
                .mockReturnValueOnce(mockTransformedFile)
                .mockReturnValueOnce(mockTransformedThumb);

            const result = await service.retrieveMedias();

            expect(logger.info).toHaveBeenCalledWith('Retrieve medias');
            expect(result).toEqual({
                file: {
                    type: 'file',
                    value: mockTransformedFile,
                },
                thumbnail: {
                    type: 'file',
                    value: mockTransformedThumb,
                },
            });
            expect(mediasRepository.findOne).toHaveBeenCalledTimes(1);
        });

        it('should retrieve and transform media with links', async () => {
            const mockMedia = {
                id: 'media-1',
                file: null,
                fileLink: 'https://example.com/video.mp4',
                thumbnail: null,
                thumbnailLink: 'https://example.com/thumb.jpg',
            } as any;

            mockMediasRepository.findOne.mockResolvedValue(mockMedia);

            const result = await service.retrieveMedias();

            expect(logger.info).toHaveBeenCalledWith('Retrieve medias');
            expect(result).toEqual({
                file: {
                    type: 'link',
                    value: 'https://example.com/video.mp4',
                },
                thumbnail: {
                    type: 'link',
                    value: 'https://example.com/thumb.jpg',
                },
            });
            expect(transformService.transformFiles).not.toHaveBeenCalled();
        });

        it('should return empty object when no media exists', async () => {
            mockMediasRepository.findOne.mockResolvedValue(null);

            const result = await service.retrieveMedias();

            expect(logger.info).toHaveBeenCalledWith('Retrieve medias');
            expect(result).toEqual({
                file: null,
                thumbnail: null,
            });
            expect(mediasRepository.findOne).toHaveBeenCalledTimes(1);
            expect(transformService.transformFiles).not.toHaveBeenCalled();
        });

        it('should return empty object when media is undefined', async () => {
            mockMediasRepository.findOne.mockResolvedValue(undefined);

            const result = await service.retrieveMedias();

            expect(result).toEqual({
                file: null,
                thumbnail: null,
            });
        });

        it('should call loadMedia internally', async () => {
            const loadMediaSpy = jest.spyOn(service, 'loadMedia');
            mockMediasRepository.findOne.mockResolvedValue(null);

            await service.retrieveMedias();

            expect(loadMediaSpy).toHaveBeenCalledTimes(1);
        });

        it('should handle transformMediaFile for existing media', async () => {
            const mockMedia = {
                id: 'media-1',
                file: { file: { id: 'file-1' } },
                fileLink: null,
                thumbnail: null,
                thumbnailLink: 'https://example.com/thumb.jpg',
            } as any;

            mockMediasRepository.findOne.mockResolvedValue(mockMedia);
            mockTransformService.transformFiles.mockReturnValue({
                id: 'file-1',
            });

            const transformMediaFileSpy = jest.spyOn(service, 'transformMediaFile');

            await service.retrieveMedias();

            expect(transformMediaFileSpy).toHaveBeenCalledWith(mockMedia);
            expect(transformMediaFileSpy).toHaveBeenCalledTimes(1);
        });

        it('should log before retrieving media', async () => {
            mockMediasRepository.findOne.mockResolvedValue(null);

            await service.retrieveMedias();

            expect(logger.info).toHaveBeenCalledWith('Retrieve medias');
            expect(logger.info).toHaveBeenCalled();
            expect(mediasRepository.findOne).toHaveBeenCalled();
        });
    });

    describe('Integration Tests', () => {
        it('should handle complete workflow: create, retrieve, update', async () => {
            const createDto: AddMediaDto = {
                fileId: 'file-1',
                thumbnailId: 'thumb-1',
            } as AddMediaDto;

            mockMediasRepository.findOne.mockResolvedValueOnce(null);
            mockFileLinksService.linkFileToEntity
                .mockResolvedValueOnce({ id: 'file-1' })
                .mockResolvedValueOnce({ id: 'thumb-1' });
            mockMediasRepository.create.mockResolvedValue({});

            await service.changeFile(createDto);

            const mockMedia = {
                file: { file: { id: 'file-1' } },
                fileLink: null,
                thumbnail: { file: { id: 'thumb-1' } },
                thumbnailLink: null,
            } as any;

            mockMediasRepository.findOne.mockResolvedValueOnce(mockMedia);
            mockTransformService.transformFiles.mockReturnValue({
                id: 'transformed',
            });

            const retrieved = await service.retrieveMedias();

            expect(retrieved.file).toBeDefined();
            expect(retrieved.thumbnail).toBeDefined();
            expect(retrieved!.file!.type).toBe('file');
            expect(retrieved!.thumbnail!.type).toBe('file');

            const updateDto: AddMediaDto = {
                fileLink: 'https://example.com/new-video.mp4',
                thumbnailLink: 'https://example.com/new.jpg',
            } as AddMediaDto;

            mockMediasRepository.findOne.mockResolvedValueOnce(mockMedia);
            mockMediasRepository.create.mockResolvedValue({});

            await service.changeFile(updateDto);

            expect(mediasRepository.create).toHaveBeenCalledTimes(2);
        });

        it('should handle mixed file types workflow', async () => {
            const dto: AddMediaDto = {
                fileId: 'file-1',
                thumbnailLink: 'https://example.com/thumb.jpg',
            } as AddMediaDto;

            mockMediasRepository.findOne.mockResolvedValue(null);
            mockFileLinksService.linkFileToEntity.mockResolvedValue({
                id: 'file-1',
            });
            mockMediasRepository.create.mockResolvedValue({});

            const result = await service.changeFile(dto);

            expect(result).toEqual({
                message: 'Media file updated successfully',
            });

            const savedEntity = mockMediasRepository.create.mock.calls[0][0];
            expect(savedEntity.file).toBeDefined();
            expect(savedEntity.fileLink).toBeNull();
            expect(savedEntity.thumbnail).toBeNull();
            expect(savedEntity.thumbnailLink).toBe('https://example.com/thumb.jpg');
        });
    });

    describe('Error Edge Cases', () => {
        it('should handle concurrent changeFile operations', async () => {
            const dto: AddMediaDto = {
                fileId: 'file-1',
                thumbnailId: 'thumb-1',
            } as AddMediaDto;

            mockMediasRepository.findOne.mockResolvedValue(null);
            mockFileLinksService.linkFileToEntity.mockResolvedValue({
                id: 'file-1',
            });
            mockMediasRepository.create.mockResolvedValue({});

            const promises = [
                await service.changeFile(dto),
                await service.changeFile(dto),
                await service.changeFile(dto),
            ];

            await Promise.all(promises);

            expect(mediasRepository.create).toHaveBeenCalledTimes(3);
        });

        it('should handle cleanup errors gracefully and continue operation', async () => {
            const dto: AddMediaDto = {
                fileId: 'new-file-1',
                thumbnailId: 'new-thumb-1',
            } as AddMediaDto;

            const existingMedia = {
                id: 'media-1',
                file: { id: 'old-file-link', file: { id: 'old-file-1' } },
                thumbnail: {
                    id: 'old-thumb-link',
                    file: { id: 'old-thumb-1' },
                },
            } as any;

            mockMediasRepository.findOne.mockResolvedValue(existingMedia);
            mockFileLinksService.linkFileToEntity.mockResolvedValue({
                id: 'new',
            });
            mockMediasRepository.create.mockResolvedValue({});
            mockFileLinksService.unlinkAndCleanup.mockRejectedValue(new Error('Cleanup failed'));

            const result = await service.changeFile(dto);
            expect(result).toEqual({
                message: 'Media file updated successfully',
            });
        });

        it('should handle mixed error scenarios', async () => {
            const dto: AddMediaDto = {
                fileId: 'file-1',
                fileLink: 'https://example.com/video.mp4',
                thumbnailId: 'thumb-1',
                thumbnailLink: 'https://example.com/thumb.jpg',
            } as AddMediaDto;

            mockMediasRepository.findOne.mockResolvedValue(null);
            mockErrorHandler.badRequest.mockImplementation(() => {
                throw new Error('Cannot provide both');
            });

            await expect(service.changeFile(dto)).rejects.toThrow();
        });
    });
});
