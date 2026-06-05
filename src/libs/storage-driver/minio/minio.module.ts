import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import * as Minio from 'minio';
import { MinioService } from './minio.service';
import { LoggerModule } from '../../../common/logger/logger.module';

@Global()
@Module({
    imports: [
        ConfigModule,
        MulterModule.register({
            dest: './uploads',
        }),
        LoggerModule,
    ],
    providers: [
        MinioService,
        {
            provide: 'MINIO_CLIENT',
            useFactory: (configService: ConfigService) => {
                return new Minio.Client({
                    endPoint: configService.get<string>('MINIO_ENDPOINT', 'localhost'),
                    port: Number.parseInt(configService.get<string>('MINIO_PORT', '9000'), 10),
                    useSSL: configService.get<boolean>('MINIO_USE_SSL', true),
                    accessKey: configService.get<string>('MINIO_ROOT_USER', 'minioadmin'),
                    secretKey: configService.get<string>('MINIO_ROOT_PASSWORD', 'minioadmin'),
                });
            },
            inject: [ConfigService],
        },
    ],
    exports: ['MINIO_CLIENT', MinioService],
})
export class MinioModule {}
