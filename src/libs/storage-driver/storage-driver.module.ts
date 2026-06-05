import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from '../../common/logger/logger.module';
import { MinioModule } from './minio/minio.module';
import { MinioService } from './minio/minio.service';
import { FileStorageInterface } from '../../interface';
import { AwsService } from './aws/aws.service';

@Global()
@Module({
    imports: [
        LoggerModule,
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        MinioModule,
    ],
    providers: [
        {
            provide: 'FileStorageInterface',
            useFactory: (
                configService: ConfigService,
                s3: AwsService,
                minio: MinioService,
            ): FileStorageInterface => {
                const type = configService.get<string>('STORAGE_TYPE');
                if (type === 'MINIO') return minio;
                if (type === 'AWS') return s3;
                return s3;
            },
            inject: [ConfigService, AwsService, MinioService],
        },
    ],
    exports: ['FileStorageInterface'],
})
export class StorageDriverModule {}
