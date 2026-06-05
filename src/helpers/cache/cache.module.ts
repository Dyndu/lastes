import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const cacheProvider = {
    provide: 'REDIS_CLIENT',
    useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        if (redisUrl) return new Redis(redisUrl);

        return new Redis({
            host: configService.getOrThrow<string>('REDIS_HOST'),
            port: Number.parseInt(configService.getOrThrow<string>('REDIS_PORT'), 10),
            password: configService.getOrThrow<string>('REDIS_PASSWORD'),
        });
    },
    inject: [ConfigService],
};

@Global()
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
    ],
    providers: [cacheProvider, CacheService],
    exports: [cacheProvider, CacheService],
})
export class CacheModule {}
