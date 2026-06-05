import helmet from 'helmet';
import * as bodyParser from 'body-parser';
import { Logger } from 'nestjs-pino';
import './tracing';
import basicAuth from 'express-basic-auth';
import { NestFactory, Reflector } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { RedocModule } from 'nestjs-redoc';
import { AppModule } from './app.module';
import { CustomValidationPipe, ResponseInterceptor } from './common/response';
import { CircularInterceptor } from './common/interceptors/circular.interceptor';
import { CreateSwaggerConfig } from './helpers/api_documentation/documentation.config';
import { CreateRedocConfig } from './helpers/api_documentation/redoc.config';
import { allSeeder } from './common/seeder/seeder';
import { NestExpressApplication } from '@nestjs/platform-express';

export async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
    const configService = app.get(ConfigService);
    const [env, port, logger] = [
        configService.get<string>('NODE_ENV'),
        configService.getOrThrow('PORT'),
        app.get(Logger),
    ];
    app.getHttpAdapter().getInstance().set('trust proxy', true);

    app.use(helmet());
    app.useLogger(logger);
    app.enableCors({});
    app.use(bodyParser.urlencoded({ extended: false }));
    app.useWebSocketAdapter(new IoAdapter(app));
    app.setGlobalPrefix('api/v1', { exclude: ['/ping'] });
    app.useGlobalInterceptors(new CircularInterceptor());
    app.useGlobalPipes(new CustomValidationPipe());

    app.useGlobalInterceptors(new ResponseInterceptor());
    const reflector = app.get(Reflector);
    app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

    for (const Seeder of allSeeder) {
        const seeder = app.get(Seeder);
        await seeder.seed();
    }

    if (env === 'dev') {
        app.use(
            ['/docs', '/docs-json'],
            basicAuth({
                challenge: true,
                users: {
                    [process.env.SWAGGER_USERNAME as string]: process.env
                        .SWAGGER_PASSWORD as string,
                },
            }),
        );

        const { config, customOptions } = CreateSwaggerConfig();
        const document = SwaggerModule.createDocument(app, config, {
            deepScanRoutes: true,
        });
        SwaggerModule.setup('docs', app, document, customOptions);

        const redocOptions = CreateRedocConfig();
        await RedocModule.setup('/docs-json', app, document, redocOptions);

        await app.listen(port);
    }

    return app;
}

if (require.main === module) {
    bootstrap()
        .then(() => console.log('App is running'))
        .catch((err) =>
            console.debug('Error during bootstrap:', {
                message: err?.message,
                name: err?.name,
            }),
        );
}
