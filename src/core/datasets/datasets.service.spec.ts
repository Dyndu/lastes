import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { QueryRunner } from 'typeorm';
import { DatasetsService, numericCapRateParser } from './datasets.service';
import { DatasetsRepository } from './repositories/datasets.repository';
import { DatasetBatchRepository } from './repositories/dataset-batch.repository';
import { FilesService } from '../files/services/files.service';
import { OtherUtils } from '../../utils/services/tools';
import { ErrorHandlerService } from '../../common/response';
import { DatasetEntity } from './entities/dataset.entity';
import { DatasetBatchEntity } from './entities/dataset-batch.entity';
import { FileUsageEnum } from '../../common/enum';
import { Readable } from 'stream';
import * as fs from 'node:fs';
import axios from 'axios';

jest.mock('node:fs');
jest.mock('axios');

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('DatasetsService', () => {
    let service: DatasetsService;
    let logger: jest.Mocked<Logger>;
    let datasetRepo: jest.Mocked<DatasetsRepository>;
    let datasetBatchRepo: jest.Mocked<DatasetBatchRepository>;
    let filesService: jest.Mocked<FilesService>;
    let queryRunner: jest.Mocked<QueryRunner>;

    beforeEach(async () => {
        const mockLogger = {
            error: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
        };

        const mockDatasetRepo = {
            findAndCount: jest.fn(),
            build: jest.fn((entity) => entity),
        };

        const mockDatasetBatchRepo = {
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            getRepository: jest.fn(() => ({
                manager: {
                    connection: {
                        createQueryRunner: jest.fn(() => queryRunner),
                    },
                },
            })),
        };

        const mockFilesService = {
            retrieveFileByCriteria: jest.fn(),
            fileLinksService: {
                linkFileToEntity: jest.fn(),
            },
            storage: {
                deleteFile: jest.fn(),
            },
            filesRepository: {
                delete: jest.fn(),
            },
        } as any;

        const mockOtherUtils = {
            paginateResultsFromCache: jest.fn((data, total, page, limit) => ({
                data,
                total,
                page,
                limit,
            })) as jest.MockedFunction<any>,
        };

        const mockErrorHandler = {
            notFound: jest.fn((msg) => {
                throw new Error(msg);
            }),
            badRequest: jest.fn((msg) => {
                throw new Error(msg);
            }),
        };

        queryRunner = {
            connect: jest.fn(),
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            rollbackTransaction: jest.fn(),
            release: jest.fn(),
            manager: {
                create: jest.fn((_entity, data) => ({ ...data })),
                save: jest.fn((entity) => entity),
                insert: jest.fn(),
                update: jest.fn(),
            },
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DatasetsService,
                { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
                { provide: DatasetsRepository, useValue: mockDatasetRepo },
                {
                    provide: DatasetBatchRepository,
                    useValue: mockDatasetBatchRepo,
                },
                { provide: FilesService, useValue: mockFilesService },
                { provide: OtherUtils, useValue: mockOtherUtils },
                { provide: ErrorHandlerService, useValue: mockErrorHandler },
            ],
        }).compile();

        service = module.get<DatasetsService>(DatasetsService);
        logger = module.get(WINSTON_MODULE_PROVIDER);
        datasetRepo = module.get(DatasetsRepository);
        datasetBatchRepo = module.get(DatasetBatchRepository);
        filesService = module.get(FilesService);
        module.get(OtherUtils);
        module.get(ErrorHandlerService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('numericCapRateParser', () => {
        it('should return undefined for empty value', () => {
            expect(numericCapRateParser()).toBeUndefined();
            expect(numericCapRateParser('')).toBeUndefined();
        });

        it('should parse valid percentage string', () => {
            expect(numericCapRateParser('5.5%')).toBe(5.5);
        });

        it('should parse string with comma as decimal separator', () => {
            expect(numericCapRateParser('5,5')).toBe(5.5);
        });

        it('should return undefined for invalid number', () => {
            expect(numericCapRateParser('invalid')).toBeUndefined();
        });

        it('should parse clean number string', () => {
            expect(numericCapRateParser('10.25')).toBe(10.25);
        });
    });

    describe('transformDataset', () => {
        it('should transform dataset entities to response format', () => {
            const dataset = {
                id: '1',
                city: 'New York',
                state: 'NY',
                zip_code: '10001',
                average: 5.5,
                single_family: 6.0,
                multi_family: 5.0,
                retail: 7.0,
                office: '8.0',
                industrial: '4.5',
                speciality: '6.5',
                property_class: 'A',
            } as DatasetEntity;

            const result = service.transformDataset(dataset);

            expect(result).toEqual({
                id: '1',
                city: 'New York',
                state: 'NY',
                zip_code: '10001',
                average: 5.5,
                single_family: 6.0,
                multi_family: 5.0,
                retail: 7.0,
                office: '8.0',
                industrial: '4.5',
                speciality: '6.5',
                property_class: 'A',
            });
        });
    });

    describe('transformDatasets', () => {
        it('should transform array of datasets', () => {
            const datasets = [
                { id: '1', city: 'NYC', state: 'NY', zip_code: '10001' },
                { id: '2', city: 'LA', state: 'CA', zip_code: '90001' },
            ] as DatasetEntity[];

            const result = service.transformDatasets(datasets);

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('1');
            expect(result[1].id).toBe('2');
        });
    });

    describe('transformBatch', () => {
        it('should transform batch entities to response format', () => {
            const batch = {
                id: '1',
                createdAt: new Date('2024-01-01'),
                rowCount: 100,
                file: {
                    file: {
                        size: 1024,
                    },
                },
            } as DatasetBatchEntity;

            const result = service.transformBatch(batch);

            expect(result).toEqual({
                id: '1',
                lastUpdate: batch.createdAt,
                size: 1024,
                zipCodes: 100,
            });
        });
    });

    describe('transformBatches', () => {
        it('should transform array of batches', () => {
            const batches = [
                {
                    id: '1',
                    createdAt: new Date(),
                    rowCount: 100,
                    file: { file: { size: 1024 } },
                },
                {
                    id: '2',
                    createdAt: new Date(),
                    rowCount: 200,
                    file: { file: { size: 2048 } },
                },
            ] as DatasetBatchEntity[];

            const result = service.transformBatches(batches);

            expect(result).toHaveLength(2);
            expect(result[0].zipCodes).toBe(100);
            expect(result[1].zipCodes).toBe(200);
        });
    });

    describe('getActiveDatasets', () => {
        it('should return paginated active datasets', async () => {
            const activeBatch = {
                id: 'batch-1',
                isActive: true,
            } as DatasetBatchEntity;
            const datasets = [
                { id: '1', city: 'NYC' },
                { id: '2', city: 'LA' },
            ] as DatasetEntity[];

            datasetBatchRepo.findOne.mockResolvedValue(activeBatch);
            datasetRepo.findAndCount.mockResolvedValue([datasets, 2]);

            const result = await service.getActiveDatasets(1, 10);

            expect(datasetBatchRepo.findOne).toHaveBeenCalledWith({
                where: { isActive: true },
            });
            expect(datasetRepo.findAndCount).toHaveBeenCalledWith({
                where: {
                    batch: { id: 'batch-1' },
                    deleted: false,
                },
                order: { createdAt: 'ASC' },
                skip: 0,
                take: 10,
            });
            expect((result as any).total).toBe(2);
        });

        it('should throw error if no active batch found', async () => {
            datasetBatchRepo.findOne.mockResolvedValue(null);

            await expect(service.getActiveDatasets(1, 10)).rejects.toThrow(
                'Dataset batch not found',
            );
        });
    });

    describe('getLastBatch', () => {
        it('should return transformed last batch', async () => {
            const batch = {
                id: '1',
                createdAt: new Date(),
                rowCount: 100,
                file: { file: { size: 1024 } },
            } as DatasetBatchEntity;

            datasetBatchRepo.findOne.mockResolvedValue(batch);

            const result = await service.getLastBatch();

            expect(result).toHaveProperty('id', '1');
            expect(datasetBatchRepo.findOne).toHaveBeenCalledWith({
                where: { deleted: false },
                order: { createdAt: 'DESC' },
                relations: ['file', 'file.file'],
            });
        });

        it('should return empty object if no batch found', async () => {
            datasetBatchRepo.findOne.mockResolvedValue(null);

            const result = await service.getLastBatch();

            expect(result).toEqual({});
        });
    });

    describe('getBatchHistory', () => {
        it('should return paginated batch history', async () => {
            const batches = [
                {
                    id: '1',
                    createdAt: new Date(),
                    rowCount: 100,
                    file: { file: { size: 1024 } },
                },
            ] as DatasetBatchEntity[];

            datasetBatchRepo.findAndCount.mockResolvedValue([batches, 1]);

            const result = await service.getBatchHistory(1, 10);

            expect(datasetBatchRepo.findAndCount).toHaveBeenCalledWith({
                order: { createdAt: 'DESC' },
                skip: 0,
                take: 10,
                relations: ['file', 'file.file'],
            });
            expect((result as any).total).toBe(1);
        });
    });

    describe('buildDataset', () => {
        it('should build dataset with required and optional fields', () => {
            const required = { city: 'NYC', state: 'NY', zip_code: '10001' };
            const optional = { average: 5.5, retail: 7.0 };

            const result = service.buildDataset(required, optional);

            expect(result).toBeInstanceOf(DatasetEntity);
            expect(result.city).toBe('NYC');
            expect(result.state).toBe('NY');
            expect(result.zip_code).toBe('10001');
            expect(result.average).toBe(5.5);
            expect(result.retail).toBe(7.0);
        });
    });

    describe('normalizeRow', () => {
        it('should normalize row keys using header map', () => {
            const row = {
                City: 'NYC',
                State: 'NY',
                'Zip Code': '10001',
                'Average Cap Rate': '5.5%',
            };

            const result = service.normalizeRow(row);

            expect(result).toEqual({
                city: 'NYC',
                state: 'NY',
                zip_code: '10001',
                average: '5.5%',
            });
        });

        it('should ignore unmapped keys', () => {
            const row = {
                city: 'NYC',
                unknown_field: 'value',
            };

            const result = service.normalizeRow(row);

            expect(result).toEqual({ city: 'NYC' });
            expect(result).not.toHaveProperty('unknown_field');
        });
    });

    describe('parseRow', () => {
        it('should parse row with parsers', () => {
            const row = {
                city: 'NYC',
                state: 'NY',
                zip_code: '10001',
                average: '5.5%',
                single_family: '6.0%',
            };

            const result = service.parseRow(row);

            expect(result.city).toBe('NYC');
            expect(result.average).toBe(5.5);
            expect(result.single_family).toBe(6.0);
        });

        it('should trim string values without parsers', () => {
            const row = {
                city: '  NYC  ',
                office: '  8.0  ',
            };

            const result = service.parseRow(row);

            expect(result.city).toBe('NYC');
            expect(result.office).toBe('8.0');
        });

        it('should skip undefined values', () => {
            const row = {
                city: 'NYC',
            };

            const result = service.parseRow(row);

            expect(result).toHaveProperty('city');
            expect(result).not.toHaveProperty('state');
        });
    });

    describe('validateHeaders', () => {
        it('should validate headers successfully', () => {
            const headers = ['city', 'state', 'zip code'];

            expect(() => service.validateHeaders(headers)).not.toThrow();
        });

        it('should throw error for missing required headers', () => {
            const headers = ['city', 'state'];

            expect(() => service.validateHeaders(headers)).toThrow(
                'Missing columns in dataset CSV: zip_code',
            );
        });

        it('should handle case-insensitive headers', () => {
            const headers = ['CITY', 'STATE', 'ZIP CODE'];

            expect(() => service.validateHeaders(headers)).not.toThrow();
        });
    });

    describe('validateRow', () => {
        it('should return true for valid row', () => {
            const row = {
                city: 'NYC',
                state: 'NY',
                zip_code: '10001',
            };

            expect(service.validateRow(row)).toBe(true);
        });

        it('should return false for row missing required field', () => {
            const row = {
                city: 'NYC',
                state: 'NY',
            };

            expect(service.validateRow(row)).toBe(false);
        });

        it('should return false for row with empty required field', () => {
            const row = {
                city: 'NYC',
                state: '',
                zip_code: '10001',
            };

            expect(service.validateRow(row)).toBe(false);
        });
    });

    describe('splitDatasetPayload', () => {
        it('should split row into required and optional fields', () => {
            const row = {
                city: 'NYC',
                state: 'NY',
                zip_code: '10001',
                average: 5.5,
                retail: 7.0,
                office: '8.0',
            };

            const result = service.splitDatasetPayload(row);

            expect(result.required).toEqual({
                city: 'NYC',
                state: 'NY',
                zip_code: '10001',
            });
            expect(result.optional).toEqual({
                average: 5.5,
                single_family: undefined,
                multi_family: undefined,
                retail: 7.0,
                office: '8.0',
                industrial: undefined,
                speciality: undefined,
                property_class: undefined,
            });
        });
    });

    describe('streamFromUrl', () => {
        it('should stream data from URL', async () => {
            const mockStream = new Readable();
            (axios.get as jest.Mock).mockResolvedValue({ data: mockStream });

            const result = await service.streamFromUrl('http://example.com/file.csv');

            expect(axios.get).toHaveBeenCalledWith('http://example.com/file.csv', {
                responseType: 'stream',
            });
            expect(result).toBe(mockStream);
        });
    });

    describe('flushBuffer', () => {
        it('should insert buffer and clear it', async () => {
            const buffer = [
                { id: '1', city: 'NYC' },
                { id: '2', city: 'LA' },
            ] as DatasetEntity[];

            await service.flushBuffer(buffer, queryRunner);

            expect(queryRunner.manager.insert).toHaveBeenCalledWith(
                DatasetEntity,
                expect.any(Array),
            );
            expect(buffer).toHaveLength(0);
        });

        it('should not insert if buffer is empty', async () => {
            const buffer: DatasetEntity[] = [];

            await service.flushBuffer(buffer, queryRunner);

            expect(queryRunner.manager.insert).not.toHaveBeenCalled();
        });
    });

    describe('normalizeHeaders', () => {
        it('should normalize headers to lowercase and trim', () => {
            const headers = ['  City  ', 'STATE', 'Zip Code'];

            const result = service.normalizeHeaders(headers);

            expect(result).toEqual(['city', 'state', 'zip code']);
        });
    });

    describe('resolveInputStream', () => {
        it('should create file stream for local path', async () => {
            const mockStream = new Readable();
            (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

            const result = await service.resolveInputStream('/path/to/file.csv');

            expect(fs.createReadStream).toHaveBeenCalledWith('/path/to/file.csv');
            expect(result).toBe(mockStream);
        });

        it('should stream from URL for http path', async () => {
            const mockStream = new Readable();
            (axios.get as jest.Mock).mockResolvedValue({ data: mockStream });

            const result = await service.resolveInputStream('http://example.com/file.csv');

            expect(axios.get).toHaveBeenCalled();
            expect(result).toBe(mockStream);
        });
    });

    describe('bindCsvStreamEvents', () => {
        it('should bind all stream events', () => {
            const mockStream = {
                on: jest.fn().mockReturnThis(),
            } as any;
            const handleRow = jest.fn();
            const onComplete = jest.fn();
            const onError = jest.fn();

            service.bindCsvStreamEvents(mockStream, handleRow, onComplete, onError);

            expect(mockStream.on).toHaveBeenCalledWith('headers', expect.any(Function));
            expect(mockStream.on).toHaveBeenCalledWith('data', expect.any(Function));
            expect(mockStream.on).toHaveBeenCalledWith('end', expect.any(Function));
            expect(mockStream.on).toHaveBeenCalledWith('error', expect.any(Function));
        });

        it('should validate headers on headers event', () => {
            const mockStream = {
                on: jest.fn(function (event, callback) {
                    if (event === 'headers') {
                        callback(['city', 'state', 'zip code']);
                    }
                    return this;
                }),
            } as any;

            service.bindCsvStreamEvents(mockStream, jest.fn(), jest.fn(), jest.fn());

            expect(mockStream.on).toHaveBeenCalled();
        });
    });

    describe('processRow', () => {
        it('should process valid row successfully', async () => {
            const rawRow = {
                city: 'NYC',
                state: 'NY',
                'zip code': '10001',
            };
            const batch = { id: 'batch-1' } as DatasetBatchEntity;
            const buffer: DatasetEntity[] = [];

            const result = await service.processRow(rawRow, batch, buffer, queryRunner, 1);

            expect(result.success).toBe(true);
            expect(buffer).toHaveLength(1);
            expect(buffer[0].batch).toBe(batch);
        });

        it('should return failure for invalid row', async () => {
            const rawRow = {
                city: 'NYC',
            };
            const batch = { id: 'batch-1' } as DatasetBatchEntity;
            const buffer: DatasetEntity[] = [];

            const result = await service.processRow(rawRow, batch, buffer, queryRunner, 1);

            expect(result.success).toBe(false);
            expect(buffer).toHaveLength(0);
        });

        it('should flush buffer when size reaches limit', async () => {
            const rawRow = {
                city: 'NYC',
                state: 'NY',
                'zip code': '10001',
            };
            const batch = { id: 'batch-1' } as DatasetBatchEntity;
            const buffer: DatasetEntity[] = new Array(99).fill({} as DatasetEntity);

            await service.processRow(rawRow, batch, buffer, queryRunner, 1);

            expect(queryRunner.manager.insert).toHaveBeenCalled();
        });

        it('should log error and return failure on exception', async () => {
            const rawRow = {
                city: 'NYC',
                state: 'NY',
                'zip code': '10001',
            };
            const batch = { id: 'batch-1' } as DatasetBatchEntity;
            const buffer: DatasetEntity[] = [];

            jest.spyOn(service, 'normalizeRow').mockImplementation(() => {
                throw new Error('Test error');
            });

            const result = await service.processRow(rawRow, batch, buffer, queryRunner, 5);

            expect(result.success).toBe(false);
            expect(logger.error).toHaveBeenCalledWith('Row 5 failed', expect.any(Error));
        });
    });

    describe('createRowHandler', () => {
        it('should create handler that processes rows and updates stats', async () => {
            const batch = { id: 'batch-1' } as DatasetBatchEntity;
            const buffer: DatasetEntity[] = [];
            const stats = { success: 0, failed: 0, line: 0 };

            const handler = service.createRowHandler(batch, buffer, queryRunner, stats);

            await handler({
                city: 'NYC',
                state: 'NY',
                'zip code': '10001',
            });

            expect(stats.line).toBe(1);
            expect(stats.success).toBe(1);
            expect(stats.failed).toBe(0);
        });

        it('should increment failed count for invalid row', async () => {
            const batch = { id: 'batch-1' } as DatasetBatchEntity;
            const buffer: DatasetEntity[] = [];
            const stats = { success: 0, failed: 0, line: 0 };

            const handler = service.createRowHandler(batch, buffer, queryRunner, stats);

            await handler({ city: 'NYC' });

            expect(stats.line).toBe(1);
            expect(stats.success).toBe(0);
            expect(stats.failed).toBe(1);
        });
    });

    describe('setupCsvStream', () => {
        it('should setup and process CSV stream successfully', async () => {
            const mockStream = new Readable();
            mockStream.push('city,state,zip code\n');
            mockStream.push('NYC,NY,10001\n');
            mockStream.push(null);

            jest.spyOn(service, 'resolveInputStream').mockResolvedValue(mockStream);

            const batch = { id: 'batch-1' } as DatasetBatchEntity;

            const result = await service.setupCsvStream('/path/to/file.csv', batch, queryRunner);

            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('failed');
        });

        it('should reject on error', async () => {
            jest.spyOn(service, 'resolveInputStream').mockRejectedValue(new Error('Stream error'));

            const batch = { id: 'batch-1' } as DatasetBatchEntity;

            await expect(
                service.setupCsvStream('/path/to/file.csv', batch, queryRunner),
            ).rejects.toThrow('Stream error');
        });
    });

    describe('processCsvFile', () => {
        it('should delegate to setupCsvStream', async () => {
            const expectedResult = { success: 10, failed: 2 };
            jest.spyOn(service, 'setupCsvStream').mockResolvedValue(expectedResult);

            const batch = { id: 'batch-1' } as DatasetBatchEntity;

            const result = await service.processCsvFile('/path/to/file.csv', batch, queryRunner);

            expect(result).toEqual(expectedResult);
            expect(service.setupCsvStream).toHaveBeenCalledWith(
                '/path/to/file.csv',
                batch,
                queryRunner,
            );
        });
    });

    describe('createBatch', () => {
        it('should create and save batch', async () => {
            const fileLinks = { id: 'link-1' };
            (filesService.fileLinksService.linkFileToEntity as jest.Mock).mockResolvedValue(
                fileLinks as any,
            );

            await service.createBatch('file-1', queryRunner);

            expect(filesService.fileLinksService.linkFileToEntity).toHaveBeenCalledWith(
                'file-1',
                FileUsageEnum.DATASET_BATCH,
            );
            expect(queryRunner.manager.create).toHaveBeenCalledWith(DatasetBatchEntity, {
                file: fileLinks,
                isActive: false,
                rowCount: 0,
            });
            expect(queryRunner.manager.save).toHaveBeenCalled();
        });
    });

    describe('finalizeBatch', () => {
        it('should update batch and deactivate others', async () => {
            const batch = {
                id: 'batch-1',
                rowCount: 0,
                isActive: false,
            } as DatasetBatchEntity;

            await service.finalizeBatch(batch, 100, queryRunner);

            expect(batch.rowCount).toBe(100);
            expect(batch.isActive).toBe(true);
            expect(queryRunner.manager.save).toHaveBeenCalledWith(batch);
            expect(queryRunner.manager.update).toHaveBeenCalledWith(
                DatasetBatchEntity,
                { id: expect.anything() },
                { isActive: false },
            );
        });
    });

    describe('cleanupFailedImport', () => {
        it('should delete file and database record', async () => {
            await service.cleanupFailedImport('file-1', '/path/to/file.csv');

            expect(filesService.storage.deleteFile).toHaveBeenCalledWith('/path/to/file.csv');
            expect(filesService.filesRepository.delete).toHaveBeenCalledWith({
                id: 'file-1',
            });
        });
    });

    describe('importCsv', () => {
        beforeEach(() => {
            filesService.retrieveFileByCriteria.mockResolvedValue({
                id: 'file-1',
                path: '/path/to/file.csv',
            } as any);
        });

        it('should import CSV successfully', async () => {
            const batch = { id: 'batch-1' } as DatasetBatchEntity;
            jest.spyOn(service, 'createBatch').mockResolvedValue(batch);
            jest.spyOn(service, 'processCsvFile').mockResolvedValue({
                success: 100,
                failed: 5,
            });
            jest.spyOn(service, 'finalizeBatch').mockResolvedValue(undefined);

            const result = await service.importCsv('file-1');

            expect(queryRunner.connect).toHaveBeenCalled();
            expect(queryRunner.startTransaction).toHaveBeenCalled();
            expect(service.createBatch).toHaveBeenCalledWith('file-1', queryRunner);
            expect(service.processCsvFile).toHaveBeenCalledWith(
                '/path/to/file.csv',
                batch,
                queryRunner,
            );
            expect(service.finalizeBatch).toHaveBeenCalledWith(batch, 100, queryRunner);
            expect(queryRunner.commitTransaction).toHaveBeenCalled();
            expect(queryRunner.release).toHaveBeenCalled();
            expect(result).toEqual({ success: 100, failed: 5 });
        });

        it('should throw error if no valid rows', async () => {
            const batch = { id: 'batch-1' } as DatasetBatchEntity;
            jest.spyOn(service, 'createBatch').mockResolvedValue(batch);
            jest.spyOn(service, 'processCsvFile').mockResolvedValue({
                success: 0,
                failed: 10,
            });

            await expect(service.importCsv('file-1')).rejects.toThrow('CSV contains no valid rows');

            expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
            expect(queryRunner.release).toHaveBeenCalled();
        });

        it('should rollback and cleanup on error', async () => {
            const batch = { id: 'batch-1' } as DatasetBatchEntity;
            jest.spyOn(service, 'createBatch').mockResolvedValue(batch);
            jest.spyOn(service, 'processCsvFile').mockRejectedValue(new Error('Processing error'));
            jest.spyOn(service, 'cleanupFailedImport').mockResolvedValue(undefined);

            await expect(service.importCsv('file-1')).rejects.toThrow('Processing error');

            expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
            expect(service.cleanupFailedImport).toHaveBeenCalledWith('file-1', '/path/to/file.csv');
            expect(logger.error).toHaveBeenCalledWith('CSV import failed', expect.any(Error));
            expect(queryRunner.release).toHaveBeenCalled();
        });

        it('should release query runner even on error', async () => {
            const batch = { id: 'batch-1' } as DatasetBatchEntity;
            jest.spyOn(service, 'createBatch').mockResolvedValue(batch);
            jest.spyOn(service, 'processCsvFile').mockRejectedValue(new Error('Error'));
            jest.spyOn(service, 'cleanupFailedImport').mockResolvedValue(undefined);

            await expect(service.importCsv('file-1')).rejects.toThrow();

            expect(queryRunner.release).toHaveBeenCalled();
        });
    });
});
