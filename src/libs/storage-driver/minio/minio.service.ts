import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as Minio from 'minio';
import { FileStorageInterface } from '../../../interface';
import { ErrorHandlerService } from '../../../common/response';
import { FilesUtils } from '../../../utils/services/tools';

@Injectable()
export class MinioService implements FileStorageInterface {
    readonly bucketName: string;
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        @Inject('MINIO_CLIENT')
        readonly minioClient: Minio.Client,
        private readonly configService: ConfigService,
        private readonly errorHandlerService: ErrorHandlerService,
        private readonly filesUtils: FilesUtils,
    ) {
        this.bucketName = this.configService.get<string>('MINIO_BUCKET_NAME')!;
    }

    /**
     * Ensures that a given MinIO bucket exists, creating it if it does not.
     */
    async ensureBucketExists(bucketName: string): Promise<void> {
        const exists = await this.minioClient.bucketExists(bucketName);
        if (!exists) {
            this.logger.info(`Bucket ${bucketName} does not exist. Creating...`);
            await this.minioClient.makeBucket(bucketName);
        }
    }

    /**
     * Generates a presigned URL for accessing an object in a MinIO bucket.
     */
    async generatePresignedUrl(
        bucketName: string,
        objectName: string,
        mimetype: string,
    ): Promise<string> {
        return await this.minioClient.presignedGetObject(bucketName, objectName, 604800, {
            'response-content-disposition': 'inline',
            'response-content-type': mimetype,
        });
    }

    /**
     * Uploads a file to a configured MinIO bucket, ensuring the bucket exists and
     * generating a presigned URL for access.
     */
    async uploadFile(file: Express.Multer.File, uuid: string): Promise<string> {
        this.logger.info(`Uploading file: ${file.originalname}`);

        const bucketName = this.bucketName;
        const objectName = this.filesUtils.generateObjectName(uuid, file.originalname);

        try {
            await this.ensureBucketExists(bucketName);
            await this.minioClient.putObject(bucketName, objectName, file.buffer);
            return await this.generatePresignedUrl(bucketName, objectName, file.mimetype);
        } catch (err) {
            this.errorHandlerService.fail(
                `Error uploading file: ${JSON.stringify(err, Object.getOwnPropertyNames(err))}`,
                `Error uploading file: ${err.message || err}`,
            );
        }
    }

    /**
     * Deletes a specified object from the configured MinIO bucket.
     */
    async deleteFile(objectName: string): Promise<object> {
        const removeObject = this.minioClient.removeObject.bind(this.minioClient);
        await removeObject(this.bucketName, objectName).catch((err: { message: any }) => {
            this.errorHandlerService.fail(
                `Error deleting file: ${err.message}`,
                `Error deleting file: ${err.message}`,
            );
        });

        return { message: 'File deleted successfully' };
    }
}
