import { Test, TestingModule } from '@nestjs/testing';
import { HCoastService } from './h-coast.service';
import { ABuilderService } from './a-builder.service';
import { HCoastEntity, ABuilderEntity } from '../entities';
import { HCoastDto } from '../dto';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const makeHCoastDto = (overrides: Partial<HCoastDto> = {}): HCoastDto =>
    ({
        duration: 12,
        pIValue: 1500,
        hasItems: false,
        holdingCoast: 200,
        item: undefined,
        ...overrides,
    }) as HCoastDto;

const makeHCoastEntity = (overrides = {}): HCoastEntity =>
    ({ id: 'hc-1', holdingCoast: 100, duration: 6, pIValue: 800, ...overrides }) as HCoastEntity;

const makeABuilder = (overrides = {}): ABuilderEntity =>
    ({ id: 'ab-1', ...overrides }) as ABuilderEntity;

const buildABuilderServiceMock = () => ({
    errorHandler: {
        validation: jest.fn(),
    },
    hCoastRepository: {
        update: jest.fn().mockResolvedValue({ affected: 1 }),
        create: jest.fn().mockResolvedValue(makeHCoastEntity()),
    },
    hCoastItemizedRepo: {
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
    },
    hCoastItemizedService: {
        calculateItemizedHoldingCost: jest.fn().mockReturnValue(790),
        createHCItemizedEntity: jest.fn().mockResolvedValue({}),
    },
});

