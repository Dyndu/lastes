import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as fs from 'node:fs';
import axios from 'axios';
import csv from 'csv-parser';
import { DatasetsRepository } from './repositories/datasets.repository';
import { DatasetEntity } from './entities/dataset.entity';
import { ErrorHandlerService } from '../../common/response';
import { DatasetBatchRepository } from './repositories/dataset-batch.repository';
import { Not, QueryRunner } from 'typeorm';
import { DatasetBatchEntity } from './entities/dataset-batch.entity';
import { FilesService } from '../files/services/files.service';
import { FileUsageEnum } from '../../common/enum';
import { OtherUtils } from '../../utils/services/tools';

type DatasetColumnConfig = {
    key: keyof DatasetEntity;
    required: boolean;
    parser?: (value: string) => any;
};

export const numericCapRateParser = (value?: string): number | undefined => {
    if (!value) return undefined;
    const cleaned = value.replaceAll('%', '').replace(',', '.').trim();
    const num = Number(cleaned);
    return Number.isNaN(num) ? undefined : num;
};

export const CSV_HEADER_MAP: Record<string, keyof DatasetEntity> = {
    city: 'city',
    state: 'state',
    'zip code': 'zip_code',
    'average cap rate': 'average',
    'average single-family': 'single_family',
    'average multi-family': 'multi_family',
    'average retail': 'retail',
    'average office': 'office',
    'average industrial': 'industrial',
    'average specialty': 'speciality',
};

export const DATASET_COLUMNS: DatasetColumnConfig[] = [
    { key: 'city', required: true },
    { key: 'state', required: true },
    { key: 'zip_code', required: true },
    { key: 'average', required: false, parser: numericCapRateParser },
    { key: 'single_family', required: false, parser: numericCapRateParser },
    { key: 'multi_family', required: false, parser: numericCapRateParser },
    { key: 'retail', required: false, parser: numericCapRateParser },
    { key: 'office', required: false },
    { key: 'industrial', required: false },
    { key: 'speciality', required: false },
    { key: 'property_class', required: false },
];

const BUFFER_SIZE = 100;
const COMMIT_INTERVAL = 10_000;

