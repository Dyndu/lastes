import { Test, TestingModule } from '@nestjs/testing';
import { ADetailsService } from './a-details.service';
import { ABuilderService } from './a-builder.service';
import { ADetailsEntity, ABuilderEntity } from '../entities';
import { AcquisitionLoanTypeEnum, AcquisitionMethodEnum } from '../../../common/enum';
import { ADetailsDto } from '../dto';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('ADetailsService', () => {
    let service: ADetailsService;

    const mockValidationFn = jest.fn();
    const mockUpdateFn = jest.fn();

    beforeEach(async () => {
        const mockABuilderService = {
            errorHandler: {
                validation: mockValidationFn,
            },
            aDetailsRepository: {
                update: mockUpdateFn,
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ADetailsService,
                {
                    provide: ABuilderService,
                    useValue: mockABuilderService,
                },
            ],
        }).compile();

        service = module.get<ADetailsService>(ADetailsService);
        module.get(ABuilderService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('validateAcquisitionDetails', () => {
        it('should call errorHandler.validation with no errors when dto is valid (CASH method, no items, with acquisitionCoast)', () => {
            const dto: ADetailsDto = {
                hasItems: false,
                acquisitionCoast: 101500,
                method: AcquisitionMethodEnum.CASH,
            } as ADetailsDto;

            service.validateAcquisitionDetails(dto);

            expect(mockValidationFn).toHaveBeenCalledWith({});
        });

        it('should add acquisitionCoast error when hasItems is false and acquisitionCoast is missing', () => {
            const dto: ADetailsDto = {
                hasItems: false,
                acquisitionCoast: undefined,
                method: AcquisitionMethodEnum.CASH,
            } as ADetailsDto;

            service.validateAcquisitionDetails(dto);

            expect(mockValidationFn).toHaveBeenCalledWith(
                expect.objectContaining({
                    acquisitionCoast: 'Acquisition cost is required when items are not provided',
                }),
            );
        });

        it('should add acquisitionCoast error when hasItems is true but acquisitionCoast is provided', () => {
            const dto: ADetailsDto = {
                hasItems: true,
                item: { someField: 'value' } as any,
                acquisitionCoast: 101500,
                method: AcquisitionMethodEnum.CASH,
            } as ADetailsDto;

            service.validateAcquisitionDetails(dto);

            expect(mockValidationFn).toHaveBeenCalledWith(
                expect.objectContaining({
                    acquisitionCoast:
                        'Acquisition cost must not be provided when items are used — it is calculated automatically',
                }),
            );
        });

        it('should add item error when hasItems is true and item is missing', () => {
            const dto: ADetailsDto = {
                hasItems: true,
                item: undefined,
                method: AcquisitionMethodEnum.CASH,
            } as ADetailsDto;

            service.validateAcquisitionDetails(dto);

            expect(mockValidationFn).toHaveBeenCalledWith(
                expect.objectContaining({
                    item: 'Itemized details are required for acquisition details',
                }),
            );
        });

        it('should NOT add item error when hasItems is true and item is provided', () => {
            const dto: ADetailsDto = {
                hasItems: true,
                item: { someField: 'value' } as any,
                method: AcquisitionMethodEnum.CASH,
            } as ADetailsDto;

            service.validateAcquisitionDetails(dto);

            const errors = mockValidationFn.mock.calls[0][0];
            expect(errors).not.toHaveProperty('item');
        });

        it('should add financed errors when method is FINANCED and all loan fields are missing', () => {
            const dto: ADetailsDto = {
                hasItems: false,
                acquisitionCoast: 101500,
                method: AcquisitionMethodEnum.FINANCED,
                downPayment: undefined,
                loanInterest: undefined,
                loanLength: undefined,
                loanType: undefined,
                points: undefined,
            } as ADetailsDto;

            service.validateAcquisitionDetails(dto);

            expect(mockValidationFn).toHaveBeenCalledWith(
                expect.objectContaining({
                    downPayment: 'These fields are required for financed method',
                    loanInterest: 'These fields are required for financed method',
                    loanLength: 'These fields are required for financed method',
                    loanType: 'These fields are required for financed method',
                    points: 'These fields are required for financed method',
                }),
            );
        });

        it('should add financed errors when method is FINANCED and only downPayment is missing', () => {
            const dto: ADetailsDto = {
                hasItems: false,
                acquisitionCoast: 101500,
                method: AcquisitionMethodEnum.FINANCED,
                downPayment: undefined,
                loanInterest: 3.5,
                loanLength: 360,
                loanType: AcquisitionLoanTypeEnum.CONVENTIONAL,
                points: 1,
            } as ADetailsDto;

            service.validateAcquisitionDetails(dto);

            const errors = mockValidationFn.mock.calls[0][0];
            expect(errors).toHaveProperty('downPayment');
        });

        it('should add financed errors when method is FINANCED and only loanInterest is missing', () => {
            const dto: ADetailsDto = {
                hasItems: false,
                acquisitionCoast: 101500,
                method: AcquisitionMethodEnum.FINANCED,
                downPayment: 20000,
                loanInterest: undefined,
                loanLength: 360,
                loanType: AcquisitionLoanTypeEnum.CONVENTIONAL,
                points: 1,
            } as ADetailsDto;

            service.validateAcquisitionDetails(dto);

            const errors = mockValidationFn.mock.calls[0][0];
            expect(errors).toHaveProperty('loanInterest');
        });

        it('should add financed errors when method is FINANCED and only points is missing', () => {
            const dto: ADetailsDto = {
                hasItems: false,
                acquisitionCoast: 101500,
                method: AcquisitionMethodEnum.FINANCED,
                downPayment: 20000,
                loanInterest: 3.5,
                loanLength: 360,
                loanType: AcquisitionLoanTypeEnum.CONVENTIONAL,
                points: undefined,
            } as ADetailsDto;

            service.validateAcquisitionDetails(dto);

            const errors = mockValidationFn.mock.calls[0][0];
            expect(errors).toHaveProperty('points');
        });

        it('should NOT add financed errors when method is FINANCED and all loan fields are provided', () => {
            const dto: ADetailsDto = {
                hasItems: false,
                acquisitionCoast: 101500,
                method: AcquisitionMethodEnum.FINANCED,
                downPayment: 20000,
                loanInterest: 3.5,
                loanLength: 360,
                loanType: AcquisitionLoanTypeEnum.CONVENTIONAL,
                points: 1,
            } as ADetailsDto;

            service.validateAcquisitionDetails(dto);

            const errors = mockValidationFn.mock.calls[0][0];
            expect(errors).not.toHaveProperty('downPayment');
            expect(errors).not.toHaveProperty('loanInterest');
            expect(errors).not.toHaveProperty('loanLength');
            expect(errors).not.toHaveProperty('loanType');
            expect(errors).not.toHaveProperty('points');
        });

        it('should accumulate both item and financed errors simultaneously', () => {
            const dto: ADetailsDto = {
                hasItems: true,
                item: undefined,
                method: AcquisitionMethodEnum.FINANCED,
                downPayment: undefined,
                loanInterest: undefined,
                loanLength: undefined,
                loanType: undefined,
                points: undefined,
            } as ADetailsDto;

            service.validateAcquisitionDetails(dto);

            expect(mockValidationFn).toHaveBeenCalledWith(
                expect.objectContaining({
                    item: 'Itemized details are required for acquisition details',
                    downPayment: 'These fields are required for financed method',
                    loanInterest: 'These fields are required for financed method',
                    loanLength: 'These fields are required for financed method',
                    loanType: 'These fields are required for financed method',
                    points: 'These fields are required for financed method',
                }),
            );
        });
    });

    describe('buildADetailsEntity', () => {
        const required = {
            method: AcquisitionMethodEnum.CASH,
            purchasePrice: 100000,
            sellerConcessions: 500,
            credits: 1000,
            acquisitionCoast: 101500,
        };

        it('should return an ADetailsEntity with required fields assigned', () => {
            const result = service.buildADetailsEntity(required, {});

            expect(result).toBeInstanceOf(ADetailsEntity);
            expect(result.method).toBe(required.method);
            expect(result.purchasePrice).toBe(required.purchasePrice);
            expect(result.sellerConcessions).toBe(required.sellerConcessions);
            expect(result.credits).toBe(required.credits);
            expect(result.acquisitionCoast).toBe(required.acquisitionCoast);
        });

        it('should assign optional fields when provided', () => {
            const optional = {
                downPayment: 20000,
                loanInterest: 3.5,
                loanLength: 360,
                loanType: AcquisitionLoanTypeEnum.CONVENTIONAL,
                points: 1,
                analysisBuilder: new ABuilderEntity(),
            };

            const result = service.buildADetailsEntity(required, optional);

            expect(result.downPayment).toBe(optional.downPayment);
            expect(result.loanInterest).toBe(optional.loanInterest);
            expect(result.loanLength).toBe(optional.loanLength);
            expect(result.loanType).toBe(optional.loanType);
            expect(result.points).toBe(optional.points);
            expect(result.analysisBuilder).toBe(optional.analysisBuilder);
        });

        it('should leave optional fields undefined when not provided', () => {
            const result = service.buildADetailsEntity(required, {});

            expect(result.downPayment).toBeUndefined();
            expect(result.loanInterest).toBeUndefined();
            expect(result.loanLength).toBeUndefined();
            expect(result.loanType).toBeUndefined();
            expect(result.points).toBeUndefined();
            expect(result.analysisBuilder).toBeUndefined();
        });
    });

    describe('updateADetails', () => {
        let aDetails: ADetailsEntity;

        beforeEach(() => {
            aDetails = new ADetailsEntity();
            aDetails.id = 'entities-uuid-123';
        });

        it('should return early message when pUpdates is undefined', async () => {
            const result = await service.updateADetails(aDetails, undefined);

            expect(result).toEqual({
                message: 'No updates provided for acquisition details',
            });
            expect(mockUpdateFn).not.toHaveBeenCalled();
        });

        it('should return early message when pUpdates is an empty object', async () => {
            const result = await service.updateADetails(aDetails, {});

            expect(result).toEqual({
                message: 'No updates provided for acquisition details',
            });
            expect(mockUpdateFn).not.toHaveBeenCalled();
        });

        it('should call repository.update with only the defined fields', async () => {
            mockUpdateFn.mockResolvedValue({ affected: 1 });

            await service.updateADetails(aDetails, {
                purchasePrice: 200000,
                method: AcquisitionMethodEnum.FINANCED,
            });

            expect(mockUpdateFn).toHaveBeenCalledWith(
                { id: 'entities-uuid-123' },
                {
                    purchasePrice: 200000,
                    method: AcquisitionMethodEnum.FINANCED,
                },
            );
        });

        it('should exclude undefined fields from the update payload', async () => {
            mockUpdateFn.mockResolvedValue({ affected: 1 });

            await service.updateADetails(aDetails, {
                purchasePrice: 150000,
                downPayment: undefined,
            });

            const callPayload = mockUpdateFn.mock.calls[0][1];
            expect(callPayload).toHaveProperty('purchasePrice', 150000);
            expect(callPayload).not.toHaveProperty('downPayment');
        });

        it('should include all supported fields when all are provided', async () => {
            mockUpdateFn.mockResolvedValue({ affected: 1 });

            const updates = {
                method: AcquisitionMethodEnum.FINANCED,
                purchasePrice: 300000,
                sellerConcessions: 1000,
                credits: 500,
                acquisitionCoast: 301500,
                downPayment: 60000,
                loanInterest: 4.5,
                loanLength: 240,
                loanType: AcquisitionLoanTypeEnum.CONVENTIONAL,
                points: 2,
            };

            await service.updateADetails(aDetails, updates);

            expect(mockUpdateFn).toHaveBeenCalledWith({ id: 'entities-uuid-123' }, updates);
        });

        it('should return the repository.update result', async () => {
            const mockResult = { affected: 1, raw: [] };
            mockUpdateFn.mockResolvedValue(mockResult);

            const result = await service.updateADetails(aDetails, {
                purchasePrice: 200000,
            });

            expect(result).toBe(mockResult);
        });

        it('should call repository.update with points when provided', async () => {
            mockUpdateFn.mockResolvedValue({ affected: 1 });

            await service.updateADetails(aDetails, { points: 3 });

            expect(mockUpdateFn).toHaveBeenCalledWith({ id: 'entities-uuid-123' }, { points: 3 });
        });

        it('should exclude points from update payload when undefined', async () => {
            mockUpdateFn.mockResolvedValue({ affected: 1 });

            await service.updateADetails(aDetails, {
                purchasePrice: 150000,
                points: undefined,
            });

            const callPayload = mockUpdateFn.mock.calls[0][1];
            expect(callPayload).not.toHaveProperty('points');
        });
    });

    describe('calculateLoanPointsCost', () => {
        it('should return correct cost for 1 point on financed amount', () => {
            const dto = { purchasePrice: 200000, downPayment: 20000, points: 1 } as ADetailsDto;
            expect(service.calculateLoanPointsCost(dto)).toBe(1800);
        });

        it('should return correct cost for multiple points', () => {
            const dto = { purchasePrice: 200000, downPayment: 20000, points: 2 } as ADetailsDto;
            expect(service.calculateLoanPointsCost(dto)).toBe(3600);
        });

        it('should default downPayment to 0 when not provided', () => {
            const dto = { purchasePrice: 200000, points: 1 } as ADetailsDto;
            expect(service.calculateLoanPointsCost(dto)).toBe(2000);
        });

        it('should default points to 0 when not provided', () => {
            const dto = { purchasePrice: 200000, downPayment: 20000 } as ADetailsDto;
            expect(service.calculateLoanPointsCost(dto)).toBe(0);
        });

        it('should return 0 when both downPayment and points are not provided', () => {
            const dto = { purchasePrice: 200000 } as ADetailsDto;
            expect(service.calculateLoanPointsCost(dto)).toBe(0);
        });

        it('should return 0 when points is 0', () => {
            const dto = { purchasePrice: 200000, downPayment: 20000, points: 0 } as ADetailsDto;
            expect(service.calculateLoanPointsCost(dto)).toBe(0);
        });
    });
});
