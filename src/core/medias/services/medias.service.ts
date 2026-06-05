import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { FooterInfoRepository, MediasRepository, SocialRepository } from '../repositories';
import { FileLinksService } from '../../files/services/file-links.service';
import { FileUsageEnum } from '../../../common/enum';
import { UsersEntityTransformService } from '../../users/services';
import { AddMediaDto } from '../dto/add-media.dto';
import { MediaEntity } from '../entities';
import { ErrorHandlerService } from '../../../common/response';
import { SocialService } from './social.service';
import { SocketService } from '../../../helpers/socket/socket.service';
import { OtherUtils } from '../../../utils/services/tools';
import { FInfoService } from './f-info.service';

@Injectable()
export class MediasService {
    /**
     * Service responsible for handling medias operations
     */

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        @Inject(forwardRef(() => SocialService))
        readonly socialService: SocialService,
        @Inject(forwardRef(() => FInfoService))
        readonly fInfoService: FInfoService,
        readonly mediasRepository: MediasRepository,
        readonly fInfoRepo: FooterInfoRepository,
        readonly socketService: SocketService,
        readonly otherUtils: OtherUtils,
        readonly errorHandler: ErrorHandlerService,
        readonly socialRepository: SocialRepository,
        readonly fileLinksService: FileLinksService,
        readonly transformService: UsersEntityTransformService,
    ) {}

    /**
     * Retrieves a single non-deleted media entities with its associated file relations.
     */
    async loadMedia(): Promise<MediaEntity | null> {
        return await this.mediasRepository.findOne({
            where: { deleted: false },
            relations: ['file', 'file.file', 'thumbnail', 'thumbnail.file'],
        });
    }

    /**
     * Resolves the thumbnail for media by either linking a file (using thumbnailId) or using a direct thumbnail link.
     * Validates that both thumbnailId and thumbnailLink are not provided simultaneously.
     * Returns an object with either the linked thumbnail file or the thumbnail link.
     */
    async resolveThumbnail(dto: AddMediaDto) {
        if (dto.thumbnailId && dto.thumbnailLink)
            this.errorHandler.badRequest(
                'Cannot provide both thumbnailId and thumbnailLink',
                'Cannot provide both thumbnailId and thumbnailLink',
            );

        if (!dto.thumbnailId && !dto.thumbnailLink)
            this.errorHandler.badRequest(
                'Either thumbnailId or thumbnailLink must be provided',
                'Either thumbnailId or thumbnailLink must be provided',
            );

        if (dto.thumbnailId) {
            return {
                thumbnail: await this.fileLinksService.linkFileToEntity(
                    dto.thumbnailId,
                    FileUsageEnum.MEDIAS_THUMBNAIL,
                ),
                thumbnailLink: null,
            };
        }

        return {
            thumbnail: null,
            thumbnailLink: dto.thumbnailLink,
        };
    }

    async resolveFile(dto: AddMediaDto) {
        if (dto.fileId && dto.fileLink)
            this.errorHandler.badRequest(
                'Cannot provide both fileId and fileLink',
                'Cannot provide both fileId and fileLink',
            );

        if (!dto.fileId && !dto.fileLink)
            this.errorHandler.badRequest(
                'Either fileId or fileLink must be provided',
                'Either fileId or fileLink must be provided',
            );

        if (dto.fileId) {
            return {
                file: await this.fileLinksService.linkFileToEntity(
                    dto.fileId,
                    FileUsageEnum.MEDIAS,
                ),
                fileLink: null,
            };
        }

        return {
            file: null,
            fileLink: dto.fileLink,
        };
    }

    /**
     * Updates or sets the media file for an entities.
     * If no media exists, links the new file. If media exists, replaces the old file with the new one
     * and cleans up the previous file link. Returns a success message.
     */
    async changeFile(dto: AddMediaDto) {
        this.logger.info('Set or update media file');

        const media = await this.loadMedia();

        const { file, fileLink } = await this.resolveFile(dto);
        const { thumbnail, thumbnailLink } = await this.resolveThumbnail(dto);

        const oldFileId = media?.file?.file?.id;
        const oldThumbnailId = media?.thumbnail?.file?.id;

        const entity = media ?? new MediaEntity();

        if (file) {
            entity.file = file;
            entity.fileLink = null!;
        } else {
            entity.file = null!;
            entity.fileLink = fileLink!;
        }

        if (thumbnail) {
            entity.thumbnail = thumbnail;
            entity.thumbnailLink = null!;
        } else {
            entity.thumbnail = null!;
            entity.thumbnailLink = thumbnailLink!;
        }

        await this.mediasRepository.create(entity);

        if (media) {
            setImmediate(async () => {
                try {
                    if (oldFileId) await this.fileLinksService.unlinkAndCleanup(oldFileId);

                    if (oldThumbnailId)
                        await this.fileLinksService.unlinkAndCleanup(oldThumbnailId);
                } catch (error) {
                    this.logger.error('Failed to cleanup old media files', error);
                }
            });
        }

        return { message: 'Media file updated successfully' };
    }

    /**
     * Transforms a MediaEntity into a structured object containing the main file and thumbnail metadata.
     */
    transformMediaFile(m: MediaEntity) {
        return {
            file: {
                type: m.file ? 'file' : 'link',
                value: m.file ? this.transformService.transformFiles(m.file.file) : m.fileLink,
            },
            thumbnail: {
                type: m.thumbnail ? 'file' : 'link',
                value: m.thumbnail
                    ? this.transformService.transformFiles(m.thumbnail.file)
                    : m.thumbnailLink,
            },
        };
    }

    /**
     * Retrieves media file details if it exists.
     * Returns transformed file metadata or a default empty object if no media is found.
     */
    async retrieveMedias() {
        this.logger.info(`Retrieve medias`);

        const isFileExist = await this.loadMedia();
        if (isFileExist) return this.transformMediaFile(isFileExist);
        else
            return {
                file: null,
                thumbnail: null,
            };
    }
}