describe('HCoastService', () => {
    let service: HCoastService;
    let aBuilderService: ReturnType<typeof buildABuilderServiceMock>;

    beforeEach(async () => {
        aBuilderService = buildABuilderServiceMock();

        const module: TestingModule = await Test.createTestingModule({
            providers: [HCoastService, { provide: ABuilderService, useValue: aBuilderService }],
        }).compile();

        service = module.get<HCoastService>(HCoastService);
    });

    afterEach(() => jest.clearAllMocks());

    describe('validateHoldingCoastDetails', () => {
        it('should call validation with no errors for valid dto (hasItems=false, holdingCoast provided)', () => {
            service.validateHoldingCoastDetails(
                makeHCoastDto({ hasItems: false, holdingCoast: 200 }),
            );

            expect(aBuilderService.errorHandler.validation).toHaveBeenCalledWith({});
        });

        it('should call validation with no errors for valid dto (hasItems=true, item provided, no holdingCoast)', () => {
            service.validateHoldingCoastDetails(
                makeHCoastDto({ hasItems: true, item: {} as any, holdingCoast: undefined }),
            );

            expect(aBuilderService.errorHandler.validation).toHaveBeenCalledWith({});
        });

        it('should add error when hasItems=true but item is missing', () => {
            service.validateHoldingCoastDetails(
                makeHCoastDto({ hasItems: true, item: undefined, holdingCoast: undefined }),
            );

            expect(aBuilderService.errorHandler.validation).toHaveBeenCalledWith(
                expect.objectContaining({
                    item: 'Itemized details are required for holding coast',
                }),
            );
        });

        it('should add error when hasItems=false and holdingCoast is null', () => {
            service.validateHoldingCoastDetails(
                makeHCoastDto({ hasItems: false, holdingCoast: null as any }),
            );

            expect(aBuilderService.errorHandler.validation).toHaveBeenCalledWith(
                expect.objectContaining({
                    holdingCoast: 'Holding cost is required when items are not provided',
                }),
            );
        });

        it('should add error when hasItems=false and holdingCoast is undefined', () => {
            service.validateHoldingCoastDetails(
                makeHCoastDto({ hasItems: false, holdingCoast: undefined }),
            );

            expect(aBuilderService.errorHandler.validation).toHaveBeenCalledWith(
                expect.objectContaining({
                    holdingCoast: 'Holding cost is required when items are not provided',
                }),
            );
        });

        it('should add error when hasItems=true and holdingCoast is also provided', () => {
            service.validateHoldingCoastDetails(
                makeHCoastDto({ hasItems: true, item: {} as any, holdingCoast: 200 }),
            );

            expect(aBuilderService.errorHandler.validation).toHaveBeenCalledWith(
                expect.objectContaining({
                    holdingCoast:
                        'Holding cost must not be provided when items are used — it is calculated automatically',
                }),
            );
        });

        it('should accumulate multiple errors at once (hasItems=true, no item, holdingCoast provided)', () => {
            service.validateHoldingCoastDetails(
                makeHCoastDto({ hasItems: true, item: undefined, holdingCoast: 200 }),
            );

            expect(aBuilderService.errorHandler.validation).toHaveBeenCalledWith(
                expect.objectContaining({
                    item: 'Itemized details are required for holding coast',
                    holdingCoast:
                        'Holding cost must not be provided when items are used — it is calculated automatically',
                }),
            );
        });
    });

    describe('buildHCoastEntity', () => {
        it('should return an HCoastEntity with required fields assigned', () => {
            const required = { holdingCoast: 300, duration: 6, durationInMonth: 2, pIValue: 1000 };
            const result = service.buildHCoastEntity(required, {});

            expect(result).toBeInstanceOf(HCoastEntity);
            expect(result.holdingCoast).toBe(300);
            expect(result.duration).toBe(6);
            expect(result.durationInMonth).toBe(2);
            expect(result.pIValue).toBe(1000);
        });

        it('should assign analysisBuilder when provided in optional', () => {
            const aBuilder = makeABuilder();
            const result = service.buildHCoastEntity(
                { holdingCoast: 0, duration: 0, durationInMonth: 0, pIValue: 0 },
                { analysisBuilder: aBuilder },
            );

            expect(result.analysisBuilder).toBe(aBuilder);
        });

        it('should leave analysisBuilder undefined when not provided', () => {
            const result = service.buildHCoastEntity(
                { holdingCoast: 0, duration: 0, durationInMonth: 0, pIValue: 0 },
                {},
            );

            expect(result.analysisBuilder).toBeUndefined();
        });
    });

    describe('convertWeeksToMonths', () => {
        it('should convert weeks to months rounding up', () => {
            expect(service.convertWeeksToMonths(4)).toBe(1);
            expect(service.convertWeeksToMonths(11)).toBe(3);
            expect(service.convertWeeksToMonths(52)).toBe(13);
        });

        it('should always round up (ceil)', () => {
            expect(service.convertWeeksToMonths(5)).toBe(Math.ceil(5 / 4.33));
            expect(service.convertWeeksToMonths(1)).toBe(1);
        });
    });

    describe('resolveHoldingCoastValue', () => {
        it('should return dto.holdingCoast when item is absent', () => {
            const dto = makeHCoastDto({ hasItems: false, holdingCoast: 250, item: undefined });
            const result = service.resolveHoldingCoastValue(dto);

            expect(aBuilderService.errorHandler.validation).toHaveBeenCalled();
            expect(
                aBuilderService.hCoastItemizedService.calculateItemizedHoldingCost,
            ).not.toHaveBeenCalled();
            expect(result).toBe(250);
        });

        it('should return calculated value from calculateItemizedHoldingCost when item is present', () => {
            const item = { electricity: 100 } as any;
            const dto = makeHCoastDto({ hasItems: true, item, holdingCoast: undefined });
            aBuilderService.hCoastItemizedService.calculateItemizedHoldingCost.mockReturnValue(555);

            const result = service.resolveHoldingCoastValue(dto);

            expect(
                aBuilderService.hCoastItemizedService.calculateItemizedHoldingCost,
            ).toHaveBeenCalledWith(item);
            expect(result).toBe(555);
        });
    });

    describe('handleItemizedCreation', () => {
        it('should call createHCItemizedEntity when dto.item is present', async () => {
            const item = { electricity: 100 } as any;
            const dto = makeHCoastDto({ item });
            const hCoast = makeHCoastEntity();

            await service.handleItemizedCreation(dto, hCoast);

            expect(
                aBuilderService.hCoastItemizedService.createHCItemizedEntity,
            ).toHaveBeenCalledWith(item, hCoast);
        });

        it('should NOT call createHCItemizedEntity when dto.item is absent', async () => {
            const dto = makeHCoastDto({ item: undefined });
            const hCoast = makeHCoastEntity();

            await service.handleItemizedCreation(dto, hCoast);

            expect(
                aBuilderService.hCoastItemizedService.createHCItemizedEntity,
            ).not.toHaveBeenCalled();
        });
    });

    describe('createHCoast', () => {
        it('should use holdingCoast from dto when dto.item is absent', async () => {
            const aBuilder = makeABuilder();
            const dto = makeHCoastDto({ hasItems: false, holdingCoast: 350, item: undefined });
            const created = makeHCoastEntity({ holdingCoast: 350 });
            aBuilderService.hCoastRepository.create.mockResolvedValue(created);

            const result = await service.createHCoast(aBuilder, dto);

            expect(aBuilderService.hCoastRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    holdingCoast: 350,
                    duration: dto.duration,
                    durationInMonth: service.convertWeeksToMonths(dto.duration),
                    pIValue: dto.pIValue,
                    analysisBuilder: aBuilder,
                }),
            );
            expect(
                aBuilderService.hCoastItemizedService.calculateItemizedHoldingCost,
            ).not.toHaveBeenCalled();
            expect(
                aBuilderService.hCoastItemizedService.createHCItemizedEntity,
            ).not.toHaveBeenCalled();
            expect(result).toBe(created);
        });

        it('should calculate holdingCoast from items and create itemized entity when dto.item is present', async () => {
            const aBuilder = makeABuilder();
            const item = {
                electricity: 100,
                water: 80,
                gas: 60,
                trash: 20,
                propertyTaxes: 500,
                other: 30,
            } as any;
            const dto = makeHCoastDto({ hasItems: true, holdingCoast: undefined, item });
            const created = makeHCoastEntity({ holdingCoast: 790 });
            aBuilderService.hCoastRepository.create.mockResolvedValue(created);
            aBuilderService.hCoastItemizedService.calculateItemizedHoldingCost.mockReturnValue(790);

            const result = await service.createHCoast(aBuilder, dto);

            expect(
                aBuilderService.hCoastItemizedService.calculateItemizedHoldingCost,
            ).toHaveBeenCalledWith(item);
            expect(aBuilderService.hCoastRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    holdingCoast: 790,
                    duration: dto.duration,
                    durationInMonth: service.convertWeeksToMonths(dto.duration),
                    pIValue: dto.pIValue,
                    analysisBuilder: aBuilder,
                }),
            );
            expect(
                aBuilderService.hCoastItemizedService.createHCItemizedEntity,
            ).toHaveBeenCalledWith(item, created);
            expect(result).toBe(created);
        });

        it('should call validateHoldingCoastDetails before creating', async () => {
            const validateSpy = jest.spyOn(service, 'validateHoldingCoastDetails');
            const dto = makeHCoastDto();
            aBuilderService.hCoastRepository.create.mockResolvedValue(makeHCoastEntity());

            await service.createHCoast(makeABuilder(), dto);

            expect(validateSpy).toHaveBeenCalledWith(dto);
        });
    });

    describe('updateHCoast', () => {
        it('should return early message when itemized is undefined', async () => {
            const result = await service.updateHCoast(makeHCoastEntity(), undefined);

            expect(result).toEqual({ message: 'No updates provided for holding coast' });
            expect(aBuilderService.hCoastRepository.update).not.toHaveBeenCalled();
        });

        it('should return early message when itemized is an empty object', async () => {
            const result = await service.updateHCoast(makeHCoastEntity(), {});

            expect(result).toEqual({ message: 'No updates provided for holding coast' });
            expect(aBuilderService.hCoastRepository.update).not.toHaveBeenCalled();
        });

        it('should call repo.update with provided fields', async () => {
            const entity = makeHCoastEntity();
            await service.updateHCoast(entity, {
                holdingCoast: 500,
                duration: 3,
                durationInMonth: 1,
            });

            expect(aBuilderService.hCoastRepository.update).toHaveBeenCalledWith(
                { id: entity.id },
                expect.objectContaining({ holdingCoast: 500, duration: 3, durationInMonth: 1 }),
            );
        });

        it('should update all fields when all are provided', async () => {
            const entity = makeHCoastEntity();
            const updates = { holdingCoast: 100, duration: 6, durationInMonth: 2, pIValue: 2000 };

            await service.updateHCoast(entity, updates);

            expect(aBuilderService.hCoastRepository.update).toHaveBeenCalledWith(
                { id: entity.id },
                expect.objectContaining(updates),
            );
        });

        it('should skip fields that are undefined', async () => {
            const entity = makeHCoastEntity();
            await service.updateHCoast(entity, { holdingCoast: 400, duration: undefined });

            const payload = aBuilderService.hCoastRepository.update.mock.calls[0][1];
            expect(payload.holdingCoast).toBe(400);
            expect(payload.duration).toBeUndefined();
        });

        it('should return the result of repo.update', async () => {
            aBuilderService.hCoastRepository.update.mockResolvedValue({ affected: 1 });
            const result = await service.updateHCoast(makeHCoastEntity(), { pIValue: 999 });

            expect(result).toEqual({ affected: 1 });
        });
    });

    describe('handleHCoastUpdate', () => {
        it('should delete existing itemized data before updating when hCoast.itemized exists', async () => {
            const hCoast = makeHCoastEntity({ itemized: { id: 'hci-1' } });
            const dto = makeHCoastDto({ hasItems: false, holdingCoast: 300 });

            await service.handleHCoastUpdate(hCoast, dto);

            expect(aBuilderService.hCoastItemizedRepo.delete).toHaveBeenCalledWith({
                hCoast: { id: hCoast.id },
            });
        });

        it('should NOT delete itemized data when hCoast.itemized is absent', async () => {
            const hCoast = makeHCoastEntity({ itemized: undefined });
            const dto = makeHCoastDto({ hasItems: false, holdingCoast: 300 });

            await service.handleHCoastUpdate(hCoast, dto);

            expect(aBuilderService.hCoastItemizedRepo.delete).not.toHaveBeenCalled();
        });

        it('should call updateHCoast with duration, durationInMonth, and resolved holdingCoast', async () => {
            const updateSpy = jest.spyOn(service, 'updateHCoast');
            const hCoast = makeHCoastEntity({ itemized: undefined });
            const dto = makeHCoastDto({
                hasItems: false,
                holdingCoast: 400,
                duration: 8,
                pIValue: 1200,
            });

            await service.handleHCoastUpdate(hCoast, dto);

            expect(updateSpy).toHaveBeenCalledWith(hCoast, {
                holdingCoast: 400,
                duration: dto.duration,
                durationInMonth: service.convertWeeksToMonths(dto.duration),
                pIValue: dto.pIValue,
            });
        });

        it('should call handleItemizedCreation after update', async () => {
            const itemizedSpy = jest.spyOn(service, 'handleItemizedCreation');
            const hCoast = makeHCoastEntity({ itemized: undefined });
            const dto = makeHCoastDto({ hasItems: false, holdingCoast: 300 });

            await service.handleHCoastUpdate(hCoast, dto);

            expect(itemizedSpy).toHaveBeenCalledWith(dto, hCoast);
        });

        it('should return the hCoast entity after update', async () => {
            const hCoast = makeHCoastEntity({ itemized: undefined });
            const dto = makeHCoastDto({ hasItems: false, holdingCoast: 300 });

            const result = await service.handleHCoastUpdate(hCoast, dto);

            expect(result).toBe(hCoast);
        });
    });
});
