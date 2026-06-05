import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
    imports: [
        ConfigModule,
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => {
                const redisUrl = configService.get<string>('REDIS_URL');

                if (redisUrl) return { connection: { url: redisUrl } };

                return {
                    connection: {
                        host: configService.getOrThrow<string>('REDIS_HOST'),
                        port: Number.parseInt(configService.getOrThrow<string>('REDIS_PORT'), 10),
                        password: configService.getOrThrow<string>('REDIS_PASSWORD'),
                    },
                };
            },
            inject: [ConfigService],
        }),
    ],
    exports: [BullModule],
})
export class QueueModule {}
