import { ElasticsearchTransport, type ElasticsearchTransportOptions } from 'winston-elasticsearch';

const elasticsearchOptions: ElasticsearchTransportOptions = {
    level: 'info',
    clientOpts: {
        node: 'http://localhost:9200', //
    },
    indexPrefix: 'app-logs',
};

export const elasticsearchTransport = new ElasticsearchTransport(elasticsearchOptions);

export { elasticsearchOptions };
