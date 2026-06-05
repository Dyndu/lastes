import { Test, TestingModule } from '@nestjs/testing';
import { HDurationService } from './h-duration.service';
import { ABuilderService } from './a-builder.service';
import { ABuilderEntity, HDurationEntity, IRepairsEntity } from '../entities';
import { HDurationDto } from '../dto';
import { RItemDto } from '../dto';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const makeABuilder = (id = 'builder-1'): ABuilderEntity => ({ id }) as ABuilderEntity;

const makeIRepairsEntity = (): IRepairsEntity => ({ id: 'irepairs-1' }) as IRepairsEntity;

const makeRItemDto = (): RItemDto => ({
    roof: 1_000,
    landscaping: 500,
    concierge: 300,
    garage: 200,
    bathrooms: 400,
});

const makeHDurationEntity = (overrides: Partial<HDurationEntity> = {}): HDurationEntity =>
    ({
        id: 'hduration-1',
        holdingCoast: 3_000,
        duration: 6,
        transactionFee: 500,
        otherFee: 200,
        targetProfit: 50_000,
        itemized: undefined,
        ...overrides,
    }) as HDurationEntity;

const makeDto = (overrides: Partial<HDurationDto> = {}): HDurationDto => ({
    duration: 6,
    transactionFee: 500,
    otherFee: 200,
    targetProfit: 50_000,
    hasItems: false,
    holdingCoast: 3_000,
    item: undefined,
    ...overrides,
});

const buildMock = () => ({
    errorHandler: {
        validation: jest.fn(),
    },
    hDurationRepository: {
        create: jest.fn(),
        update: jest.fn(),
    },
    iRepairsRepository: {
        delete: jest.fn(),
    },
    iRepairsService: {
        calculateItemizedIRepairsCoast: jest.fn(),
        createIRepair: jest.fn(),
    },
});

