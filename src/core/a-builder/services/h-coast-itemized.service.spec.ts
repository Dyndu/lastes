import { Test, TestingModule } from '@nestjs/testing';
import { HCoastItemizedService } from './h-coast-itemized.service';
import { ABuilderService } from './a-builder.service';
import { HCoastItemizedEntity, HCoastEntity } from '../entities';
import { HCoastItemizedDto } from '../dto';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const makeItemizedDto = (overrides: Partial<HCoastItemizedDto> = {}): HCoastItemizedDto =>
    ({
        electricity: 100,
        water: 80,
        gas: 60,
        trash: 20,
        propertyTaxes: 500,
        other: 30,
        ...overrides,
    }) as HCoastItemizedDto;

const makeHCoast = (overrides = {}): HCoastEntity => ({ id: 'hc-1', ...overrides }) as HCoastEntity;

const makeItemizedEntity = (overrides = {}): HCoastItemizedEntity =>
    ({ id: 'hci-1', ...overrides }) as HCoastItemizedEntity;

const buildABuilderServiceMock = () => ({
    otherUtils: {
        formatCriteria: jest.fn().mockReturnValue('formatted'),
    },
    logger: { info: jest.fn() },
    errorHandler: {
        notFound: jest.fn().mockImplementation((msg: string) => {
            throw new Error(msg);
        }),
    },
    hCoastItemizedRepo: {
        findActiveOne: jest.fn(),
        create: jest.fn(),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
    },
    adItemizedRepo: {
        update: jest.fn().mockResolvedValue({ affected: 1 }),
    },
});

