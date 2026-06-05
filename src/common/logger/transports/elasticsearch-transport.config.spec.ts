import { ElasticsearchTransport } from 'winston-elasticsearch';
import { elasticsearchTransport, elasticsearchOptions } from './elasticsearch-transport.config';

describe('elasticsearchTransport', () => {
    it('should be defined', () => {
        expect(elasticsearchTransport).toBeDefined();
    });

    it('should be an instance of ElasticsearchTransport', () => {
        expect(elasticsearchTransport).toBeInstanceOf(ElasticsearchTransport);
    });

    it('should have the correct level', () => {
        expect(elasticsearchTransport.level).toBe('info');
    });

    it('should have the correct indexPrefix', () => {
        expect(elasticsearchOptions.indexPrefix).toBe('app-logs');
    });

    it('should have the correct node URL', () => {
        const transport = elasticsearchTransport as unknown as {
            client: {
                connectionPool: {
                    connections: Array<{ url: { href: string } }>;
                };
            };
        };
        expect(transport.client.connectionPool.connections[0].url.href).toContain(
            'http://localhost:9200',
        );
    });
});