@Injectable()
export class DatasetsService {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        private readonly datasetRepo: DatasetsRepository,
        private readonly datasetBatchRepo: DatasetBatchRepository,
        readonly filesService: FilesService,
        private readonly otherUtils: OtherUtils,
        private readonly errorHandler: ErrorHandlerService,
    ) {}

    /**
     * Transforms a DatasetEntity into a structured format for API responses,
     * including all relevant property and location details.
     */
    transformDataset = (d: DatasetEntity) => ({
        id: d.id,
        city: d.city,
        state: d.state,
        zip_code: d.zip_code,
        average: d.average,
        single_family: d.single_family,
        multi_family: d.multi_family,
        retail: d.retail,
        office: d.office,
        industrial: d.industrial,
        speciality: d.speciality,
        property_class: d.property_class,
    });

    /**
     * Transforms an array of DatasetEntity objects into a structured format for API responses.
     */
    transformDatasets = (ds: DatasetEntity[]) => ds.map((d) => this.transformDataset(d));

    /**
     * Transforms a DatasetBatchEntity into a structured format for API responses,
     * including batch ID, last update timestamp, file size, and number of zip codes.
     */
    transformBatch = (b: DatasetBatchEntity) => ({
        id: b.id,
        lastUpdate: b.createdAt,
        size: b.file.file.size,
        zipCodes: b.rowCount,
    });

    /**
     * Transforms an array of DatasetBatchEntity objects into a structured format for API responses.
     */
    transformBatches = (bs: DatasetBatchEntity[]) => bs.map((b) => this.transformBatch(b));

    /**
     * Fetches paginated active datasets from the currently active batch.
     * Throws an error if no active batch is found.
     * Returns paginated results with transformed dataset data.
     */
    async getActiveDatasets(page: number, limit: number) {
        const activeBatch = await this.datasetBatchRepo.findOne({
            where: { isActive: true },
        });
        if (!activeBatch) this.errorHandler.notFound(`Dataset batch not found`);
        const [data, total] = await this.datasetRepo.findAndCount({
            where: {
                batch: { id: activeBatch.id },
                deleted: false,
            },
            order: { createdAt: 'ASC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return this.otherUtils.paginateResultsFromCache(
            this.transformDatasets(data),
            total,
            page,
            limit,
        );
    }

    /**
     * Retrieves the most recently created (non-deleted) dataset batch,
     * including its associated file details, and transforms it for API responses.
     * Returns an empty object if no batch is found.
     */
    async getLastBatch() {
        const lastBatch = await this.datasetBatchRepo.findOne({
            where: { deleted: false },
            order: { createdAt: 'DESC' },
            relations: ['file', 'file.file'],
        });

        if (lastBatch) return this.transformBatch(lastBatch);
        else return {};
    }

    /**
     * Fetches paginated history of dataset batches, ordered by creation date (newest first).
     * Returns paginated results with transformed batch data, including file details.
     */
    async getBatchHistory(page: number, limit: number) {
        const [data, total] = await this.datasetBatchRepo.findAndCount({
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['file', 'file.file'],
        });

        return this.otherUtils.paginateResultsFromCache(
            this.transformBatches(data),
            total,
            page,
            limit,
        );
    }

    /**
     * Constructs and returns a new DatasetEntity by merging required location fields (city, state, zip_code)
     * with optional property and classification fields (e.g., average values, property types, property class).
     */
    buildDataset(
        required: {
            city: string;
            state: string;
            zip_code: string;
        },
        optional: {
            average?: number;
            single_family?: number;
            multi_family?: number;
            retail?: number;
            office?: string;
            industrial?: string;
            speciality?: string;
            property_class?: string;
        },
    ) {
        const dataset = new DatasetEntity();
        Object.assign(dataset, required, optional);
        return dataset;
    }

    /**
     * Normalizes a row of data by converting keys to lowercase, trimming whitespace,
     * and mapping them to standardized keys using a predefined CSV_HEADER_MAP.
     * Only includes keys that exist in the map.
     */
    normalizeRow(row: Record<string, any>) {
        const normalized: Record<string, any> = {};

        Object.entries(row).forEach(([key, value]) => {
            const normalizedKey = key.toLowerCase().trim();
            const mappedKey = CSV_HEADER_MAP[normalizedKey];

            if (mappedKey) normalized[mappedKey] = value;
        });

        return normalized;
    }

    /**
     * Parses a row of data by iterating over predefined DATASET_COLUMNS.
     * Applies custom parsers to each column value if available, otherwise trims string values.
     * Skips undefined values.
     */
    parseRow(row: any) {
        const parsed: any = {};

        for (const column of DATASET_COLUMNS) {
            const raw = row[column.key];

            if (raw === undefined) continue;

            parsed[column.key] = column.parser ? column.parser(raw) : raw?.trim();
        }

        return parsed;
    }

    /**
     * Validates CSV headers by mapping them to standardized keys using CSV_HEADER_MAP.
     * Checks if all required headers (as defined in DATASET_COLUMNS) are present.
     * Throws an error if any required headers are missing.
     */
    validateHeaders(headers: string[]) {
        const mappedHeaders = new Set(
            headers.map((h) => CSV_HEADER_MAP[h.toLowerCase().trim()]).filter(Boolean),
        );

        const requiredHeaders = DATASET_COLUMNS.filter((c) => c.required).map((c) => c.key);

        const missing = requiredHeaders.filter((key) => !mappedHeaders.has(key));

        if (missing.length)
            this.errorHandler.notFound(
                `Missing columns in dataset CSV: ${missing.join(', ')}`,
                `Missing columns in dataset CSV: ${missing.join(', ')}`,
            );
    }

    /**
     * Validates a row by checking if all required columns (as defined in DATASET_COLUMNS)
     * have non-empty values. Returns `true` if valid, otherwise `false`.
     */
    validateRow(row: any): boolean {
        for (const column of DATASET_COLUMNS) {
            if (column.required && !row[column.key]) return false;
        }
        return true;
    }

    /**
     * Splits a dataset row into `required` and `optional` fields.
     * Required fields include location data (city, state, zip_code),
     * while optional fields include property metrics and classifications.
     */
    splitDatasetPayload(row: any) {
        return {
            required: {
                city: row.city,
                state: row.state,
                zip_code: row.zip_code,
            },
            optional: {
                average: row.average,
                single_family: row.single_family,
                multi_family: row.multi_family,
                retail: row.retail,
                office: row.office,
                industrial: row.industrial,
                speciality: row.speciality,
                property_class: row.property_class,
            },
        };
    }

    /**
     * Fetches data from a given URL as a stream using axios.
     * Returns the response data as a readable stream.
     */
    async streamFromUrl(url: string) {
        const response = await axios.get(url, {
            responseType: 'stream',
        });

        return response.data;
    }

    /**
     * Inserts a buffer of DatasetEntity records into the database using the provided QueryRunner.
     * Clears the buffer after insertion and tracks the number of inserted records.
     * Commits the transaction and starts a new one if the insert count reaches COMMIT_INTERVAL.
     */
    async flushBuffer(buffer: DatasetEntity[], queryRunner: QueryRunner) {
        if (!buffer.length) return;
        let inserted = 0;

        await queryRunner.manager.insert(DatasetEntity, buffer);
        buffer.length = 0;

        inserted += 1000;

        if (inserted >= COMMIT_INTERVAL) {
            await queryRunner.commitTransaction();
            await queryRunner.startTransaction();
        }
    }

    /**
     * Normalizes an array of header strings by converting each to lowercase and trimming whitespace.
     */
    normalizeHeaders = (headers: string[]) => headers.map((h) => h.toLowerCase().trim());

    /**
     * Resolves an input file path to a readable stream.
     * If the path is a URL, streams data from the URL; otherwise, creates a stream from the local file system.
     */
    async resolveInputStream(filePath: string): Promise<NodeJS.ReadableStream> {
        return filePath.startsWith('http')
            ? this.streamFromUrl(filePath)
            : fs.createReadStream(filePath);
    }

    bindCsvStreamEvents(
        stream: NodeJS.ReadableStream,
        handleRow: (row: Record<string, any>) => Promise<void>,
        onComplete: () => Promise<void>,
        onError: (err: unknown) => void,
    ) {
        stream
            .on('headers', (headers: string[]) => {
                this.validateHeaders(this.normalizeHeaders(headers));
            })
            .on('data', async (rawRow: Record<string, any>) => {
                stream.pause();
                await handleRow(rawRow);
                stream.resume();
            })
            .on('end', () => {
                void onComplete().catch(onError);
            })
            .on('error', onError);
    }

    async processRow(
        rawRow: Record<string, any>,
        batch: DatasetBatchEntity,
        buffer: DatasetEntity[],
        queryRunner: QueryRunner,
        lineNumber: number,
    ): Promise<{ success: boolean }> {
        try {
            const normalized = this.normalizeRow(rawRow);
            const parsed = this.parseRow(normalized);

            if (!this.validateRow(parsed)) return { success: false };

            const { required, optional } = this.splitDatasetPayload(parsed);
            const entity = this.datasetRepo.build(this.buildDataset(required, optional));

            entity.batch = batch;
            buffer.push(entity);

            if (buffer.length >= BUFFER_SIZE) await this.flushBuffer(buffer, queryRunner);

            return { success: true };
        } catch (err) {
            this.logger.error(`Row ${lineNumber} failed`, err);
            return { success: false };
        }
    }

    createRowHandler(
        batch: DatasetBatchEntity,
        buffer: DatasetEntity[],
        queryRunner: QueryRunner,
        stats: { success: number; failed: number; line: number },
    ) {
        return async (rawRow: Record<string, any>) => {
            stats.line++;
            const result = await this.processRow(rawRow, batch, buffer, queryRunner, stats.line);

            if (result.success) stats.success++;
            else stats.failed++;
        };
    }

    async setupCsvStream(
        filePath: string,
        batch: DatasetBatchEntity,
        queryRunner: QueryRunner,
    ): Promise<{ success: number; failed: number }> {
        const buffer: DatasetEntity[] = [];
        const stats = { success: 0, failed: 0, line: 1 };

        return new Promise((resolve, reject) => {
            void (async () => {
                try {
                    const inputStream = await this.resolveInputStream(filePath);
                    const csvStream = inputStream.pipe(csv());
                    const handleRow = this.createRowHandler(batch, buffer, queryRunner, stats);

                    this.bindCsvStreamEvents(
                        csvStream,
                        handleRow,
                        async () => {
                            await this.flushBuffer(buffer, queryRunner);
                            resolve({
                                success: stats.success,
                                failed: stats.failed,
                            });
                        },
                        reject,
                    );
                } catch (err) {
                    reject(err);
                }
            })();
        });
    }

    async processCsvFile(
        filePath: string,
        batch: DatasetBatchEntity,
        queryRunner: QueryRunner,
    ): Promise<{ success: number; failed: number }> {
        return this.setupCsvStream(filePath, batch, queryRunner);
    }

    async createBatch(fileId: string, queryRunner: QueryRunner): Promise<DatasetBatchEntity> {
        const fileLinks = await this.filesService.fileLinksService.linkFileToEntity(
            fileId,
            FileUsageEnum.DATASET_BATCH,
        );

        const batch = queryRunner.manager.create(DatasetBatchEntity, {
            file: fileLinks,
            isActive: false,
            rowCount: 0,
        });

        await queryRunner.manager.save(batch);
        return batch;
    }

    async finalizeBatch(
        batch: DatasetBatchEntity,
        successCount: number,
        queryRunner: QueryRunner,
    ): Promise<void> {
        batch.rowCount = successCount;
        batch.isActive = true;

        await queryRunner.manager.save(batch);

        await queryRunner.manager.update(
            DatasetBatchEntity,
            { id: Not(batch.id) },
            { isActive: false },
        );
    }

    async cleanupFailedImport(fileId: string, filePath: string): Promise<void> {
        await this.filesService.storage.deleteFile(filePath);
        await this.filesService.filesRepository.delete({ id: fileId });
    }

    async importCsv(fileId: string) {
        const file = await this.filesService.retrieveFileByCriteria({
            id: fileId,
        });

        const queryRunner = this.datasetBatchRepo
            .getRepository()
            .manager.connection.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const batch = await this.createBatch(fileId, queryRunner);

            const stats = await this.processCsvFile(file.path, batch, queryRunner);

            if (stats.success === 0) this.errorHandler.badRequest('CSV contains no valid rows');

            await this.finalizeBatch(batch, stats.success, queryRunner);
            await queryRunner.commitTransaction();

            return stats;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            await this.cleanupFailedImport(fileId, file.path);

            this.logger.error('CSV import failed', err);
            throw err;
        } finally {
            await queryRunner.release();
        }
    }
}
