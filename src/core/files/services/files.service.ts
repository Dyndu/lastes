import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { v4 as uuidv4 } from 'uuid';
import fromBuffer from 'image-size';
import { Logger } from 'winston';
import { FilesRepository } from '../repositories/files.repository';
import { FileEntity } from '../entities/file.entity';
import { type FileStorageInterface } from '../../../interface';
import { FileTypeEnum } from '../../../common/enum';
import { GlobalUtils } from '../../../utils/services/tools';
import { ErrorHandlerService } from '../../../common/response';
import { FileLinksRepository } from '../repositories/file-links.repository';
import { FileLinksService } from './file-links.service';

@Injectable()
export class FilesService {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        @Inject('FileStorageInterface') readonly storage: FileStorageInterface,
        @Inject(forwardRef(() => FileLinksService))
        readonly fileLinksService: FileLinksService,
        readonly filesRepository: FilesRepository,
        readonly fLinksRepository: FileLinksRepository,
        private readonly globalUtils: GlobalUtils,
        readonly errorHandler: ErrorHandlerService,
    ) {}

    /**
     * Retrieves a file based on the provided criteria.
     * Formats the criteria for logging, searches for an active file matching the criteria,
     * and throws a "not found" error if no file is found.
     */
    async retrieveFileByCriteria(criteria: Record<string, any>): Promise<FileEntity> {
        const entries = this.globalUtils.others.formatCriteria(criteria);

        this.logger.info(`Finding a file by criteria ${entries}`);

        const isFileExist = await this.filesRepository.findActiveOne(
            this.filesRepository,
            criteria,
        );

        if (!isFileExist)
            this.errorHandler.notFound(`File not found with entry ${entries}`, `File not found`);

        return isFileExist;
    }

    /**
     * Performs necessary logic and processing before saving a file.
     * Uploads the file to storage and determines its type based on the MIME type.
     * Create a new file entities with details such as label, path, size, and type.
     * If the file is an image, calculates and sets its dimensions.
     * Returns the constructed file entities ready for saving.
     */
    async logicBeforeSavingFile(file: Express.Multer.File) {
        const uuid = uuidv4();
        const path = await this.storage.uploadFile(file, uuid);
        const fileType = this.globalUtils.files.determineFileType(file.mimetype);

        const fileEntity = new FileEntity();

        fileEntity.label = this.globalUtils.files.generateObjectName(uuid, file.originalname);
        fileEntity.path = path;
        fileEntity.size = file.size;
        fileEntity.type = fileType;

        if (fileType === FileTypeEnum.IMAGE) {
            const dimensions = fromBuffer(file.buffer);
            [fileEntity.width, fileEntity.height] = [dimensions.width, dimensions.height];
        }

        return fileEntity;
    }

    /**
     * Creates a file entities from an uploaded file.
     * Logs the creation process and performs the necessary preprocessing logic.
     * Saves the file entities to the repository and returns the created file entities.
     */
    async createFileFromUpload(file: Express.Multer.File) {
        this.logger.info(`Creating file from upload with data`);
        const fileEntity = await this.logicBeforeSavingFile(file);

        return await this.filesRepository.create(fileEntity);
    }

    /**
     * Creates multiple file entities from an array of uploaded files.
     * Logs the creation process and iterates over each file to perform the necessary preprocessing logic.
     * Collects all file entities and saves them to the repository in a batch operation.
     * Returns an array of the created file entities.
     */
    async createFilesFromUploads(files: Express.Multer.File[]): Promise<FileEntity[]> {
        this.logger.info(`Creating multiple files from uploads`);

        const fileEntities: FileEntity[] = [];
        for (const file of files) {
            const fileEntity = await this.logicBeforeSavingFile(file);
            fileEntities.push(fileEntity);
        }

        return await this.filesRepository.createMany(fileEntities);
    }
}
