import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { FilesService } from './files.service';
import { FileUsageEnum } from '../../../common/enum';
import { FileLinksEntity } from '../entities/file-links.entity';
import { SMessagesEntity } from '../../supports/entities';
import { In } from 'typeorm';

@Injectable()
export class FileLinksService {
    /**
     * Service responsible for handling file links operations
     */

    constructor(
        @Inject(forwardRef(() => FilesService))
        private readonly filesService: FilesService,
    ) {}

    /**
     * Links a file to an entities for a specific usage (e.g., profile picture, document, etc.).
     * Retrieves the file by its ID, creates a new file link entities, and saves the link.
     */
    async linkFileToEntity(fileId: string, usage: FileUsageEnum): Promise<FileLinksEntity> {
        const file = await this.filesService.retrieveFileByCriteria({
            id: fileId,
        });

        const fileLink = new FileLinksEntity();
        [fileLink.file, fileLink.usage] = [file, usage];

        return await this.filesService.fLinksRepository.create(fileLink);
    }

    /**
     * Links an array of files to a specified entities (e.g., message) for a given usage type.
     * Validates that exactly one target entities is provided and that all file IDs exist.
     * Creates and returns file link entities for each file.
     */
    async linkFilesToEntity(
        fileIds: string[],
        usage: FileUsageEnum,
        entities: {
            message?: SMessagesEntity;
        },
    ): Promise<FileLinksEntity[]> {
        this.filesService.logger.info(`Link files with ids ${fileIds.join(', ')} to ${usage}`);
        const entries = Object.entries(entities).filter(([_, value]) => value !== undefined);

        if (entries.length !== 1)
            this.filesService.errorHandler.forbidden(
                `You must provide exactly one target entities to link files to`,
                `You must provide exactly one target entities to link files to`,
            );

        const files = await this.filesService.filesRepository.find({
            where: { id: In(fileIds) },
        });

        if (fileIds.length !== files.length)
            this.filesService.errorHandler.notFound(
                `Some files aren't found for ${fileIds.length} files`,
                `Files not found`,
            );

        const fileLinks = files.map((file) => {
            const link = new FileLinksEntity();
            Object.assign(link, { file, usage }, entities);
            return link;
        });

        return this.filesService.fLinksRepository.createMany(fileLinks);
    }

    /**
     * Asynchronously removes a file link by its ID and cleans up the associated file if no other links exist.
     * Retrieves the file link, deletes it, and checks if the linked file has any remaining references.
     * If no remaining links exist, deletes the file from storage and the repository.
     */
    async unlinkAndCleanup(fileLinkId: string): Promise<void> {
        const fileLink = await this.filesService.fLinksRepository.findOne({
            where: { id: fileLinkId },
            relations: ['file'],
        });

        if (!fileLink) return;

        const fileId = fileLink.file.id;

        await this.filesService.fLinksRepository.delete({ id: fileLinkId });

        const remainingLinks = await this.filesService.fLinksRepository.count({
            where: { file: { id: fileId } },
        });

        if (remainingLinks === 0) {
            this.filesService.logger.info(
                `No more links for file ${fileId}, deleting from storage`,
            );
            await this.filesService.storage.deleteFile(fileLink.file.path);
            await this.filesService.filesRepository.delete({ id: fileId });
        }
    }
}