describe('HCoastItemizedService', () => {
    let service: HCoastItemizedService;
    let aBuilderService: ReturnType<typeof buildABuilderServiceMock>;

    beforeEach(async () => {
        aBuilderService = buildABuilderServiceMock();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HCoastItemizedService,
                { provide: ABuilderService, useValue: aBuilderService },
            ],
        }).compile();

        service = module.get<HCoastItemizedService>(HCoastItemizedService);
    });

    afterEach(() => jest.clearAllMocks());

    describe('calculateItemizedHoldingCost', () => {
        it('should sum all numeric values correctly', () => {
            const dto = makeItemizedDto();
            expect(service.calculateItemizedHoldingCost(dto)).toBe(790);
        });

        it('should skip NaN values and sum the rest', () => {
            const dto = makeItemizedDto({ propertyTaxes: NaN });
            expect(service.calculateItemizedHoldingCost(dto)).toBe(290);
        });

        it('should return 0 when all values are NaN', () => {
            const dto = makeItemizedDto({
                electricity: NaN,
                water: NaN,
                gas: NaN,
                trash: NaN,
                propertyTaxes: NaN,
                other: NaN,
            });
            expect(service.calculateItemizedHoldingCost(dto)).toBe(0);
        });

        it('should handle zero values correctly', () => {
            const dto = makeItemizedDto({
                electricity: 0,
                water: 0,
                gas: 0,
                trash: 0,
                propertyTaxes: 0,
                other: 0,
            });
            expect(service.calculateItemizedHoldingCost(dto)).toBe(0);
        });
    });

    describe('buildHCItemizedEntity', () => {
        it('should return an HCoastItemizedEntity with required fields assigned', () => {
            const required = {
                electricity: 100,
                water: 80,
                gas: 60,
                propertyTaxes: 500,
                trash: 20,
                other: 30,
            };

            const result = service.buildHCItemizedEntity(required, {});

            expect(result).toBeInstanceOf(HCoastItemizedEntity);
            expect(result.electricity).toBe(100);
            expect(result.water).toBe(80);
            expect(result.gas).toBe(60);
            expect(result.propertyTaxes).toBe(500);
            expect(result.trash).toBe(20);
            expect(result.other).toBe(30);
        });

        it('should assign hCoast when provided in optional', () => {
            const hCoast = makeHCoast();
            const result = service.buildHCItemizedEntity(
                { electricity: 0, water: 0, gas: 0, propertyTaxes: 0, trash: 0, other: 0 },
                { hCoast },
            );

            expect(result.hCoast).toBe(hCoast);
        });

        it('should leave hCoast undefined when not provided', () => {
            const result = service.buildHCItemizedEntity(
                { electricity: 0, water: 0, gas: 0, propertyTaxes: 0, trash: 0, other: 0 },
                {},
            );

            expect(result.hCoast).toBeUndefined();
        });
    });

    describe('retrieveHCItemizedByCriteria', () => {
        it('should return the entity when found', async () => {
            const entity = makeItemizedEntity();
            aBuilderService.hCoastItemizedRepo.findActiveOne.mockResolvedValue(entity);

            const result = await service.retrieveHCItemizedByCriteria({ id: 'hci-1' }, ['hCoast']);

            expect(aBuilderService.otherUtils.formatCriteria).toHaveBeenCalledWith({ id: 'hci-1' });
            expect(aBuilderService.logger.info).toHaveBeenCalled();
            expect(aBuilderService.hCoastItemizedRepo.findActiveOne).toHaveBeenCalledWith(
                aBuilderService.hCoastItemizedRepo,
                { id: 'hci-1' },
                ['hCoast'],
            );
            expect(result).toBe(entity);
        });

        it('should work without optional relations parameter', async () => {
            const entity = makeItemizedEntity();
            aBuilderService.hCoastItemizedRepo.findActiveOne.mockResolvedValue(entity);

            const result = await service.retrieveHCItemizedByCriteria({ id: 'hci-1' });
            expect(result).toBe(entity);
        });

        it('should throw notFound when entity does not exist', async () => {
            aBuilderService.hCoastItemizedRepo.findActiveOne.mockResolvedValue(null);

            await expect(service.retrieveHCItemizedByCriteria({ id: 'missing' })).rejects.toThrow();

            expect(aBuilderService.errorHandler.notFound).toHaveBeenCalled();
        });
    });

    describe('createHCItemizedEntity', () => {
        it('should build entity and call repo.create', async () => {
            const entity = makeItemizedEntity();
            const dto = makeItemizedDto();
            aBuilderService.hCoastItemizedRepo.create.mockResolvedValue(entity);

            const result = await service.createHCItemizedEntity(dto);

            expect(aBuilderService.hCoastItemizedRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    electricity: dto.electricity,
                    water: dto.water,
                    gas: dto.gas,
                    trash: dto.trash,
                    propertyTaxes: dto.propertyTaxes,
                    other: dto.other,
                }),
            );
            expect(result).toBe(entity);
        });

        it('should pass hCoast when provided', async () => {
            const entity = makeItemizedEntity();
            const hCoast = makeHCoast();
            aBuilderService.hCoastItemizedRepo.create.mockResolvedValue(entity);

            await service.createHCItemizedEntity(makeItemizedDto(), hCoast);

            expect(aBuilderService.hCoastItemizedRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({ hCoast }),
            );
        });

        it('should work without hCoast (undefined)', async () => {
            const entity = makeItemizedEntity();
            aBuilderService.hCoastItemizedRepo.create.mockResolvedValue(entity);

            await service.createHCItemizedEntity(makeItemizedDto(), undefined);

            expect(aBuilderService.hCoastItemizedRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({ hCoast: undefined }),
            );
        });
    });

    describe('updateHCItemized', () => {
        it('should return early message when itemized is undefined', async () => {
            const result = await service.updateHCItemized(makeItemizedEntity(), undefined);
            expect(result).toEqual({
                message: 'No updates provided for holding coast itemized details',
            });
            expect(aBuilderService.adItemizedRepo.update).not.toHaveBeenCalled();
        });

        it('should return early message when itemized is an empty object', async () => {
            const result = await service.updateHCItemized(makeItemizedEntity(), {});
            expect(result).toEqual({
                message: 'No updates provided for holding coast itemized details',
            });
            expect(aBuilderService.adItemizedRepo.update).not.toHaveBeenCalled();
        });

        it('should call repo.update with the provided fields', async () => {
            const entity = makeItemizedEntity();
            await service.updateHCItemized(entity, { electricity: 200, water: 150 });

            expect(aBuilderService.adItemizedRepo.update).toHaveBeenCalledWith(
                { id: entity.id },
                expect.objectContaining({ electricity: 200, water: 150 }),
            );
        });

        it('should update all fields when all are provided', async () => {
            const entity = makeItemizedEntity();
            const updates = {
                electricity: 1,
                water: 2,
                gas: 3,
                propertyTaxes: 4,
                trash: 5,
                other: 6,
            };

            await service.updateHCItemized(entity, updates);

            expect(aBuilderService.adItemizedRepo.update).toHaveBeenCalledWith(
                { id: entity.id },
                expect.objectContaining(updates),
            );
        });

        it('should skip fields that are undefined', async () => {
            const entity = makeItemizedEntity();
            await service.updateHCItemized(entity, { electricity: 999, water: undefined });

            const payload = aBuilderService.adItemizedRepo.update.mock.calls[0][1];
            expect(payload.electricity).toBe(999);
            expect(payload.water).toBeUndefined();
        });
    });

    describe('updateHCItemizedInfo', () => {
        it('should retrieve entity, update it, and return success message', async () => {
            const entity = makeItemizedEntity();
            const hCoast = makeHCoast();
            const dto = makeItemizedDto();
            aBuilderService.hCoastItemizedRepo.findActiveOne.mockResolvedValue(entity);

            const result = await service.updateHCItemizedInfo('hci-1', hCoast, dto);

            expect(aBuilderService.hCoastItemizedRepo.findActiveOne).toHaveBeenCalledWith(
                aBuilderService.hCoastItemizedRepo,
                { id: 'hci-1', hCoast: { id: hCoast.id } },
                undefined,
            );
            expect(aBuilderService.adItemizedRepo.update).toHaveBeenCalledWith(
                { id: entity.id },
                expect.objectContaining({
                    electricity: dto.electricity,
                    water: dto.water,
                    gas: dto.gas,
                    propertyTaxes: dto.propertyTaxes,
                    trash: dto.trash,
                    other: dto.other,
                }),
            );
            expect(result).toEqual({ message: 'Holding coast items updated successfully' });
        });
    });

    describe('deleteHCItemized', () => {
        it('should call repo.delete with the entity id', async () => {
            const entity = makeItemizedEntity();
            await service.deleteHCItemized(entity);

            expect(aBuilderService.hCoastItemizedRepo.delete).toHaveBeenCalledWith({
                id: entity.id,
            });
        });

        it('should call repo.delete with undefined id when no entity is passed', async () => {
            await service.deleteHCItemized(undefined);

            expect(aBuilderService.hCoastItemizedRepo.delete).toHaveBeenCalledWith({
                id: undefined,
            });
        });
    });
});
