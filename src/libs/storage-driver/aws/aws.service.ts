import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { FileStorageInterface } from '../../../interface';
import { ErrorHandlerService } from '../../../common/response';
import { FilesUtils } from '../../../utils/services/tools';

@Injectable()
export class AwsService implements FileStorageInterface {
    private readonly s3: S3Client;
    readonly bucketName: string;
    readonly awsEndpoint: string;

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        private readonly configService: ConfigService,
        private readonly filesUtils: FilesUtils,
        private readonly errorHandlerService: ErrorHandlerService,
    ) {
        [this.bucketName, this.awsEndpoint] = [
            this.configService.get<string>('AWS_BUCKET_NAME')!,
            `https://${this.configService.get<string>('AWS_ENDPOINT')!}`,
        ];
        this.s3 = new S3Client({
            region: this.configService.get<string>('AWS_REGION')!,
            endpoint: this.awsEndpoint,
            credentials: {
                accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID')!,
                secretAccessKey: this.configService.get<string>('AWS_SECRET_KEY')!,
            },
            forcePathStyle: true,
        });
    }

    /**
     * Uploads a file to an AWS S3 bucket.
     * Logs the upload process and generates a unique key for the file.
     * Set up the parameters for the S3 upload, including the bucket name, file key, body, and content type.
     * Executes the upload command and returns the URL of the uploaded file.
     * Handle any errors that occur during the upload process.
     */
    async uploadFile(file: Express.Multer.File, uuid: string): Promise<string> {
        try {
            this.logger.info(`Uploading file in AWS S3 bucket`);
            const key = this.filesUtils.generateObjectName(uuid, file.originalname);

            const params = {
                Bucket: this.bucketName,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
            };

            const command = new PutObjectCommand(params);
            await this.s3.send(command);

            return `${this.awsEndpoint}/${this.bucketName}/${key}`;
        } catch (e: any) {
            this.errorHandlerService.fail(
                `Error uploading file to S3: ${e.message}`,
                `Error: ${e.message}`,
            );
        }
    }

    /**
     * Deletes a file from an AWS S3 bucket based on the provided path.
     * Logs the deletion process and extracts the file key from the path.
     * Set up the parameters for the S3 deletion, including the bucket name and file key.
     * Executes the deletion command and returns a success message upon completion.
     * Handle any errors that occur during the deletion process.
     */
    async deleteFile(path: string) {
        try {
            this.logger.info(`Delete file by path: ${path} from aws store`);
            const key = path.split('.com/')[1];
            const params = {
                Bucket: this.bucketName,
                Key: key,
            };
            const command = new DeleteObjectCommand(params);
            await this.s3.send(command);
            return { message: 'File deleted successfully' };
        } catch (e) {
            this.errorHandlerService.fail(
                `Error deleting file: ${e.message}`,
                `Error deleting file: ${e.message}`,
            );
        }
    }
}
