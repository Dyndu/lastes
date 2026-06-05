import { Test, TestingModule } from '@nestjs/testing';
import { DtiPropertyService } from './dti-property.service';
import { DtiCalculatorService } from './dti-calculator.service';
import { DtiCalculatorEntity, DtiPropertyEntity } from '../entities';
import { PropertyDetailsTypeEnum } from '../../../common/enum';
import { CreateDtiPropertyDto, UpdateDtiPropertyDto } from '../dto';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const makeCalculator = (id = 'calc-1'): DtiCalculatorEntity =>
    Object.assign(new DtiCalculatorEntity(), { id });

const makePropertyEntity = (overrides: Partial<DtiPropertyEntity> = {}): DtiPropertyEntity =>
    Object.assign(new DtiPropertyEntity(), {
        id: 'property-1',
        streetAddress: '123 Main St',
        city: 'Toronto',
        state: 'Ontario',
        zipCode: '12345',
        propertyType: PropertyDetailsTypeEnum.SINGLE_FAMILY,
        principalInterest: 1200,
        taxesEscrow: 300,
        pMInsurance: 100,
        hoaFees: 50,
        monthlyRentalIncome: 2000,
        calculator: makeCalculator(),
        ...overrides,
    });

const makeCreateDto = (overrides: Partial<CreateDtiPropertyDto> = {}): CreateDtiPropertyDto =>
    ({
        streetAddress: '123 Main St',
        city: 'Toronto',
        state: 'Ontario',
        zipCode: '12345',
        propertyType: PropertyDetailsTypeEnum.SINGLE_FAMILY,
        principalInterest: 1200,
        taxesEscrow: 300,
        pMInsurance: 100,
        hoaFees: 50,
        monthlyRentalIncome: 2000,
        ...overrides,
    }) as CreateDtiPropertyDto;

const mockDtiPropertyRepo = {
    assertUniqueActive: jest.fn(),
    findActiveOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
};

const mockDtiOtherDebtsRepo = {
    update: jest.fn(),
};

const mockErrorHandler = {
    validation: jest.fn(),
    notFound: jest.fn(),
};

const mockLogger = { info: jest.fn() };
const mockOtherUtils = { formatCriteria: jest.fn().mockReturnValue('id=property-1') };

const mockDtiCalculatorService = {
    dtiPropertyRepo: mockDtiPropertyRepo,
    dtiOtherDebtsRepo: mockDtiOtherDebtsRepo,
    errorHandler: mockErrorHandler,
    logger: mockLogger,
    otherUtils: mockOtherUtils,
};

