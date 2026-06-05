import { Test, TestingModule } from '@nestjs/testing';
import { DatasetsController } from './datasets.controller';
import { DatasetsService } from './datasets.service';
import { PaginationDto, FieldDto } from '../../common/dto';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

interface DatasetResponse {
    id: string;
    city: string;
    state: string;
    zip_code: string;
    average?: number;
    single_family?: number;
    multi_family?: number;
    retail?: number;
    office?: string;
    industrial?: string;
    speciality?: string;
    property_class?: string;
}

interface BatchResponse {
    id: string;
    lastUpdate: Date;
    size: number;
    zipCodes: number;
}

interface ImportStatsResponse {
    success: number;
    failed: number;
}

describe('DatasetsController', () => {
    let controller: DatasetsController;
    let service: jest.Mocked<DatasetsService>;

    const mockPaginatedResponse: PaginatedResponse<DatasetResponse> = {
        data: [
            {
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
            },
            {
                id: '2',
                city: 'Los Angeles',
                state: 'CA',
                zip_code: '90001',
                average: 4.8,
                single_family: 5.5,
                multi_family: 4.2,
                retail: 6.5,
                office: '7.5',
                industrial: '4.0',
                speciality: '6.0',
                property_class: 'B',
            },
        ],
        total: 2,
        page: 1,
        limit: 10,
    };

    const mockBatchResponse: BatchResponse = {
        id: 'batch-123',
        lastUpdate: new Date('2024-01-15T10:30:00Z'),
        size: 2048000,
        zipCodes: 150,
    };

    const mockBatchHistoryResponse: PaginatedResponse<BatchResponse> = {
        data: [
            {
                id: 'batch-123',
                lastUpdate: new Date('2024-01-15T10:30:00Z'),
                size: 2048000,
                zipCodes: 150,
            },
            {
                id: 'batch-122',
                lastUpdate: new Date('2024-01-14T09:20:00Z'),
                size: 1536000,
                zipCodes: 120,
            },
        ],
        total: 2,
        page: 1,
        limit: 10,
    };

    const mockImportStats: ImportStatsResponse = {
        success: 145,
        failed: 5,
    };

    const mockEnvConfigService = {
        sAdminRole: 'superadmin',
        adminRole: 'admin',
        userRole: 'user',
        supportRole: 'support',
    };

    const mockErrorHandlerService = {
        forbidden: jest.fn((_message, userMessage) => {
            throw new Error(userMessage);
        }),
    };

    beforeEach(async () => {
        const mockService = {
            getActiveDatasets: jest.fn() as jest.MockedFunction<
                () => Promise<PaginatedResponse<DatasetResponse>>
            >,
            getLastBatch: jest.fn() as jest.MockedFunction<() => Promise<BatchResponse | {}>>,
            getBatchHistory: jest.fn() as jest.MockedFunction<
                () => Promise<PaginatedResponse<BatchResponse>>
            >,
            importCsv: jest.fn() as jest.MockedFunction<() => Promise<ImportStatsResponse>>,
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [DatasetsController],
            providers: [
                {
                    provide: DatasetsService,
                    useValue: mockService,
                },
                {
                    provide: EnvConfigService,
                    useValue: mockEnvConfigService,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
            ],
        }).compile();

        controller = module.get<DatasetsController>(DatasetsController);
        service = module.get(DatasetsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should be defined', () => {
            expect(controller).toBeDefined();
        });

        it('should inject DatasetsService', () => {
            expect(service).toBeDefined();
        });
    });

    describe('allDatasets', () => {
        it('should return paginated datasets with default pagination', async () => {
            const pagination = new PaginationDto();
            pagination.page = 1;
            pagination.limit = 10;

            service.getActiveDatasets.mockResolvedValue(mockPaginatedResponse);

            const result = (await controller.allDatasets(
                pagination,
            )) as PaginatedResponse<DatasetResponse>;

            expect(service.getActiveDatasets).toHaveBeenCalledWith(1, 10);
            expect(service.getActiveDatasets).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockPaginatedResponse);
            expect(result.data).toHaveLength(2);
            expect(result.total).toBe(2);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
        });

        it('should return paginated datasets with custom pagination', async () => {
            const pagination = new PaginationDto();
            pagination.page = 2;
            pagination.limit = 20;

            const customResponse: PaginatedResponse<DatasetResponse> = {
                ...mockPaginatedResponse,
                page: 2,
                limit: 20,
            };

            service.getActiveDatasets.mockResolvedValue(customResponse);

            const result = (await controller.allDatasets(
                pagination,
            )) as PaginatedResponse<DatasetResponse>;

            expect(service.getActiveDatasets).toHaveBeenCalledWith(2, 20);
            expect(result.page).toBe(2);
            expect(result.limit).toBe(20);
        });

        it('should return empty data array when no datasets found', async () => {
            const pagination = new PaginationDto();
            pagination.page = 1;
            pagination.limit = 10;

            const emptyResponse: PaginatedResponse<DatasetResponse> = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
            };

            service.getActiveDatasets.mockResolvedValue(emptyResponse);

            const result = (await controller.allDatasets(
                pagination,
            )) as PaginatedResponse<DatasetResponse>;

            expect(result.data).toHaveLength(0);
            expect(result.total).toBe(0);
        });

        it('should handle large page numbers', async () => {
            const pagination = new PaginationDto();
            pagination.page = 100;
            pagination.limit = 50;

            const largePageResponse: PaginatedResponse<DatasetResponse> = {
                data: [],
                total: 0,
                page: 100,
                limit: 50,
            };

            service.getActiveDatasets.mockResolvedValue(largePageResponse);

            const result = (await controller.allDatasets(
                pagination,
            )) as PaginatedResponse<DatasetResponse>;

            expect(service.getActiveDatasets).toHaveBeenCalledWith(100, 50);
            expect(result.data).toHaveLength(0);
        });

        it('should propagate service errors', async () => {
            const pagination = new PaginationDto();
            pagination.page = 1;
            pagination.limit = 10;

            const error = new Error('Dataset batch not found');
            service.getActiveDatasets.mockRejectedValue(error);

            await expect(controller.allDatasets(pagination)).rejects.toThrow(
                'Dataset batch not found',
            );
            expect(service.getActiveDatasets).toHaveBeenCalledTimes(1);
        });
    });

    describe('lastBatch', () => {
        it('should return the last batch information', async () => {
            service.getLastBatch.mockResolvedValue(mockBatchResponse);

            const result = await controller.lastBatch();

            expect(service.getLastBatch).toHaveBeenCalledTimes(1);
            expect(service.getLastBatch).toHaveBeenCalledWith();
            expect(result).toEqual(mockBatchResponse);

            const typedResult = result as BatchResponse;
            expect(typedResult.id).toBe('batch-123');
            expect(typedResult.zipCodes).toBe(150);
            expect(typedResult.size).toBe(2048000);
        });

        it('should return empty object when no batch exists', async () => {
            service.getLastBatch.mockResolvedValue({});

            const result = await controller.lastBatch();

            expect(service.getLastBatch).toHaveBeenCalledTimes(1);
            expect(result).toEqual({});
        });

        it('should handle batch with all properties', async () => {
            const fullBatch: BatchResponse = {
                id: 'batch-456',
                lastUpdate: new Date('2024-02-01T15:45:00Z'),
                size: 3072000,
                zipCodes: 200,
            };

            service.getLastBatch.mockResolvedValue(fullBatch);

            const result = await controller.lastBatch();

            expect(result).toEqual(fullBatch);

            const typedResult = result as BatchResponse;
            expect(typedResult.id).toBe('batch-456');
        });

        it('should propagate service errors', async () => {
            const error = new Error('Database connection failed');
            service.getLastBatch.mockRejectedValue(error);

            await expect(controller.lastBatch()).rejects.toThrow('Database connection failed');
            expect(service.getLastBatch).toHaveBeenCalledTimes(1);
        });
    });

    describe('batchHistory', () => {
        it('should return paginated batch history with default pagination', async () => {
            const pagination = new PaginationDto();
            pagination.page = 1;
            pagination.limit = 10;

            service.getBatchHistory.mockResolvedValue(mockBatchHistoryResponse);

            const result = (await controller.batchHistory(
                pagination,
            )) as PaginatedResponse<BatchResponse>;

            expect(service.getBatchHistory).toHaveBeenCalledWith(1, 10);
            expect(service.getBatchHistory).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockBatchHistoryResponse);
            expect(result.data).toHaveLength(2);
            expect(result.total).toBe(2);
        });

        it('should return paginated batch history with custom pagination', async () => {
            const pagination = new PaginationDto();
            pagination.page = 3;
            pagination.limit = 5;

            const customResponse: PaginatedResponse<BatchResponse> = {
                data: [
                    {
                        id: 'batch-121',
                        lastUpdate: new Date('2024-01-13T08:15:00Z'),
                        size: 1024000,
                        zipCodes: 90,
                    },
                ],
                total: 15,
                page: 3,
                limit: 5,
            };

            service.getBatchHistory.mockResolvedValue(customResponse);

            const result = (await controller.batchHistory(
                pagination,
            )) as PaginatedResponse<BatchResponse>;

            expect(service.getBatchHistory).toHaveBeenCalledWith(3, 5);
            expect(result.page).toBe(3);
            expect(result.limit).toBe(5);
            expect(result.data).toHaveLength(1);
        });

        it('should return empty history when no batches exist', async () => {
            const pagination = new PaginationDto();
            pagination.page = 1;
            pagination.limit = 10;

            const emptyResponse: PaginatedResponse<BatchResponse> = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
            };

            service.getBatchHistory.mockResolvedValue(emptyResponse);

            const result = (await controller.batchHistory(
                pagination,
            )) as PaginatedResponse<BatchResponse>;

            expect(result.data).toHaveLength(0);
            expect(result.total).toBe(0);
        });

        it('should handle first page of batch history', async () => {
            const pagination = new PaginationDto();
            pagination.page = 1;
            pagination.limit = 25;

            const firstPageResponse: PaginatedResponse<BatchResponse> = {
                data: mockBatchHistoryResponse.data,
                total: 50,
                page: 1,
                limit: 25,
            };

            service.getBatchHistory.mockResolvedValue(firstPageResponse);

            const result = (await controller.batchHistory(
                pagination,
            )) as PaginatedResponse<BatchResponse>;

            expect(service.getBatchHistory).toHaveBeenCalledWith(1, 25);
            expect(result.page).toBe(1);
            expect(result.total).toBe(50);
        });

        it('should propagate service errors', async () => {
            const pagination = new PaginationDto();
            pagination.page = 1;
            pagination.limit = 10;

            const error = new Error('Failed to retrieve batch history');
            service.getBatchHistory.mockRejectedValue(error);

            await expect(controller.batchHistory(pagination)).rejects.toThrow(
                'Failed to retrieve batch history',
            );
            expect(service.getBatchHistory).toHaveBeenCalledTimes(1);
        });
    });

    describe('uploadDataset', () => {
        it('should upload dataset and return import statistics', async () => {
            const dto = new FieldDto();
            dto.field = 'file-123';

            service.importCsv.mockResolvedValue(mockImportStats);

            const result = (await controller.uploadDataset(dto)) as ImportStatsResponse;

            expect(service.importCsv).toHaveBeenCalledWith('file-123');
            expect(service.importCsv).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockImportStats);
            expect(result.success).toBe(145);
            expect(result.failed).toBe(5);
        });

        it('should handle upload with different file ID', async () => {
            const dto = new FieldDto();
            dto.field = 'file-456';

            const customStats: ImportStatsResponse = {
                success: 200,
                failed: 10,
            };

            service.importCsv.mockResolvedValue(customStats);

            const result = (await controller.uploadDataset(dto)) as ImportStatsResponse;

            expect(service.importCsv).toHaveBeenCalledWith('file-456');
            expect(result.success).toBe(200);
            expect(result.failed).toBe(10);
        });

        it('should handle upload with zero failures', async () => {
            const dto = new FieldDto();
            dto.field = 'file-789';

            const perfectStats: ImportStatsResponse = {
                success: 500,
                failed: 0,
            };

            service.importCsv.mockResolvedValue(perfectStats);

            const result = (await controller.uploadDataset(dto)) as ImportStatsResponse;

            expect(result.success).toBe(500);
            expect(result.failed).toBe(0);
        });

        it('should handle upload with zero successes', async () => {
            const dto = new FieldDto();
            dto.field = 'file-000';

            const error = new Error('CSV contains no valid rows');
            service.importCsv.mockRejectedValue(error);

            await expect(controller.uploadDataset(dto)).rejects.toThrow(
                'CSV contains no valid rows',
            );
            expect(service.importCsv).toHaveBeenCalledWith('file-000');
        });

        it('should propagate file not found errors', async () => {
            const dto = new FieldDto();
            dto.field = 'non-existent-file';

            const error = new Error('File not found');
            service.importCsv.mockRejectedValue(error);

            await expect(controller.uploadDataset(dto)).rejects.toThrow('File not found');
            expect(service.importCsv).toHaveBeenCalledTimes(1);
        });

        it('should propagate CSV parsing errors', async () => {
            const dto = new FieldDto();
            dto.field = 'invalid-csv-file';

            const error = new Error('Error during file streaming.');
            service.importCsv.mockRejectedValue(error);

            await expect(controller.uploadDataset(dto)).rejects.toThrow(
                'Error during file streaming.',
            );
        });

        it('should propagate missing columns errors', async () => {
            const dto = new FieldDto();
            dto.field = 'file-missing-columns';

            const error = new Error('Missing columns in dataset CSV: city, state');
            service.importCsv.mockRejectedValue(error);

            await expect(controller.uploadDataset(dto)).rejects.toThrow(
                'Missing columns in dataset CSV: city, state',
            );
        });

        it('should propagate database transaction errors', async () => {
            const dto = new FieldDto();
            dto.field = 'file-db-error';

            const error = new Error('Database transaction failed');
            service.importCsv.mockRejectedValue(error);

            await expect(controller.uploadDataset(dto)).rejects.toThrow(
                'Database transaction failed',
            );
        });
    });

    describe('PaginationDto integration', () => {
        it('should use getPage() method from PaginationDto', async () => {
            const pagination = new PaginationDto();
            pagination.page = 5;
            pagination.limit = 15;

            const getPageSpy = jest.spyOn(pagination, 'getPage');
            const getLimitSpy = jest.spyOn(pagination, 'getLimit');

            const response: PaginatedResponse<DatasetResponse> = {
                data: [],
                total: 0,
                page: 5,
                limit: 15,
            };

            service.getActiveDatasets.mockResolvedValue(response);

            await controller.allDatasets(pagination);

            expect(getPageSpy).toHaveBeenCalled();
            expect(getLimitSpy).toHaveBeenCalled();
        });

        it('should use getLimit() method from PaginationDto', async () => {
            const pagination = new PaginationDto();
            pagination.page = 1;
            pagination.limit = 50;

            const getLimitSpy = jest.spyOn(pagination, 'getLimit');

            const response: PaginatedResponse<BatchResponse> = {
                data: [],
                total: 0,
                page: 1,
                limit: 50,
            };

            service.getBatchHistory.mockResolvedValue(response);

            await controller.batchHistory(pagination);

            expect(getLimitSpy).toHaveBeenCalled();
        });
    });

    describe('FieldDto integration', () => {
        it('should use field property from FieldDto', async () => {
            const dto = new FieldDto();
            dto.field = 'test-file-id';

            service.importCsv.mockResolvedValue(mockImportStats);

            await controller.uploadDataset(dto);

            expect(service.importCsv).toHaveBeenCalledWith(dto.field);
        });

        it('should handle empty field value', async () => {
            const dto = new FieldDto();
            dto.field = '';

            const error = new Error('File ID is required');
            service.importCsv.mockRejectedValue(error);

            await expect(controller.uploadDataset(dto)).rejects.toThrow('File ID is required');
        });
    });

    describe('Controller decorators and metadata', () => {
        it('should have correct controller path', () => {
            const metadata = Reflect.getMetadata('path', DatasetsController);
            expect(metadata).toBe('datasets');
        });
    });

    describe('Error handling', () => {
        it('should handle network errors in allDatasets', async () => {
            const pagination = new PaginationDto();
            pagination.page = 1;
            pagination.limit = 10;

            const error = new Error('Network timeout');
            service.getActiveDatasets.mockRejectedValue(error);

            await expect(controller.allDatasets(pagination)).rejects.toThrow('Network timeout');
        });

        it('should handle unexpected errors in lastBatch', async () => {
            const error = new Error('Unexpected error');
            service.getLastBatch.mockRejectedValue(error);

            await expect(controller.lastBatch()).rejects.toThrow('Unexpected error');
        });

        it('should handle timeout errors in batchHistory', async () => {
            const pagination = new PaginationDto();
            pagination.page = 1;
            pagination.limit = 10;

            const error = new Error('Query timeout');
            service.getBatchHistory.mockRejectedValue(error);

            await expect(controller.batchHistory(pagination)).rejects.toThrow('Query timeout');
        });

        it('should handle validation errors in uploadDataset', async () => {
            const dto = new FieldDto();
            dto.field = 'invalid-format';

            const error = new Error('Invalid file format');
            service.importCsv.mockRejectedValue(error);

            await expect(controller.uploadDataset(dto)).rejects.toThrow('Invalid file format');
        });
    });
});
