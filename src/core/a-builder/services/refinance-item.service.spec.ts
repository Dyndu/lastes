import { Test, TestingModule } from '@nestjs/testing';
import { RefinanceItemService } from './refinance-item.service';
import { ABuilderService } from './a-builder.service';
import { RefinanceEntity, RefinanceItemEntity } from '../entities';
import { RefiItemDto, RefiItemResolveDto, RefiItemUpdateDto } from '../dto';
import { In } from 'typeorm';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const makeRefi = (id = 'refi-1'): RefinanceEntity => ({ id }) as RefinanceEntity;

const makeRefiItemEntity = (overrides: Partial<RefinanceItemEntity> = {}): RefinanceItemEntity =>
    ({
        id: 'item-1',
        label: 'Roof',
        value: 1000,
        deleted: false,
        ...overrides,
    }) as RefinanceItemEntity;

const makeRefiItemUpdateDto = (overrides: Partial<RefiItemUpdateDto> = {}): RefiItemUpdateDto => ({
    label: 'Roof',
    value: 1000,
    ...overrides,
});

const makeResolveDto = (items: RefiItemUpdateDto[]): RefiItemResolveDto => ({ items });

const buildABuilderServiceMock = () => ({
    refiItemRepository: {
        find: jest.fn(),
        findOne: jest.fn(),
        createMany: jest.fn(),
        update: jest.fn(),
    },
});