describe('DtiPropertyService', () => {
    let service: DtiPropertyService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DtiPropertyService,
                { provide: DtiCalculatorService, useValue: mockDtiCalculatorService },
            ],
        }).compile();

        service = module.get<DtiPropertyService>(DtiPropertyService);
    });

    describe('buildDtiProperty', () => {
        it('returns a DtiPropertyEntity with all required fields assigned', () => {
            const calculator = makeCalculator();
            const entity = service.buildDtiProperty({
                streetAddress: '123 Main St',
                city: 'Toronto',
                state: 'Ontario',
                zipCode: '12345',
                propertyType: PropertyDetailsTypeEnum.SINGLE_FAMILY,
                principalInterest: 1200,
                taxesEscrow: 300,
                pMInsurance: 100,
                hoaFees: 50,
                monthlyRentalIncome: 2000,
                calculator,
            });

            expect(entity).toBeInstanceOf(DtiPropertyEntity);
            expect(entity.streetAddress).toBe('123 Main St');
            expect(entity.city).toBe('Toronto');
            expect(entity.propertyType).toBe(PropertyDetailsTypeEnum.SINGLE_FAMILY);
            expect(entity.calculator).toBe(calculator);
        });
    });

    describe('ensureDtiPropertyLabelIsUnique', () => {
        it('calls assertUniqueActive without id when not provided', async () => {
            const calculator = makeCalculator();
            mockDtiPropertyRepo.assertUniqueActive.mockResolvedValue(undefined);

            await service.ensureDtiPropertyLabelIsUnique(calculator, '123 Main St');

            expect(mockDtiPropertyRepo.assertUniqueActive).toHaveBeenCalledWith(
                mockDtiPropertyRepo,
                {},
                { streetAddress: '123 Main St', calculator: { id: calculator.id } },
                'Address already exists',
                undefined,
            );
        });

        it('calls assertUniqueActive with id when provided', async () => {
            const calculator = makeCalculator();
            mockDtiPropertyRepo.assertUniqueActive.mockResolvedValue(undefined);

            await service.ensureDtiPropertyLabelIsUnique(calculator, '123 Main St', 'property-1');

            expect(mockDtiPropertyRepo.assertUniqueActive).toHaveBeenCalledWith(
                mockDtiPropertyRepo,
                {},
                { streetAddress: '123 Main St', calculator: { id: calculator.id } },
                'Address already exists',
                'property-1',
            );
        });

        it('does not call errorHandler.validation when no errors', async () => {
            const calculator = makeCalculator();
            mockDtiPropertyRepo.assertUniqueActive.mockResolvedValue(undefined);

            await service.ensureDtiPropertyLabelIsUnique(calculator, '123 Main St');
            expect(mockErrorHandler.validation).not.toHaveBeenCalled();
        });

        it('calls errorHandler.validation when errors.length > 0', async () => {
            const calculator = makeCalculator();
            mockDtiPropertyRepo.assertUniqueActive.mockImplementation(
                async (_repo: any, errors: any) => {
                    errors.length = 1;
                    errors[0] = 'Duplicate address';
                },
            );

            await service.ensureDtiPropertyLabelIsUnique(calculator, '123 Main St');
            expect(mockErrorHandler.validation).toHaveBeenCalled();
        });
    });

    describe('retrieveDtiPropertyByCriteria', () => {
        const criteria = { id: 'property-1' };

        it('returns the entity when found', async () => {
            const entity = makePropertyEntity();
            mockDtiPropertyRepo.findActiveOne.mockResolvedValue(entity);

            const result = await service.retrieveDtiPropertyByCriteria(criteria);
            expect(mockLogger.info).toHaveBeenCalled();
            expect(result).toBe(entity);
        });

        it('passes relations to the repo when provided', async () => {
            const entity = makePropertyEntity();
            mockDtiPropertyRepo.findActiveOne.mockResolvedValue(entity);

            await service.retrieveDtiPropertyByCriteria(criteria, ['calculator']);

            expect(mockDtiPropertyRepo.findActiveOne).toHaveBeenCalledWith(
                mockDtiPropertyRepo,
                criteria,
                ['calculator'],
            );
        });

        it('calls errorHandler.notFound when entity is missing', async () => {
            mockDtiPropertyRepo.findActiveOne.mockResolvedValue(null);
            await service.retrieveDtiPropertyByCriteria(criteria);
            expect(mockErrorHandler.notFound).toHaveBeenCalled();
        });
    });

    describe('createDtiProperty', () => {
        it('ensures uniqueness, builds and persists the entity', async () => {
            const calculator = makeCalculator();
            const dto = makeCreateDto();
            const saved = makePropertyEntity();

            mockDtiPropertyRepo.assertUniqueActive.mockResolvedValue(undefined);
            mockDtiPropertyRepo.create.mockResolvedValue(saved);

            const result = await service.createDtiProperty(calculator, dto);

            expect(mockDtiPropertyRepo.assertUniqueActive).toHaveBeenCalled();
            expect(mockDtiPropertyRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({ streetAddress: '123 Main St' }),
            );
            expect(result).toBe(saved);
        });
    });

    describe('updateDtiPropertyEntity', () => {
        it('returns early message when itemized is undefined', async () => {
            const entity = makePropertyEntity();
            const result = await service.updateDtiPropertyEntity(entity, undefined);
            expect(result).toEqual({ message: 'No updates provided for dti property details' });
            expect(mockDtiPropertyRepo.update).not.toHaveBeenCalled();
        });

        it('returns early message when itemized is an empty object', async () => {
            const entity = makePropertyEntity();
            const result = await service.updateDtiPropertyEntity(entity, {});
            expect(result).toEqual({ message: 'No updates provided for dti property details' });
        });

        it('trims and updates string fields when provided', async () => {
            const entity = makePropertyEntity();
            mockDtiPropertyRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateDtiPropertyEntity(entity, {
                streetAddress: '  456 Elm St  ',
                city: '  Montreal  ',
                state: '  Quebec  ',
                zipCode: '  98765  ',
            });

            const payload = mockDtiPropertyRepo.update.mock.calls[0][1];
            expect(payload.streetAddress).toBe('456 Elm St');
            expect(payload.city).toBe('Montreal');
            expect(payload.state).toBe('Quebec');
            expect(payload.zipCode).toBe('98765');
        });

        it('skips string fields that are blank after trim', async () => {
            const entity = makePropertyEntity();
            mockDtiPropertyRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateDtiPropertyEntity(entity, {
                streetAddress: '   ',
                principalInterest: 1500,
            });

            const payload = mockDtiPropertyRepo.update.mock.calls[0][1];
            expect(payload).not.toHaveProperty('streetAddress');
            expect(payload.principalInterest).toBe(1500);
        });

        it('updates numeric and enum fields when provided', async () => {
            const entity = makePropertyEntity();
            mockDtiPropertyRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateDtiPropertyEntity(entity, {
                propertyType: PropertyDetailsTypeEnum.MULTI_FAMILY,
                principalInterest: 1500,
                taxesEscrow: 400,
                pMInsurance: 150,
                hoaFees: 75,
                monthlyRentalIncome: 2500,
            });

            const payload = mockDtiPropertyRepo.update.mock.calls[0][1];
            expect(payload.propertyType).toBe(PropertyDetailsTypeEnum.MULTI_FAMILY);
            expect(payload.principalInterest).toBe(1500);
            expect(payload.taxesEscrow).toBe(400);
            expect(payload.pMInsurance).toBe(150);
            expect(payload.hoaFees).toBe(75);
            expect(payload.monthlyRentalIncome).toBe(2500);
        });

        it('omits undefined fields from the payload', async () => {
            const entity = makePropertyEntity();
            mockDtiPropertyRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateDtiPropertyEntity(entity, { principalInterest: 999 });

            const payload = mockDtiPropertyRepo.update.mock.calls[0][1];
            expect(payload).not.toHaveProperty('propertyType');
            expect(payload).not.toHaveProperty('taxesEscrow');
            expect(payload.principalInterest).toBe(999);
        });

        it('calls dtiOtherDebtsRepo.update with the property id', async () => {
            const entity = makePropertyEntity({ id: 'property-42' });
            mockDtiPropertyRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateDtiPropertyEntity(entity, { principalInterest: 800 });

            expect(mockDtiPropertyRepo.update).toHaveBeenCalledWith(
                { id: 'property-42' },
                expect.any(Object),
            );
        });
    });

    describe('updateDtiProperty', () => {
        it('retrieves entity with calculator relation, skips uniqueness check when no streetAddress, then updates', async () => {
            const entity = makePropertyEntity();
            mockDtiPropertyRepo.findActiveOne.mockResolvedValue(entity);
            mockDtiOtherDebtsRepo.update.mockResolvedValue({ affected: 1 });

            const dto: UpdateDtiPropertyDto = { city: 'Vancouver' } as UpdateDtiPropertyDto;
            await service.updateDtiProperty('property-1', dto);

            expect(mockDtiPropertyRepo.findActiveOne).toHaveBeenCalledWith(
                mockDtiPropertyRepo,
                { id: 'property-1' },
                ['calculator'],
            );
            expect(mockDtiPropertyRepo.assertUniqueActive).not.toHaveBeenCalled();
            expect(mockDtiPropertyRepo.update).toHaveBeenCalled();
        });

        it('checks address uniqueness when dto.streetAddress is provided', async () => {
            const entity = makePropertyEntity();
            mockDtiPropertyRepo.findActiveOne.mockResolvedValue(entity);
            mockDtiPropertyRepo.assertUniqueActive.mockResolvedValue(undefined);
            mockDtiOtherDebtsRepo.update.mockResolvedValue({ affected: 1 });

            const dto: UpdateDtiPropertyDto = {
                streetAddress: '789 Oak Ave',
            } as UpdateDtiPropertyDto;
            await service.updateDtiProperty('property-1', dto);

            expect(mockDtiPropertyRepo.assertUniqueActive).toHaveBeenCalledWith(
                mockDtiPropertyRepo,
                {},
                {
                    streetAddress: '789 Oak Ave',
                    calculator: { id: entity.calculator.id },
                },
                'Address already exists',
                entity.id,
            );
        });
    });

    describe('deleteDtiProperty', () => {
        it('retrieves the entity then deletes it by id', async () => {
            const entity = makePropertyEntity();
            mockDtiPropertyRepo.findActiveOne.mockResolvedValue(entity);
            mockDtiPropertyRepo.delete.mockResolvedValue({ affected: 1 });

            await service.deleteDtiProperty('property-1');

            expect(mockDtiPropertyRepo.delete).toHaveBeenCalledWith({ id: entity.id });
        });
    });
});
