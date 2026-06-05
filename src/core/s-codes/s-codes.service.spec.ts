import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { SCodesService } from './s-codes.service';
import { SCodesRepository } from './s-codes.repository';
import { OtherUtils } from '../../utils/services/tools';
import { SCodeEntity } from './entities/s-code.entity';
import { ErrorHandlerService } from '../../common/response';
import { SocketService } from '../../helpers/socket/socket.service';
import { SocketEventEnum } from '../../common/enum';
import { CacheService } from '../../helpers/cache/cache.service';

describe('SCodesService', () => {
    let service: SCodesService;

    const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    };

    const mockSCodeRepository = {
        getRepository: jest.fn(),
        findActiveOne: jest.fn(),
        assertUniqueActive: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockOtherUtils = {
        formatCriteria: jest.fn(),
    };

    const mockErrorHandler = {
        forbidden: jest.fn(),
        notFound: jest.fn(),
        validation: jest.fn(),
    };

    const mockSocketService = {
        sendDataToRoute: jest.fn(),
    };

    const mockCacheService = {
        deleteKeysByBase: jest.fn(),
        generateRedisKey: jest.fn(),
        retrieveGenericPaginated: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SCodesService,
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: mockLogger,
                },
                {
                    provide: SCodesRepository,
                    useValue: mockSCodeRepository,
                },
                {
                    provide: OtherUtils,
                    useValue: mockOtherUtils,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandler,
                },
                {
                    provide: SocketService,
                    useValue: mockSocketService,
                },
                {
                    provide: CacheService,
                    useValue: mockCacheService,
                },
            ],
        }).compile();

        service = module.get<SCodesService>(SCodesService);
        module.get<Logger>(WINSTON_MODULE_PROVIDER);
        module.get<SCodesRepository>(SCodesRepository);
        module.get<OtherUtils>(OtherUtils);
        module.get<ErrorHandlerService>(ErrorHandlerService);
        module.get<SocketService<any>>(SocketService);
        module.get<CacheService>(CacheService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('transformCode', () => {
        it('should transform a single support code entities', () => {
            const mockEntity = {
                id: '123',
                label: 'Test Code',
                deleted: false,
            } as SCodeEntity;

            const result = service.transformCode(mockEntity);

            expect(result).toEqual({
                id: '123',
                label: 'Test Code',
            });
        });
    });

    describe('transformCodes', () => {
        it('should transform an array of support code entities', () => {
            const mockEntities = [
                { id: '1', label: 'Code 1', deleted: false },
                { id: '2', label: 'Code 2', deleted: false },
            ] as SCodeEntity[];

            const result = service.transformCodes(mockEntities);

            expect(result).toEqual([
                { id: '1', label: 'Code 1' },
                { id: '2', label: 'Code 2' },
            ]);
        });

        it('should return empty array for empty input', () => {
            const result = service.transformCodes([]);
            expect(result).toEqual([]);
        });
    });

    describe('guardReservedLabel', () => {
        it('should throw forbidden error for "other" label', () => {
            service.guardReservedLabel('other', 'create');

            expect(mockErrorHandler.forbidden).toHaveBeenCalledWith(
                `Support code "others" can't be altered, created or deleted`,
                `Forbidden, can't create with label other`,
            );
        });

        it('should throw forbidden error for "others" label', () => {
            service.guardReservedLabel('others', 'update');

            expect(mockErrorHandler.forbidden).toHaveBeenCalledWith(
                `Support code "others" can't be altered, created or deleted`,
                `Forbidden, can't update with label others`,
            );
        });

        it('should throw forbidden error for "OTHER" label (case insensitive)', () => {
            service.guardReservedLabel('OTHER', 'delete');

            expect(mockErrorHandler.forbidden).toHaveBeenCalledWith(
                `Support code "others" can't be altered, created or deleted`,
                `Forbidden, can't delete with label OTHER`,
            );
        });

        it('should throw forbidden error for "  others  " label with whitespace', () => {
            service.guardReservedLabel('  others  ', 'create');

            expect(mockErrorHandler.forbidden).toHaveBeenCalledWith(
                `Support code "others" can't be altered, created or deleted`,
                `Forbidden, can't create with label   others  `,
            );
        });

        it('should not throw error for non-reserved labels', () => {
            service.guardReservedLabel('Valid Label', 'create');

            expect(mockErrorHandler.forbidden).not.toHaveBeenCalled();
        });
    });

    describe('notifyCodeCreation', () => {
        it('should send socket notification with transformed code', () => {
            const mockEntity = {
                id: '123',
                label: 'Test Code',
            } as SCodeEntity;

            service.notifyCodeCreation(mockEntity, SocketEventEnum.SUPPORT_CODE_CREATED);

            expect(mockSocketService.sendDataToRoute).toHaveBeenCalledWith(
                '/s-codes',
                SocketEventEnum.SUPPORT_CODE_CREATED,
                { id: '123', label: 'Test Code' },
            );
        });
    });

    describe('invalidateCodeCache', () => {
        it('should delete cache keys by base', async () => {
            mockCacheService.deleteKeysByBase.mockResolvedValue(undefined);

            await service.invalidateCodeCache();

            expect(mockCacheService.deleteKeysByBase).toHaveBeenCalledWith('support-code');
        });
    });

    describe('retrieveSCodesQuery', () => {
        let mockQueryBuilder: any;

        beforeEach(() => {
            mockQueryBuilder = {
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
            };

            mockSCodeRepository.getRepository.mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
            });
        });

        it('should build query without search term', () => {
            service.retrieveSCodesQuery(0, 10, {});

            expect(mockSCodeRepository.getRepository).toHaveBeenCalled();
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('codes.deleted = false');
            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('codes.updatedAt', 'DESC');
            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
        });

        it('should build query with search term', () => {
            service.retrieveSCodesQuery(0, 10, { searchTerm: 'test' });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('codes.deleted = false');
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                '(codes.label ILIKE :searchTerm)',
                {
                    searchTerm: '%t%e%s%t%',
                },
            );
            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('codes.updatedAt', 'DESC');
            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
        });

        it('should handle pagination correctly', () => {
            service.retrieveSCodesQuery(20, 50, {});

            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(50);
        });
    });

    describe('getAllSCodes', () => {
        it('should retrieve all support codes without search term', async () => {
            const mockCodes = [
                { id: '1', label: 'Code 1' },
                { id: '2', label: 'Code 2' },
            ];

            mockCacheService.generateRedisKey.mockReturnValue('support-code:page:1:limit:10');
            mockCacheService.retrieveGenericPaginated.mockResolvedValue({
                data: mockCodes,
                total: 2,
                page: 1,
                limit: 10,
            });

            const result = await service.getAllSCodes(1, 10, {});

            expect(mockLogger.info).toHaveBeenCalledWith('Getting all support codes');
            expect(mockCacheService.generateRedisKey).toHaveBeenCalledWith('support-code', {});
            expect(mockCacheService.retrieveGenericPaginated).toHaveBeenCalled();
            expect(result).toEqual({
                data: mockCodes,
                total: 2,
                page: 1,
                limit: 10,
            });
        });

        it('should retrieve all support codes with search term', async () => {
            const mockCodes = [{ id: '1', label: 'Test Code' }];

            mockCacheService.generateRedisKey.mockReturnValue(
                'support-code:search:test:page:1:limit:10',
            );
            mockCacheService.retrieveGenericPaginated.mockResolvedValue({
                data: mockCodes,
                total: 1,
                page: 1,
                limit: 10,
            });

            const result = await service.getAllSCodes(1, 10, {
                searchTerm: 'Test',
            });

            expect(mockCacheService.generateRedisKey).toHaveBeenCalledWith('support-code', {
                search: 'test',
            });
            expect(result).toEqual({
                data: mockCodes,
                total: 1,
                page: 1,
                limit: 10,
            });
        });

        it('should use retrieveSCodesQuery callback in cache service', async () => {
            let capturedCallback: any;

            mockCacheService.retrieveGenericPaginated.mockImplementation(
                async (_baseKey, _page, _limit, _filters, queryCallback, _transformCallback) => {
                    capturedCallback = queryCallback;
                    return { data: [], total: 0, page: 1, limit: 10 };
                },
            );

            await service.getAllSCodes(1, 10, { searchTerm: 'test' });

            expect(capturedCallback).toBeDefined();
        });

        it('should use transformCodes callback in cache service', async () => {
            let capturedTransformCallback: any;

            mockCacheService.retrieveGenericPaginated.mockImplementation(
                async (_baseKey, _page, _limit, _filters, _queryCallback, transformCallback) => {
                    capturedTransformCallback = transformCallback;
                    return { data: [], total: 0, page: 1, limit: 10 };
                },
            );

            await service.getAllSCodes(1, 10, {});

            expect(capturedTransformCallback).toBeDefined();

            const mockEntities = [{ id: '1', label: 'Code 1' } as SCodeEntity];
            const transformed = capturedTransformCallback(mockEntities);
            expect(transformed).toEqual([{ id: '1', label: 'Code 1' }]);
        });
    });

    describe('retrieveSCodeByCriteria', () => {
        it('should retrieve a support code by criteria', async () => {
            const mockCode = {
                id: '123',
                label: 'Test Code',
            } as SCodeEntity;

            mockOtherUtils.formatCriteria.mockReturnValue('id: 123');
            mockSCodeRepository.findActiveOne.mockResolvedValue(mockCode);

            const result = await service.retrieveSCodeByCriteria({ id: '123' });

            expect(mockLogger.info).toHaveBeenCalledWith('Find a support code by id: 123');
            expect(mockSCodeRepository.findActiveOne).toHaveBeenCalledWith(mockSCodeRepository, {
                id: '123',
            });
            expect(result).toEqual(mockCode);
        });

        it('should throw not found error when code does not exist', async () => {
            mockOtherUtils.formatCriteria.mockReturnValue('id: 999');
            mockSCodeRepository.findActiveOne.mockResolvedValue(null);

            await service.retrieveSCodeByCriteria({ id: '999' });

            expect(mockErrorHandler.notFound).toHaveBeenCalledWith(
                'Support code not found with id: 999',
                'Support code not found',
            );
        });

        it('should handle multiple criteria', async () => {
            const mockCode = {
                id: '123',
                label: 'Test Code',
            } as SCodeEntity;

            mockOtherUtils.formatCriteria.mockReturnValue('id: 123, label: Test Code');
            mockSCodeRepository.findActiveOne.mockResolvedValue(mockCode);

            await service.retrieveSCodeByCriteria({
                id: '123',
                label: 'Test Code',
            });

            expect(mockLogger.info).toHaveBeenCalledWith(
                'Find a support code by id: 123, label: Test Code',
            );
        });
    });

    describe('ensureLabelIsUnique', () => {
        it('should not throw error when label is unique', async () => {
            mockSCodeRepository.assertUniqueActive.mockResolvedValue(undefined);

            await service.ensureLabelIsUnique('Unique Label');

            expect(mockSCodeRepository.assertUniqueActive).toHaveBeenCalledWith(
                mockSCodeRepository,
                {},
                { label: 'Unique Label' },
                'Support code',
                undefined,
            );
            expect(mockErrorHandler.validation).not.toHaveBeenCalled();
        });

        it('should not throw error when label is unique for update', async () => {
            mockSCodeRepository.assertUniqueActive.mockResolvedValue(undefined);

            await service.ensureLabelIsUnique('Unique Label', '123');

            expect(mockSCodeRepository.assertUniqueActive).toHaveBeenCalledWith(
                mockSCodeRepository,
                {},
                { label: 'Unique Label' },
                'Support code',
                '123',
            );
        });

        it('should throw validation error when label is not unique', async () => {
            mockSCodeRepository.assertUniqueActive.mockImplementation(
                async (_repo, errorsObj, _criteria, _entity, _id) => {
                    errorsObj.label = 'Label already exists';
                    errorsObj.length = 1;
                },
            );

            await service.ensureLabelIsUnique('Duplicate Label');

            expect(mockErrorHandler.validation).toHaveBeenCalled();
        });
    });

    describe('createCode', () => {
        it('should create a new support code successfully', async () => {
            const mockCreatedCode = {
                id: '123',
                label: 'New Code',
            } as SCodeEntity;

            mockSCodeRepository.assertUniqueActive.mockResolvedValue(undefined);
            mockSCodeRepository.create.mockResolvedValue(mockCreatedCode);
            mockCacheService.deleteKeysByBase.mockResolvedValue(undefined);

            const result = await service.createCode('New Code');

            expect(mockLogger.info).toHaveBeenCalledWith('Creating support code with New Code');
            expect(mockSCodeRepository.create).toHaveBeenCalled();
            expect(mockSocketService.sendDataToRoute).toHaveBeenCalledWith(
                '/s-codes',
                SocketEventEnum.SUPPORT_CODE_CREATED,
                { id: '123', label: 'New Code' },
            );
            expect(mockCacheService.deleteKeysByBase).toHaveBeenCalledWith('support-code');
            expect(result).toEqual({ message: 'Code created successfully.' });
        });

        it('should prevent creation of reserved label "other"', async () => {
            mockErrorHandler.forbidden.mockImplementation(() => {
                throw new Error('Forbidden');
            });

            await expect(service.createCode('other')).rejects.toThrow();

            expect(mockErrorHandler.forbidden).toHaveBeenCalled();
            expect(mockSCodeRepository.create).not.toHaveBeenCalled();
        });

        it('should prevent creation of reserved label "others"', async () => {
            mockErrorHandler.forbidden.mockImplementation(() => {
                throw new Error('Forbidden');
            });

            await expect(service.createCode('others')).rejects.toThrow();

            expect(mockErrorHandler.forbidden).toHaveBeenCalled();
            expect(mockSCodeRepository.create).not.toHaveBeenCalled();
        });

        it('should prevent creation when label already exists', async () => {
            mockSCodeRepository.assertUniqueActive.mockImplementation(async (_repo, errorsObj) => {
                errorsObj.label = 'Label already exists';
                errorsObj.length = 1;
            });
            mockErrorHandler.validation.mockImplementation(() => {
                throw new Error('Validation error');
            });

            await expect(service.createCode('Duplicate')).rejects.toThrow();

            expect(mockErrorHandler.validation).toHaveBeenCalled();
            expect(mockSCodeRepository.create).not.toHaveBeenCalled();
        });
    });

    describe('updateCode', () => {
        it('should update a support code successfully', async () => {
            const mockExistingCode = {
                id: '123',
                label: 'Old Label',
            } as SCodeEntity;

            mockOtherUtils.formatCriteria.mockReturnValue('id: 123');
            mockSCodeRepository.findActiveOne.mockResolvedValue(mockExistingCode);
            mockSCodeRepository.assertUniqueActive.mockResolvedValue(undefined);
            mockSCodeRepository.update.mockResolvedValue(undefined);
            mockCacheService.deleteKeysByBase.mockResolvedValue(undefined);

            const result = await service.updateCode('123', 'New Label');

            expect(mockLogger.info).toHaveBeenCalledWith('Update support code with New Label');
            expect(mockSCodeRepository.update).toHaveBeenCalledWith(
                { id: '123' },
                expect.objectContaining({ label: 'New Label' }),
            );
            expect(mockSocketService.sendDataToRoute).toHaveBeenCalledWith(
                '/s-codes',
                SocketEventEnum.SUPPORT_CODE_UPDATED,
                expect.objectContaining({ label: 'New Label' }),
            );
            expect(mockCacheService.deleteKeysByBase).toHaveBeenCalledWith('support-code');
            expect(result).toEqual({ message: 'Code updated successfully.' });
        });

        it('should trim label whitespace during update', async () => {
            const mockExistingCode = {
                id: '123',
                label: 'Old Label',
            } as SCodeEntity;

            mockOtherUtils.formatCriteria.mockReturnValue('id: 123');
            mockSCodeRepository.findActiveOne.mockResolvedValue(mockExistingCode);
            mockSCodeRepository.assertUniqueActive.mockResolvedValue(undefined);
            mockSCodeRepository.update.mockResolvedValue(undefined);
            mockCacheService.deleteKeysByBase.mockResolvedValue(undefined);

            await service.updateCode('123', '  New Label  ');

            expect(mockSCodeRepository.update).toHaveBeenCalledWith(
                { id: '123' },
                expect.objectContaining({ label: 'New Label' }),
            );
        });

        it('should prevent update when the existing code has a reserved label "other"', async () => {
            const mockExistingCode = {
                id: '123',
                label: 'other',
            } as SCodeEntity;

            mockOtherUtils.formatCriteria.mockReturnValue('id: 123');
            mockSCodeRepository.findActiveOne.mockResolvedValue(mockExistingCode);
            mockErrorHandler.forbidden.mockImplementation(() => {
                throw new Error('Forbidden');
            });

            await expect(service.updateCode('123', 'New Label')).rejects.toThrow('Forbidden');

            expect(mockErrorHandler.forbidden).toHaveBeenCalledWith(
                `Support code "others" can't be altered, created or deleted`,
                `Forbidden, can't update with label other`,
            );
            expect(mockSCodeRepository.update).not.toHaveBeenCalled();
        });

        it('should prevent update when the existing code has a reserved label "others"', async () => {
            const mockExistingCode = {
                id: '123',
                label: 'others',
            } as SCodeEntity;

            mockOtherUtils.formatCriteria.mockReturnValue('id: 123');
            mockSCodeRepository.findActiveOne.mockResolvedValue(mockExistingCode);
            mockErrorHandler.forbidden.mockImplementation(() => {
                throw new Error('Forbidden');
            });

            await expect(service.updateCode('123', 'New Label')).rejects.toThrow('Forbidden');

            expect(mockErrorHandler.forbidden).toHaveBeenCalledWith(
                `Support code "others" can't be altered, created or deleted`,
                `Forbidden, can't update with label others`,
            );
            expect(mockSCodeRepository.update).not.toHaveBeenCalled();
        });

        it('should allow updating a non-reserved code even if new label would be reserved (guard only checks existing label)', async () => {
            const mockExistingCode = {
                id: '123',
                label: 'Valid Label',
            } as SCodeEntity;

            mockOtherUtils.formatCriteria.mockReturnValue('id: 123');
            mockSCodeRepository.findActiveOne.mockResolvedValue(mockExistingCode);
            mockSCodeRepository.assertUniqueActive.mockResolvedValue(undefined);
            mockSCodeRepository.update.mockResolvedValue(undefined);
            mockCacheService.deleteKeysByBase.mockResolvedValue(undefined);

            const result = await service.updateCode('123', 'other');

            expect(mockErrorHandler.forbidden).not.toHaveBeenCalled();
            expect(mockSCodeRepository.update).toHaveBeenCalled();
            expect(result).toEqual({ message: 'Code updated successfully.' });
        });

        it('should throw error when code to update does not exist', async () => {
            mockOtherUtils.formatCriteria.mockReturnValue('id: 999');
            mockSCodeRepository.findActiveOne.mockResolvedValue(null);
            mockErrorHandler.notFound.mockImplementation(() => {
                throw new Error('Not found');
            });

            await expect(service.updateCode('999', 'New Label')).rejects.toThrow('Not found');

            expect(mockErrorHandler.notFound).toHaveBeenCalled();
            expect(mockSCodeRepository.update).not.toHaveBeenCalled();
        });

        it('should prevent update when new label already exists', async () => {
            const mockExistingCode = {
                id: '123',
                label: 'Old Label',
            } as SCodeEntity;

            mockOtherUtils.formatCriteria.mockReturnValue('id: 123');
            mockSCodeRepository.findActiveOne.mockResolvedValue(mockExistingCode);
            mockSCodeRepository.assertUniqueActive.mockImplementation(async (_repo, errorsObj) => {
                errorsObj.label = 'Label already exists';
                errorsObj.length = 1;
            });
            mockErrorHandler.validation.mockImplementation(() => {
                throw new Error('Validation error');
            });

            await expect(service.updateCode('123', 'Duplicate Label')).rejects.toThrow(
                'Validation error',
            );

            expect(mockErrorHandler.validation).toHaveBeenCalled();
            expect(mockSCodeRepository.update).not.toHaveBeenCalled();
        });

        it('should skip ensureLabelIsUnique and label update when label is empty', async () => {
            const mockExistingCode = {
                id: '123',
                label: 'Existing Label',
            } as SCodeEntity;

            mockOtherUtils.formatCriteria.mockReturnValue('id: 123');
            mockSCodeRepository.findActiveOne.mockResolvedValue(mockExistingCode);
            mockSCodeRepository.update.mockResolvedValue(undefined);
            mockCacheService.deleteKeysByBase.mockResolvedValue(undefined);

            await service.updateCode('123', '');

            expect(mockSCodeRepository.assertUniqueActive).not.toHaveBeenCalled();
            expect(mockSCodeRepository.update).toHaveBeenCalledWith(
                { id: '123' },
                expect.objectContaining({ label: 'Existing Label' }),
            );
        });
    });

    describe('deleteCode', () => {
        it('should delete a support code successfully', async () => {
            const mockExistingCode = {
                id: '123',
                label: 'Code to Delete',
            } as SCodeEntity;

            mockOtherUtils.formatCriteria.mockReturnValue('id: 123');
            mockSCodeRepository.findActiveOne.mockResolvedValue(mockExistingCode);
            mockSCodeRepository.delete.mockResolvedValue(undefined);
            mockCacheService.deleteKeysByBase.mockResolvedValue(undefined);

            const result = await service.deleteCode('123');

            expect(mockLogger.info).toHaveBeenCalledWith('Delete support code with 123');
            expect(mockSCodeRepository.delete).toHaveBeenCalledWith({
                id: '123',
            });
            expect(mockSocketService.sendDataToRoute).toHaveBeenCalledWith(
                '/s-codes',
                SocketEventEnum.SUPPORT_CODE_DELETED,
                { id: '123', label: 'Code to Delete' },
            );
            expect(mockCacheService.deleteKeysByBase).toHaveBeenCalledWith('support-code');
            expect(result).toEqual({ message: 'Code deleted successfully.' });
        });

        it('should prevent deletion of reserved label "other"', async () => {
            const data = {
                id: '1234',
                label: 'other',
            } as SCodeEntity;

            mockOtherUtils.formatCriteria.mockReturnValue('id: 1234');
            mockSCodeRepository.findActiveOne.mockResolvedValue(data);
            mockErrorHandler.forbidden.mockImplementation(() => {
                throw new Error('Forbidden');
            });

            await expect(service.deleteCode('123')).rejects.toThrow();

            expect(mockErrorHandler.forbidden).toHaveBeenCalled();
            expect(mockSCodeRepository.delete).not.toHaveBeenCalled();
        });

        it('should prevent deletion of reserved label "others"', async () => {
            const mockExistingCode = {
                id: '123',
                label: 'others',
            } as SCodeEntity;

            mockOtherUtils.formatCriteria.mockReturnValue('id: 123');
            mockSCodeRepository.findActiveOne.mockResolvedValue(mockExistingCode);
            mockErrorHandler.forbidden.mockImplementation(() => {
                throw new Error('Forbidden');
            });

            await expect(service.deleteCode('123')).rejects.toThrow();

            expect(mockErrorHandler.forbidden).toHaveBeenCalled();
            expect(mockSCodeRepository.delete).not.toHaveBeenCalled();
        });

        it('should throw error when code to delete does not exist', async () => {
            mockOtherUtils.formatCriteria.mockReturnValue('id: 999');
            mockSCodeRepository.findActiveOne.mockResolvedValue(null);
            mockErrorHandler.notFound.mockImplementation(() => {
                throw new Error('Not found');
            });

            await expect(service.deleteCode('999')).rejects.toThrow();

            expect(mockErrorHandler.notFound).toHaveBeenCalled();
            expect(mockSCodeRepository.delete).not.toHaveBeenCalled();
        });
    });
});