describe('RefinanceItemService', () => {
    let service: RefinanceItemService;
    let aBuilderService: ReturnType<typeof buildABuilderServiceMock>;

    beforeEach(async () => {
        aBuilderService = buildABuilderServiceMock();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RefinanceItemService,
                { provide: ABuilderService, useValue: aBuilderService },
            ],
        }).compile();

        service = module.get<RefinanceItemService>(RefinanceItemService);
    });

    afterEach(() => jest.clearAllMocks());

    describe('calculateItemizedRefinance', () => {
        it('sums all finite values', () => {
            const dto = makeResolveDto([
                makeRefiItemUpdateDto({ value: 100 }),
                makeRefiItemUpdateDto({ value: 200 }),
                makeRefiItemUpdateDto({ value: 300 }),
            ]);
            expect(service.calculateItemizedRefinance(dto)).toBe(600);
        });

        it('returns 0 for empty items array', () => {
            expect(service.calculateItemizedRefinance(makeResolveDto([]))).toBe(0);
        });

        it('skips non-finite values (NaN)', () => {
            const dto = makeResolveDto([
                makeRefiItemUpdateDto({ value: NaN }),
                makeRefiItemUpdateDto({ value: 500 }),
            ]);
            expect(service.calculateItemizedRefinance(dto)).toBe(500);
        });

        it('skips Infinity values', () => {
            const dto = makeResolveDto([
                makeRefiItemUpdateDto({ value: Infinity }),
                makeRefiItemUpdateDto({ value: 200 }),
            ]);
            expect(service.calculateItemizedRefinance(dto)).toBe(200);
        });

        it('correctly handles value of 0', () => {
            const dto = makeResolveDto([
                makeRefiItemUpdateDto({ value: 0 }),
                makeRefiItemUpdateDto({ value: 100 }),
            ]);
            expect(service.calculateItemizedRefinance(dto)).toBe(100);
        });

        it('handles single item', () => {
            const dto = makeResolveDto([makeRefiItemUpdateDto({ value: 750 })]);
            expect(service.calculateItemizedRefinance(dto)).toBe(750);
        });
    });

    describe('buildRefiItemEntity', () => {
        it('returns a RefinanceItemEntity instance', () => {
            const refi = makeRefi();
            const entity = service.buildRefiItemEntity({ label: 'Roof', value: 500, refi });
            expect(entity).toBeInstanceOf(RefinanceItemEntity);
        });

        it('assigns all required fields', () => {
            const refi = makeRefi();
            const entity = service.buildRefiItemEntity({ label: 'Plumbing', value: 1200, refi });
            expect(entity.label).toBe('Plumbing');
            expect(entity.value).toBe(1200);
            expect(entity.refi).toBe(refi);
        });
    });

    describe('splitRefiItemDtoByMethod', () => {
        it('splits items with id into updates and without into creates', () => {
            const dto = makeResolveDto([
                makeRefiItemUpdateDto({ id: 'item-1', label: 'Roof', value: 1000 }),
                makeRefiItemUpdateDto({ label: 'Windows', value: 500 }),
                makeRefiItemUpdateDto({ id: 'item-2', label: 'Flooring', value: 800 }),
            ]);

            const { creates, updates } = service.splitRefiItemDtoByMethod(dto);

            expect(updates).toHaveLength(2);
            expect(creates).toHaveLength(1);
            expect(updates[0].id).toBe('item-1');
            expect(creates[0].label).toBe('Windows');
        });

        it('returns empty creates when all items have ids', () => {
            const dto = makeResolveDto([
                makeRefiItemUpdateDto({ id: 'item-1' }),
                makeRefiItemUpdateDto({ id: 'item-2' }),
            ]);
            const { creates, updates } = service.splitRefiItemDtoByMethod(dto);
            expect(creates).toHaveLength(0);
            expect(updates).toHaveLength(2);
        });

        it('returns empty updates when no items have ids', () => {
            const dto = makeResolveDto([
                makeRefiItemUpdateDto({ label: 'A' }),
                makeRefiItemUpdateDto({ label: 'B' }),
            ]);
            const { creates, updates } = service.splitRefiItemDtoByMethod(dto);
            expect(updates).toHaveLength(0);
            expect(creates).toHaveLength(2);
        });

        it('returns empty arrays when items list is empty', () => {
            const { creates, updates } = service.splitRefiItemDtoByMethod(makeResolveDto([]));
            expect(creates).toHaveLength(0);
            expect(updates).toHaveLength(0);
        });
    });

    describe('createRefiItems', () => {
        it('returns early when creates list is empty', async () => {
            await service.createRefiItems(makeRefi(), []);
            expect(aBuilderService.refiItemRepository.find).not.toHaveBeenCalled();
        });

        it('creates only items whose labels do not exist in DB', async () => {
            aBuilderService.refiItemRepository.find.mockResolvedValue([
                makeRefiItemEntity({ label: 'Roof' }),
            ]);
            aBuilderService.refiItemRepository.createMany.mockResolvedValue([]);

            const creates: RefiItemDto[] = [
                { label: 'Roof', value: 500 },
                { label: 'Windows', value: 300 },
            ];

            await service.createRefiItems(makeRefi(), creates);

            const createdEntities = aBuilderService.refiItemRepository.createMany.mock.calls[0][0];
            expect(createdEntities).toHaveLength(1);
            expect(createdEntities[0].label).toBe('Windows');
        });

        it('returns early when all creates already exist in DB', async () => {
            aBuilderService.refiItemRepository.find.mockResolvedValue([
                makeRefiItemEntity({ label: 'Roof' }),
            ]);

            await service.createRefiItems(makeRefi(), [{ label: 'Roof', value: 500 }]);

            expect(aBuilderService.refiItemRepository.createMany).not.toHaveBeenCalled();
        });

        it('is case-insensitive and trim-aware when checking existing labels', async () => {
            aBuilderService.refiItemRepository.find.mockResolvedValue([
                makeRefiItemEntity({ label: 'roof' }),
            ]);

            await service.createRefiItems(makeRefi(), [{ label: '  ROOF  ', value: 500 }]);

            expect(aBuilderService.refiItemRepository.createMany).not.toHaveBeenCalled();
        });

        it('trims label before persisting new entity', async () => {
            aBuilderService.refiItemRepository.find.mockResolvedValue([]);
            aBuilderService.refiItemRepository.createMany.mockResolvedValue([]);

            await service.createRefiItems(makeRefi(), [{ label: '  Windows  ', value: 400 }]);

            const createdEntities = aBuilderService.refiItemRepository.createMany.mock.calls[0][0];
            expect(createdEntities[0].label).toBe('Windows');
        });

        it('creates all items when none exist in DB', async () => {
            aBuilderService.refiItemRepository.find.mockResolvedValue([]);
            aBuilderService.refiItemRepository.createMany.mockResolvedValue([]);

            const creates: RefiItemDto[] = [
                { label: 'Roof', value: 500 },
                { label: 'Windows', value: 300 },
            ];

            await service.createRefiItems(makeRefi(), creates);

            const createdEntities = aBuilderService.refiItemRepository.createMany.mock.calls[0][0];
            expect(createdEntities).toHaveLength(2);
        });
    });

    describe('updateRefiItem', () => {
        it('returns message when itemized is undefined', async () => {
            const result = await service.updateRefiItem(makeRefiItemEntity(), undefined);
            expect(result).toEqual({ message: 'No updates provided for refi item item' });
        });

        it('returns message when itemized is empty object', async () => {
            const result = await service.updateRefiItem(makeRefiItemEntity(), {});
            expect(result).toEqual({ message: 'No updates provided for refi item item' });
        });

        it('calls repo.update with trimmed label', async () => {
            aBuilderService.refiItemRepository.update.mockResolvedValue({ affected: 1 });
            const entity = makeRefiItemEntity({ id: 'item-1' });

            await service.updateRefiItem(entity, { label: '  Plumbing  ' });

            expect(aBuilderService.refiItemRepository.update).toHaveBeenCalledWith(
                { id: 'item-1' },
                { label: 'Plumbing' },
            );
        });

        it('ignores label when it is blank after trim', async () => {
            aBuilderService.refiItemRepository.update.mockResolvedValue({ affected: 1 });
            const entity = makeRefiItemEntity({ id: 'item-1', value: 500 });

            await service.updateRefiItem(entity, { label: '   ', value: 500 });

            const updateArg = aBuilderService.refiItemRepository.update.mock.calls[0][1];
            expect(updateArg).not.toHaveProperty('label');
            expect(updateArg).toHaveProperty('value', 500);
        });

        it('includes value of 0 in update payload', async () => {
            aBuilderService.refiItemRepository.update.mockResolvedValue({ affected: 1 });

            await service.updateRefiItem(makeRefiItemEntity(), { value: 0 });

            const updateArg = aBuilderService.refiItemRepository.update.mock.calls[0][1];
            expect(updateArg).toHaveProperty('value', 0);
        });

        it('updates both label and value', async () => {
            aBuilderService.refiItemRepository.update.mockResolvedValue({ affected: 1 });
            const entity = makeRefiItemEntity({ id: 'item-1' });

            await service.updateRefiItem(entity, { label: 'Flooring', value: 800 });

            const updateArg = aBuilderService.refiItemRepository.update.mock.calls[0][1];
            expect(updateArg).toEqual({ label: 'Flooring', value: 800 });
        });

        it('does not include value when it is undefined', async () => {
            aBuilderService.refiItemRepository.update.mockResolvedValue({ affected: 1 });

            await service.updateRefiItem(makeRefiItemEntity(), { label: 'Flooring' });

            const updateArg = aBuilderService.refiItemRepository.update.mock.calls[0][1];
            expect(updateArg).not.toHaveProperty('value');
        });
    });

    describe('normalizeRefiItemUpdateDto', () => {
        it('uses itemized values when provided', () => {
            const entity = makeRefiItemEntity({ label: 'Roof', value: 1000 });
            const result = service.normalizeRefiItemUpdateDto(entity, {
                label: 'Windows',
                value: 500,
            });
            expect(result).toEqual({ label: 'Windows', value: 500 });
        });

        it('falls back to entity values when itemized fields are undefined', () => {
            const entity = makeRefiItemEntity({ label: 'Roof', value: 1000 });
            const result = service.normalizeRefiItemUpdateDto(entity, {});
            expect(result).toEqual({ label: 'Roof', value: 1000 });
        });

        it('handles value of 0 without falling back to entity value', () => {
            const entity = makeRefiItemEntity({ value: 1000 });
            const result = service.normalizeRefiItemUpdateDto(entity, { value: 0 });
            expect(result.value).toBe(0);
        });

        it('merges partial updates — only label provided', () => {
            const entity = makeRefiItemEntity({ label: 'Roof', value: 1000 });
            const result = service.normalizeRefiItemUpdateDto(entity, { label: 'Flooring' });
            expect(result).toEqual({ label: 'Flooring', value: 1000 });
        });

        it('merges partial updates — only value provided', () => {
            const entity = makeRefiItemEntity({ label: 'Roof', value: 1000 });
            const result = service.normalizeRefiItemUpdateDto(entity, { value: 999 });
            expect(result).toEqual({ label: 'Roof', value: 999 });
        });
    });

    describe('resolveRefiItem', () => {
        it('returns success message', async () => {
            aBuilderService.refiItemRepository.find.mockResolvedValue([]);
            aBuilderService.refiItemRepository.createMany.mockResolvedValue([]);

            const dto = makeResolveDto([makeRefiItemUpdateDto({ label: 'Roof', value: 500 })]);
            const result = await service.resolveRefiItem(makeRefi(), dto);

            expect(result).toEqual({
                message: 'Operation on refinance items finished successfully',
            });
        });

        it('calls createRefiItems for items without id', async () => {
            aBuilderService.refiItemRepository.find.mockResolvedValue([]);
            aBuilderService.refiItemRepository.createMany.mockResolvedValue([]);

            const spy = jest.spyOn(service, 'createRefiItems');
            const dto = makeResolveDto([makeRefiItemUpdateDto({ label: 'Roof', value: 500 })]);

            await service.resolveRefiItem(makeRefi(), dto);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        it('calls repo.find with In(ids) for items with id', async () => {
            aBuilderService.refiItemRepository.find.mockResolvedValue([
                makeRefiItemEntity({ id: 'item-1' }),
            ]);
            aBuilderService.refiItemRepository.update.mockResolvedValue({ affected: 1 });

            const dto = makeResolveDto([
                makeRefiItemUpdateDto({ id: 'item-1', label: 'Updated Roof', value: 1200 }),
            ]);

            await service.resolveRefiItem(makeRefi('refi-1'), dto);

            const findCall = aBuilderService.refiItemRepository.find.mock.calls[0][0];
            expect(findCall.where.id).toEqual(In(['item-1']));
            expect(findCall.where.refi.id).toBe('refi-1');
            expect(findCall.where.deleted).toBe(false);
        });

        it('updates existing items found in DB', async () => {
            aBuilderService.refiItemRepository.find.mockResolvedValue([
                makeRefiItemEntity({ id: 'item-1', label: 'Roof', value: 1000 }),
            ]);
            aBuilderService.refiItemRepository.update.mockResolvedValue({ affected: 1 });

            const dto = makeResolveDto([
                makeRefiItemUpdateDto({ id: 'item-1', label: 'New Roof', value: 2000 }),
            ]);

            await service.resolveRefiItem(makeRefi(), dto);

            expect(aBuilderService.refiItemRepository.update).toHaveBeenCalledWith(
                { id: 'item-1' },
                { label: 'New Roof', value: 2000 },
            );
        });

        it('skips update items not found in DB', async () => {
            aBuilderService.refiItemRepository.find
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([]);

            const dto = makeResolveDto([
                makeRefiItemUpdateDto({ id: 'ghost-id', label: 'Ghost', value: 999 }),
            ]);

            await service.resolveRefiItem(makeRefi(), dto);

            expect(aBuilderService.refiItemRepository.update).not.toHaveBeenCalled();
        });

        it('skips update items whose id is undefined (guard)', async () => {
            aBuilderService.refiItemRepository.find
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([]);

            const splitSpy = jest.spyOn(service, 'splitRefiItemDtoByMethod').mockReturnValue({
                creates: [],
                updates: [{ label: 'Test', value: 100, id: undefined }],
            });

            aBuilderService.refiItemRepository.find.mockResolvedValue([]);

            const dto = makeResolveDto([]);
            await service.resolveRefiItem(makeRefi(), dto);

            expect(aBuilderService.refiItemRepository.update).not.toHaveBeenCalled();
            splitSpy.mockRestore();
        });

        it('handles mixed creates and updates in the same call', async () => {
            aBuilderService.refiItemRepository.find
                .mockResolvedValueOnce([]) // createRefiItems — no existing
                .mockResolvedValueOnce([makeRefiItemEntity({ id: 'item-1' })]);
            aBuilderService.refiItemRepository.createMany.mockResolvedValue([]);
            aBuilderService.refiItemRepository.update.mockResolvedValue({ affected: 1 });

            const dto = makeResolveDto([
                makeRefiItemUpdateDto({ label: 'Windows', value: 300 }), // create
                makeRefiItemUpdateDto({ id: 'item-1', label: 'Roof', value: 500 }), // update
            ]);

            const result = await service.resolveRefiItem(makeRefi(), dto);

            expect(aBuilderService.refiItemRepository.createMany).toHaveBeenCalledTimes(1);
            expect(aBuilderService.refiItemRepository.update).toHaveBeenCalledTimes(1);
            expect(result.message).toBe('Operation on refinance items finished successfully');
        });

        it('handles empty items list gracefully', async () => {
            aBuilderService.refiItemRepository.find.mockResolvedValue([]);

            const result = await service.resolveRefiItem(makeRefi(), makeResolveDto([]));

            expect(result).toEqual({
                message: 'Operation on refinance items finished successfully',
            });
            expect(aBuilderService.refiItemRepository.createMany).not.toHaveBeenCalled();
            expect(aBuilderService.refiItemRepository.update).not.toHaveBeenCalled();
        });
    });
});
