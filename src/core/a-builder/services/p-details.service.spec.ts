import { Test, TestingModule } from '@nestjs/testing';
import { PDetailsService } from './p-details.service';
import { ABuilderService } from './a-builder.service';
import { PDetailsEntity, ABuilderEntity } from '../entities';
import { PropertyDetailsTypeEnum } from '../../../common/enum';
import { UpdatePDetailsDto } from '../dto';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('PDetailsService', () => {
    let service: PDetailsService;

    const mockForbiddenFn = jest.fn();
    const mockNotFoundFn = jest.fn();
    const mockLoggerInfo = jest.fn();
    const mockFormatCriteria = jest.fn();
    const mockFindActiveOne = jest.fn();
    const mockRepositoryUpdate = jest.fn();
    const mockDeletePDetailsUnits = jest.fn();
    const mockCreatePDetailsUnits = jest.fn();

    const mockABuilderService = {
        errorHandler: {
            forbidden: mockForbiddenFn,
            notFound: mockNotFoundFn,
        },
        logger: {
            info: mockLoggerInfo,
        },
        otherUtils: {
            formatCriteria: mockFormatCriteria,
        },
        pDetailsRepository: {
            findActiveOne: mockFindActiveOne,
            update: mockRepositoryUpdate,
        },
        unitsService: {
            deletePDetailsUnits: mockDeletePDetailsUnits,
            createPDetailsUnits: mockCreatePDetailsUnits,
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PDetailsService,
                {
                    provide: ABuilderService,
                    useValue: mockABuilderService,
                },
            ],
        }).compile();

        service = module.get<PDetailsService>(PDetailsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('checkSingleFamilyUnits', () => {
        it('should call forbidden when status is SINGLE_FAMILY and units.length > 1', () => {
            const units = [{}, {}] as any[];

            service.checkSingleFamilyUnits(PropertyDetailsTypeEnum.SINGLE_FAMILY, units);

            expect(mockForbiddenFn).toHaveBeenCalledWith(
                `More than 1 units is not allowed for ${PropertyDetailsTypeEnum.SINGLE_FAMILY}`,
                `Forbidden, you can't add more than one unit for this family type`,
            );
        });

        it('should NOT call forbidden when status is SINGLE_FAMILY and units.length === 1', () => {
            service.checkSingleFamilyUnits(PropertyDetailsTypeEnum.SINGLE_FAMILY, [{} as any]);

            expect(mockForbiddenFn).not.toHaveBeenCalled();
        });

        it('should NOT call forbidden when status is SINGLE_FAMILY and units is empty', () => {
            service.checkSingleFamilyUnits(PropertyDetailsTypeEnum.SINGLE_FAMILY, []);

            expect(mockForbiddenFn).not.toHaveBeenCalled();
        });

        it('should NOT call forbidden when status is not SINGLE_FAMILY even with multiple units', () => {
            service.checkSingleFamilyUnits(PropertyDetailsTypeEnum.MULTI_FAMILY, [
                {} as any,
                {} as any,
            ]);

            expect(mockForbiddenFn).not.toHaveBeenCalled();
        });
    });

    describe('calculateTotalIncome', () => {
        it('should sum all monthly rents with a positive monthlyIncome', () => {
            const result = service.calculateTotalIncome([1000, 1500, 2000], 500);
            expect(result).toBe(5000);
        });

        it('should sum rents only when monthlyIncome is undefined', () => {
            const result = service.calculateTotalIncome([1000, 2000]);
            expect(result).toBe(3000);
        });

        it('should sum rents only when monthlyIncome is 0', () => {
            const result = service.calculateTotalIncome([1000, 2000], 0);
            expect(result).toBe(3000);
        });

        it('should return 0 when rents array is empty and no monthlyIncome', () => {
            const result = service.calculateTotalIncome([]);
            expect(result).toBe(0);
        });

        it('should return monthlyIncome only when rents array is empty', () => {
            const result = service.calculateTotalIncome([], 800);
            expect(result).toBe(800);
        });

        it('should treat null/undefined rent values as 0', () => {
            const result = service.calculateTotalIncome([null, undefined, 1000] as any[]);
            expect(result).toBe(1000);
        });

        it('should ignore negative monthlyIncome', () => {
            const result = service.calculateTotalIncome([1000], -100);
            expect(result).toBe(1000);
        });
    });

    describe('buildPDetailsEntity', () => {
        const required = {
            status: PropertyDetailsTypeEnum.SINGLE_FAMILY,
            totalIncome: 3000,
        };

        it('should return a PDetailsEntity instance with required fields', () => {
            const result = service.buildPDetailsEntity(required, {});

            expect(result).toBeInstanceOf(PDetailsEntity);
            expect(result.status).toBe(required.status);
            expect(result.totalIncome).toBe(required.totalIncome);
        });

        it('should assign optional fields when provided', () => {
            const optional = {
                monthlyIncome: 500,
                analysisBuilder: new ABuilderEntity(),
            };

            const result = service.buildPDetailsEntity(required, optional);

            expect(result.monthlyIncome).toBe(optional.monthlyIncome);
            expect(result.analysisBuilder).toBe(optional.analysisBuilder);
        });

        it('should leave optional fields undefined when not provided', () => {
            const result = service.buildPDetailsEntity(required, {});

            expect(result.monthlyIncome).toBeUndefined();
            expect(result.analysisBuilder).toBeUndefined();
        });
    });

    describe('retrievePDetailsByCriteria', () => {
        it('should return the entities when found', async () => {
            const criteria = { id: 'uuid-001' };
            const entity = new PDetailsEntity();
            mockFormatCriteria.mockReturnValue('id=uuid-001');
            mockFindActiveOne.mockResolvedValue(entity);

            const result = await service.retrievePDetailsByCriteria(criteria);

            expect(mockFormatCriteria).toHaveBeenCalledWith(criteria);
            expect(mockLoggerInfo).toHaveBeenCalledWith('Find a property details by id=uuid-001');
            expect(mockFindActiveOne).toHaveBeenCalledWith(
                mockABuilderService.pDetailsRepository,
                criteria,
                undefined,
            );
            expect(result).toBe(entity);
        });

        it('should pass relations to findActiveOne when provided', async () => {
            const criteria = { id: 'uuid-002' };
            const relations = ['units', 'analysisBuilder'];
            const entity = new PDetailsEntity();
            mockFormatCriteria.mockReturnValue('id=uuid-002');
            mockFindActiveOne.mockResolvedValue(entity);

            await service.retrievePDetailsByCriteria(criteria, relations);

            expect(mockFindActiveOne).toHaveBeenCalledWith(
                mockABuilderService.pDetailsRepository,
                criteria,
                relations,
            );
        });

        it('should call notFound when entities is not found', async () => {
            const criteria = { id: 'missing-uuid' };
            mockFormatCriteria.mockReturnValue('id=missing-uuid');
            mockFindActiveOne.mockResolvedValue(null);

            await service.retrievePDetailsByCriteria(criteria);

            expect(mockNotFoundFn).toHaveBeenCalledWith(
                'Data not found with id=missing-uuid',
                'Data not found',
            );
        });
    });

    describe('updatePDetails', () => {
        let pDetails: PDetailsEntity;

        beforeEach(() => {
            pDetails = new PDetailsEntity();
            pDetails.id = 'entities-uuid-123';
        });

        it('should return early message when pUpdates is undefined', async () => {
            const result = await service.updatePDetails(pDetails, undefined);

            expect(result).toEqual({
                message: 'No updates provided for property details',
            });
            expect(mockRepositoryUpdate).not.toHaveBeenCalled();
        });

        it('should return early message when pUpdates is an empty object', async () => {
            const result = await service.updatePDetails(pDetails, {});

            expect(result).toEqual({
                message: 'No updates provided for property details',
            });
            expect(mockRepositoryUpdate).not.toHaveBeenCalled();
        });

        it('should call repository.update with only defined fields', async () => {
            mockRepositoryUpdate.mockResolvedValue({ affected: 1 });

            await service.updatePDetails(pDetails, {
                status: PropertyDetailsTypeEnum.MULTI_FAMILY,
                totalIncome: 5000,
            });

            expect(mockRepositoryUpdate).toHaveBeenCalledWith(
                { id: 'entities-uuid-123' },
                {
                    status: PropertyDetailsTypeEnum.MULTI_FAMILY,
                    totalIncome: 5000,
                },
            );
        });

        it('should exclude undefined fields from the update payload', async () => {
            mockRepositoryUpdate.mockResolvedValue({ affected: 1 });

            await service.updatePDetails(pDetails, {
                totalIncome: 4000,
                status: undefined,
            });

            const payload = mockRepositoryUpdate.mock.calls[0][1];
            expect(payload).toHaveProperty('totalIncome', 4000);
            expect(payload).not.toHaveProperty('status');
        });

        it('should include all three fields when all are defined', async () => {
            mockRepositoryUpdate.mockResolvedValue({ affected: 1 });

            await service.updatePDetails(pDetails, {
                status: PropertyDetailsTypeEnum.SINGLE_FAMILY,
                totalIncome: 2000,
                monthlyIncome: 500,
            });

            expect(mockRepositoryUpdate).toHaveBeenCalledWith(
                { id: 'entities-uuid-123' },
                {
                    status: PropertyDetailsTypeEnum.SINGLE_FAMILY,
                    totalIncome: 2000,
                    monthlyIncome: 500,
                },
            );
        });

        it('should return the repository.update result', async () => {
            const mockResult = { affected: 1, raw: [] };
            mockRepositoryUpdate.mockResolvedValue(mockResult);

            const result = await service.updatePDetails(pDetails, {
                totalIncome: 3000,
            });

            expect(result).toBe(mockResult);
        });
    });

    describe('updatePDInformation', () => {
        let pDetails: PDetailsEntity;

        beforeEach(() => {
            pDetails = new PDetailsEntity();
            pDetails.id = 'pd-uuid-001';
            pDetails.totalIncome = 3000;

            mockFormatCriteria.mockReturnValue('id=pd-uuid-001');
            mockFindActiveOne.mockResolvedValue(pDetails);
            mockRepositoryUpdate.mockResolvedValue({ affected: 1 });
            mockDeletePDetailsUnits.mockResolvedValue(undefined);
            mockCreatePDetailsUnits.mockResolvedValue(undefined);
        });

        it('should log, retrieve, update and return success when no units provided', async () => {
            const dto: UpdatePDetailsDto = {
                monthlyIncome: 600,
                status: PropertyDetailsTypeEnum.SINGLE_FAMILY,
            } as UpdatePDetailsDto;

            const result = await service.updatePDInformation('pd-uuid-001', dto);

            expect(mockLoggerInfo).toHaveBeenCalledWith('Updating property details by pd-uuid-001');
            expect(mockDeletePDetailsUnits).not.toHaveBeenCalled();
            expect(mockCreatePDetailsUnits).not.toHaveBeenCalled();
            expect(mockRepositoryUpdate).toHaveBeenCalledWith(
                { id: 'pd-uuid-001' },
                expect.objectContaining({ monthlyIncome: 600 }),
            );
            expect(result).toEqual({ message: 'Successfully updated property details' });
        });

        it('should delete and recreate units when units are provided', async () => {
            const units = [{ monthlyRent: 1200 }, { monthlyRent: 800 }] as any[];
            const dto: UpdatePDetailsDto = { units } as UpdatePDetailsDto;

            await service.updatePDInformation('pd-uuid-001', dto);

            expect(mockDeletePDetailsUnits).toHaveBeenCalledWith(pDetails);
            expect(mockCreatePDetailsUnits).toHaveBeenCalledWith(pDetails, units);
        });

        it('should call checkSingleFamilyUnits when units and status are provided', async () => {
            const units = [{ monthlyRent: 1000 }, { monthlyRent: 500 }] as any[];
            const dto: UpdatePDetailsDto = {
                units,
                status: PropertyDetailsTypeEnum.SINGLE_FAMILY,
            } as UpdatePDetailsDto;

            const checkSpy = jest.spyOn(service, 'checkSingleFamilyUnits');

            await service.updatePDInformation('pd-uuid-001', dto);

            expect(checkSpy).toHaveBeenCalledWith(PropertyDetailsTypeEnum.SINGLE_FAMILY, units);
        });

        it('should NOT call checkSingleFamilyUnits when units are provided but status is not', async () => {
            const units = [{ monthlyRent: 1000 }] as any[];
            const dto: UpdatePDetailsDto = { units } as UpdatePDetailsDto;

            const checkSpy = jest.spyOn(service, 'checkSingleFamilyUnits');

            await service.updatePDInformation('pd-uuid-001', dto);

            expect(checkSpy).not.toHaveBeenCalled();
        });

        it('should recalculate totalIncome when units and monthlyIncome are provided', async () => {
            const units = [{ monthlyRent: 1000 }, { monthlyRent: 500 }] as any[];
            const dto: UpdatePDetailsDto = {
                units,
                monthlyIncome: 200,
            } as UpdatePDetailsDto;

            await service.updatePDInformation('pd-uuid-001', dto);

            expect(mockRepositoryUpdate).toHaveBeenCalledWith(
                { id: 'pd-uuid-001' },
                expect.objectContaining({ totalIncome: 1700 }),
            );
        });

        it('should keep existing totalIncome when units are provided but monthlyIncome is not', async () => {
            const units = [{ monthlyRent: 1000 }] as any[];
            const dto: UpdatePDetailsDto = { units } as UpdatePDetailsDto;

            await service.updatePDInformation('pd-uuid-001', dto);

            expect(mockRepositoryUpdate).toHaveBeenCalledWith(
                { id: 'pd-uuid-001' },
                expect.objectContaining({ totalIncome: 3000 }),
            );
        });

        it('should return success message after all operations', async () => {
            const dto: UpdatePDetailsDto = {
                status: PropertyDetailsTypeEnum.MULTI_FAMILY,
            } as UpdatePDetailsDto;

            const result = await service.updatePDInformation('pd-uuid-001', dto);

            expect(result).toEqual({ message: 'Successfully updated property details' });
        });
    });
});