describe('HDurationService', () => {
    let service: HDurationService;
    let aBuilderService: ReturnType<typeof buildMock>;

    beforeEach(async () => {
        aBuilderService = buildMock();

        const module: TestingModule = await Test.createTestingModule({
            providers: [HDurationService, { provide: ABuilderService, useValue: aBuilderService }],
        }).compile();

        service = module.get<HDurationService>(HDurationService);
    });

    afterEach(() => jest.clearAllMocks());

    describe('validateHoldingDurationDetails', () => {
        beforeEach(() => {
            aBuilderService.errorHandler.validation.mockImplementation(
                (errors: Record<string, string>) => {
                    throw new Error(JSON.stringify(errors));
                },
            );
        });

        it('adds item error when hasItems=true and item is undefined', () => {
            const dto = makeDto({ hasItems: true, item: undefined, holdingCoast: undefined });

            expect(() => service.validateHoldingDurationDetails(dto)).toThrow();

            const errors: Record<string, string> =
                aBuilderService.errorHandler.validation.mock.calls[0][0];
            expect(errors['item']).toBe('Itemized details are required for holding duration');
        });

        it('adds holdingCoast error when hasItems=false and holdingCoast is undefined', () => {
            const dto = makeDto({ hasItems: false, holdingCoast: undefined });

            expect(() => service.validateHoldingDurationDetails(dto)).toThrow();

            const errors: Record<string, string> =
                aBuilderService.errorHandler.validation.mock.calls[0][0];
            expect(errors['holdingCoast']).toBe(
                'Holding cost is required when items are not provided',
            );
        });

        it('adds holdingCoast error when hasItems=false and holdingCoast is null', () => {
            const dto = makeDto({ hasItems: false, holdingCoast: null as any });

            expect(() => service.validateHoldingDurationDetails(dto)).toThrow();

            const errors: Record<string, string> =
                aBuilderService.errorHandler.validation.mock.calls[0][0];
            expect(errors['holdingCoast']).toBe(
                'Holding cost is required when items are not provided',
            );
        });

        it('adds holdingCoast error when hasItems=true and holdingCoast is provided', () => {
            const dto = makeDto({ hasItems: true, item: makeRItemDto(), holdingCoast: 3_000 });

            expect(() => service.validateHoldingDurationDetails(dto)).toThrow();

            const errors: Record<string, string> =
                aBuilderService.errorHandler.validation.mock.calls[0][0];
            expect(errors['holdingCoast']).toBe(
                'Holding cost must not be provided when items are used — it is calculated automatically',
            );
        });

        it('passes empty errors when hasItems=false with valid holdingCoast', () => {
            const dto = makeDto({ hasItems: false, holdingCoast: 3_000 });

            expect(() => service.validateHoldingDurationDetails(dto)).toThrow();

            const errors: Record<string, string> =
                aBuilderService.errorHandler.validation.mock.calls[0][0];
            expect(Object.keys(errors)).toHaveLength(0);
        });

        it('passes empty errors when hasItems=true with item and no holdingCoast', () => {
            const dto = makeDto({ hasItems: true, item: makeRItemDto(), holdingCoast: undefined });

            expect(() => service.validateHoldingDurationDetails(dto)).toThrow();

            const errors: Record<string, string> =
                aBuilderService.errorHandler.validation.mock.calls[0][0];
            expect(Object.keys(errors)).toHaveLength(0);
        });

        it('always calls errorHandler.validation exactly once', () => {
            expect(() => service.validateHoldingDurationDetails(makeDto())).toThrow();
            expect(aBuilderService.errorHandler.validation).toHaveBeenCalledTimes(1);
        });
    });

    describe('buildHDurationEntity', () => {
        const required = {
            holdingCoast: 3_000,
            duration: 6,
            transactionFee: 500,
            otherFee: 200,
            targetProfit: 50_000,
        };

        it('returns an HDurationEntity instance', () => {
            expect(service.buildHDurationEntity(required, {})).toBeInstanceOf(HDurationEntity);
        });

        it('assigns all required fields correctly', () => {
            const entity = service.buildHDurationEntity(required, {});
            expect(entity.holdingCoast).toBe(3_000);
            expect(entity.duration).toBe(6);
            expect(entity.transactionFee).toBe(500);
            expect(entity.otherFee).toBe(200);
            expect(entity.targetProfit).toBe(50_000);
        });

        it('assigns analysisBuilder when provided', () => {
            const builder = makeABuilder();
            const entity = service.buildHDurationEntity(required, { analysisBuilder: builder });
            expect(entity.analysisBuilder).toBe(builder);
        });

        it('leaves analysisBuilder undefined when not provided', () => {
            const entity = service.buildHDurationEntity(required, {});
            expect(entity.analysisBuilder).toBeUndefined();
        });
    });

    describe('resolveHoldingDurationValue', () => {
        beforeEach(() => {
            jest.spyOn(service, 'validateHoldingDurationDetails').mockImplementation(
                () => undefined,
            );
        });

        it('calls validateHoldingDurationDetails with the dto', () => {
            const dto = makeDto();
            service.resolveHoldingDurationValue(dto);
            expect(service.validateHoldingDurationDetails).toHaveBeenCalledWith(dto);
        });

        it('returns calculateItemizedIRepairsCoast result when item is present', () => {
            const item = makeRItemDto();
            const dto = makeDto({ hasItems: true, item, holdingCoast: undefined });
            aBuilderService.iRepairsService.calculateItemizedIRepairsCoast.mockReturnValue(2_400);

            const result = service.resolveHoldingDurationValue(dto);

            expect(
                aBuilderService.iRepairsService.calculateItemizedIRepairsCoast,
            ).toHaveBeenCalledWith(item);
            expect(result).toBe(2_400);
        });

        it('returns holdingCoast when no item and holdingCoast is defined', () => {
            const dto = makeDto({ hasItems: false, item: undefined, holdingCoast: 3_000 });
            expect(service.resolveHoldingDurationValue(dto)).toBe(3_000);
        });

        it('returns 0 when no item and holdingCoast is undefined', () => {
            const dto = makeDto({ hasItems: false, item: undefined, holdingCoast: undefined });
            expect(service.resolveHoldingDurationValue(dto)).toBe(0);
        });
    });

    describe('handleHDurationItemizedCreation', () => {
        it('calls createIRepair with correct args when item is present', async () => {
            const item = makeRItemDto();
            const hDuration = makeHDurationEntity();
            aBuilderService.iRepairsService.createIRepair.mockResolvedValue(undefined);

            await service.handleHDurationItemizedCreation(makeDto({ item }), hDuration);

            expect(aBuilderService.iRepairsService.createIRepair).toHaveBeenCalledWith(
                item,
                undefined,
                hDuration,
            );
        });

        it('does not call createIRepair when item is absent', async () => {
            await service.handleHDurationItemizedCreation(
                makeDto({ item: undefined }),
                makeHDurationEntity(),
            );
            expect(aBuilderService.iRepairsService.createIRepair).not.toHaveBeenCalled();
        });
    });

    describe('createHDuration', () => {
        beforeEach(() => {
            jest.spyOn(service, 'resolveHoldingDurationValue').mockReturnValue(3_000);
            jest.spyOn(service, 'handleHDurationItemizedCreation').mockResolvedValue(undefined);
        });

        it('creates and returns the hDuration entity', async () => {
            const hDuration = makeHDurationEntity();
            aBuilderService.hDurationRepository.create.mockResolvedValue(hDuration);

            const result = await service.createHDuration(makeABuilder(), makeDto());

            expect(result).toBe(hDuration);
        });

        it('calls resolveHoldingDurationValue with the dto', async () => {
            aBuilderService.hDurationRepository.create.mockResolvedValue(makeHDurationEntity());
            const dto = makeDto();

            await service.createHDuration(makeABuilder(), dto);

            expect(service.resolveHoldingDurationValue).toHaveBeenCalledWith(dto);
        });

        it('passes resolved holdingCoast into buildHDurationEntity', async () => {
            aBuilderService.hDurationRepository.create.mockResolvedValue(makeHDurationEntity());
            const buildSpy = jest.spyOn(service, 'buildHDurationEntity');

            await service.createHDuration(makeABuilder(), makeDto());

            expect(buildSpy.mock.calls[0][0].holdingCoast).toBe(3_000);
        });

        it('passes the aBuilder into buildHDurationEntity optional args', async () => {
            const builder = makeABuilder('builder-42');
            aBuilderService.hDurationRepository.create.mockResolvedValue(makeHDurationEntity());
            const buildSpy = jest.spyOn(service, 'buildHDurationEntity');

            await service.createHDuration(builder, makeDto());

            expect(buildSpy.mock.calls[0][1]).toEqual({ analysisBuilder: builder });
        });

        it('calls handleHDurationItemizedCreation with dto and created entity', async () => {
            const hDuration = makeHDurationEntity();
            aBuilderService.hDurationRepository.create.mockResolvedValue(hDuration);
            const dto = makeDto();

            await service.createHDuration(makeABuilder(), dto);

            expect(service.handleHDurationItemizedCreation).toHaveBeenCalledWith(dto, hDuration);
        });

        it('calls hDurationRepository.create exactly once', async () => {
            aBuilderService.hDurationRepository.create.mockResolvedValue(makeHDurationEntity());

            await service.createHDuration(makeABuilder(), makeDto());

            expect(aBuilderService.hDurationRepository.create).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateHDuration', () => {
        it('returns no-update message when itemized is undefined', async () => {
            const result = await service.updateHDuration(makeHDurationEntity(), undefined);
            expect(result).toEqual({ message: 'No updates provided for holding duration' });
            expect(aBuilderService.hDurationRepository.update).not.toHaveBeenCalled();
        });

        it('returns no-update message when itemized is an empty object', async () => {
            const result = await service.updateHDuration(makeHDurationEntity(), {});
            expect(result).toEqual({ message: 'No updates provided for holding duration' });
            expect(aBuilderService.hDurationRepository.update).not.toHaveBeenCalled();
        });

        it('calls repo.update with the correct id', async () => {
            aBuilderService.hDurationRepository.update.mockResolvedValue({ affected: 1 });

            await service.updateHDuration(makeHDurationEntity({ id: 'hduration-99' }), {
                duration: 12,
            });

            expect(aBuilderService.hDurationRepository.update.mock.calls[0][0]).toEqual({
                id: 'hduration-99',
            });
        });

        it('only includes defined fields in the update payload', async () => {
            aBuilderService.hDurationRepository.update.mockResolvedValue({ affected: 1 });

            await service.updateHDuration(makeHDurationEntity(), {
                holdingCoast: 4_000,
                otherFee: undefined,
            });

            const payload = aBuilderService.hDurationRepository.update.mock.calls[0][1];
            expect(payload).toHaveProperty('holdingCoast', 4_000);
            expect(payload).not.toHaveProperty('otherFee');
        });

        it('includes value of 0 in the update payload', async () => {
            aBuilderService.hDurationRepository.update.mockResolvedValue({ affected: 1 });

            await service.updateHDuration(makeHDurationEntity(), { otherFee: 0 });

            const payload = aBuilderService.hDurationRepository.update.mock.calls[0][1];
            expect(payload).toHaveProperty('otherFee', 0);
        });

        it('handles all supported fields in the payload', async () => {
            aBuilderService.hDurationRepository.update.mockResolvedValue({ affected: 1 });

            const itemized = {
                holdingCoast: 1,
                duration: 2,
                transactionFee: 3,
                otherFee: 4,
                targetProfit: 5,
            };

            await service.updateHDuration(makeHDurationEntity(), itemized);

            const payload = aBuilderService.hDurationRepository.update.mock.calls[0][1];
            expect(payload).toMatchObject(itemized);
        });

        it('returns the repo.update result', async () => {
            const updateResult = { affected: 1 };
            aBuilderService.hDurationRepository.update.mockResolvedValue(updateResult);

            const result = await service.updateHDuration(makeHDurationEntity(), { duration: 3 });

            expect(result).toBe(updateResult);
        });
    });

    describe('handleHDurationUpdate', () => {
        beforeEach(() => {
            jest.spyOn(service, 'resolveHoldingDurationValue').mockReturnValue(4_000);
            jest.spyOn(service, 'updateHDuration').mockResolvedValue({ affected: 1 } as any);
            jest.spyOn(service, 'handleHDurationItemizedCreation').mockResolvedValue(undefined);
            aBuilderService.iRepairsRepository.delete.mockResolvedValue(undefined);
        });

        it('returns the same hDuration entity reference', async () => {
            const hDuration = makeHDurationEntity();
            const result = await service.handleHDurationUpdate(hDuration, makeDto());
            expect(result).toBe(hDuration);
        });

        it('deletes existing IRepairsEntity when hDuration.itemized relation is set', async () => {
            const hDuration = makeHDurationEntity({
                id: 'hduration-1',
                itemized: makeIRepairsEntity(),
            });

            await service.handleHDurationUpdate(hDuration, makeDto());

            expect(aBuilderService.iRepairsRepository.delete).toHaveBeenCalledWith({
                hDuration: { id: 'hduration-1' },
            });
        });

        it('does not delete when hDuration.itemized relation is undefined', async () => {
            const hDuration = makeHDurationEntity({ itemized: undefined });

            await service.handleHDurationUpdate(hDuration, makeDto());

            expect(aBuilderService.iRepairsRepository.delete).not.toHaveBeenCalled();
        });

        it('calls resolveHoldingDurationValue with the dto', async () => {
            const dto = makeDto();
            await service.handleHDurationUpdate(makeHDurationEntity(), dto);
            expect(service.resolveHoldingDurationValue).toHaveBeenCalledWith(dto);
        });

        it('calls updateHDuration with the entity and the resolved holdingCoast merged into dto', async () => {
            const hDuration = makeHDurationEntity();
            const dto = makeDto();

            await service.handleHDurationUpdate(hDuration, dto);

            expect(service.updateHDuration).toHaveBeenCalledWith(hDuration, {
                ...dto,
                holdingCoast: 4_000,
            });
        });

        it('calls handleHDurationItemizedCreation with dto and entity', async () => {
            const hDuration = makeHDurationEntity();
            const dto = makeDto();

            await service.handleHDurationUpdate(hDuration, dto);

            expect(service.handleHDurationItemizedCreation).toHaveBeenCalledWith(dto, hDuration);
        });

        it('deletes iRepairs before resolving holding value (order check)', async () => {
            const callOrder: string[] = [];

            aBuilderService.iRepairsRepository.delete.mockImplementation(async () => {
                callOrder.push('delete');
            });

            (service.resolveHoldingDurationValue as jest.Mock).mockImplementation(() => {
                callOrder.push('resolve');
                return 4_000;
            });

            await service.handleHDurationUpdate(
                makeHDurationEntity({ itemized: makeIRepairsEntity() }),
                makeDto(),
            );

            expect(callOrder).toEqual(['delete', 'resolve']);
        });
    });
});
