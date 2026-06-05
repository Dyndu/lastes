import { DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';

export const CreateSwaggerConfig = () => {
    const config = new DocumentBuilder()
        .setTitle('Rent Roi API')
        .setDescription('The Rent Roi API description')
        .setVersion('1.0')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
        .setLicense('MIT', 'https://opensource.org/licenses/MIT')
        .setContact('Rent Roi API', 'mailto:softvodooz@gmail.com', 'softvodooz@gmail.com')
        .build();

    const customOptions: SwaggerCustomOptions = {
        swaggerOptions: {
            url: '/docs-json',
            filter: true,
            tagsSorter: 'alpha',
            docExpansion: 'none',
            operationsSorter: (a: any, b: any) => {
                const order = ['get', 'post', 'patch', 'delete'];
                const methodA = a.get('method');
                const methodB = b.get('method');

                if (methodA !== methodB) return order.indexOf(methodA) - order.indexOf(methodB);

                return a.get('path').localeCompare(b.get('path'));
            },
        },
    };

    return { config, customOptions };
};
