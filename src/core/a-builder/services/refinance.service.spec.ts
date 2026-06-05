import { Test, TestingModule } from '@nestjs/testing';
import { RefinanceService } from './refinance.service';
import { ABuilderService } from './a-builder.service';
import { ABuilderEntity, RefinanceEntity } from '../entities';
import { RefiCreateDto } from '../dto';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const makeABuilder = (id = 'builder-1'): ABuilderEntity => ({ id }) as ABuilderEntity;

const makeRefinanceEntity = (overrides: Partial<RefinanceEntity> = {}): RefinanceEntity =>
    ({
        id: 'refi-1',
        afterRepairValue: 400_000,
        refiLTV: 75,
        newLoanAmount: 300_000,
        oldLoanAmount: 250_000,
        pInterest: 1_500,
        interestRate: 5,
        pmi: 100,
        hoa: 200,
        point: 1,
        closingCoast: 5_000,
        ...overrides,
    }) as RefinanceEntity;

const makeRefiDto = (overrides: Partial<RefiCreateDto> = {}): RefiCreateDto =>
    ({
        afterRepairValue: 400_000,
        refiLTV: 75,
        newLoanAmount: 300_000,
        oldLoanAmount: 250_000,
        pInterest: 1_500,
        interestRate: 5,
        pmi: 100,
        hoa: 200,
        point: 1,
        hasItems: false,
        closingCoast: 5_000,
        item: undefined,
        ...overrides,
    }) as RefiCreateDto;

const buildABuilderServiceMock = () => ({
    errorHandler: {
        validation: jest.fn((errors) => new Error(JSON.stringify(errors))),
    },
    refinanceRepository: {
        create: jest.fn(),
        update: jest.fn(),
    },
    refinanceItemService: {
        calculateItemizedRefinance: jest.fn(),
        resolveRefiItem: jest.fn(),
    },
});

describe('RefinanceService', () => {
    let service: RefinanceService;
    let aBuilderService: ReturnType<typeof buildABuilderServiceMock>;

    beforeEach(async () => {
        aBuilderService = buildABuilderServiceMock();

        const module: TestingModule = await Test.createTestingModule({
            providers: [RefinanceService, { provide: ABuilderService, useValue: aBuilderService }],
        }).compile();

        service = module.get<RefinanceService>(RefinanceService);
    });

    afterEach(() => jest.clearAllMocks());

    describe('validateRefinanceDetails', () => {
        beforeEach(() => {
            aBuilderService.errorHandler.validation.mockImplementation((errors) => {
                throw new Error(JSON.stringify(errors));
            });
        });

        it('throws with item error when hasItems=true and no item provided', () => {
            const dto = makeRefiDto({ hasItems: true, item: undefined, closingCoast: undefined });

            expect(() => service.validateRefinanceDetails(dto)).toThrow();

            const errors = aBuilderService.errorHandler.validation.mock.calls[0][0];
            expect(errors['item']).toBe('Itemized details are required for refinance');
        });

        it('throws with closingCoast error when hasItems=false and no closingCoast', () => {
            const dto = makeRefiDto({ hasItems: false, closingCoast: undefined });

            expect(() => service.validateRefinanceDetails(dto)).toThrow();

            const errors = aBuilderService.errorHandler.validation.mock.calls[0][0];
            expect(errors['closingCoast']).toBe(
                'Closing coast is required when items are not provided',
            );
        });

        it('throws with closingCoast error when hasItems=true and closingCoast is provided', () => {
            const dto = makeRefiDto({
                hasItems: true,
                closingCoast: 5_000,
                item: { items: [] } as any,
            });

            expect(() => service.validateRefinanceDetails(dto)).toThrow();

            const errors = aBuilderService.errorHandler.validation.mock.calls[0][0];
            expect(errors['closingCoast']).toBe(
                'Closing coast must not be provided when items are used — it is calculated automatically',
            );
        });

        it('throws with empty errors when dto is valid (hasItems=false with closingCoast)', () => {
            const dto = makeRefiDto({ hasItems: false, closingCoast: 5_000 });

            expect(() => service.validateRefinanceDetails(dto)).toThrow();

            const errors = aBuilderService.errorHandler.validation.mock.calls[0][0];
            expect(Object.keys(errors)).toHaveLength(0);
        });

        it('throws with empty errors when dto is valid (hasItems=true with item, no closingCoast)', () => {
            const dto = makeRefiDto({
                hasItems: true,
                item: { items: [] } as any,
                closingCoast: undefined,
            });

            expect(() => service.validateRefinanceDetails(dto)).toThrow();

            const errors = aBuilderService.errorHandler.validation.mock.calls[0][0];
            expect(Object.keys(errors)).toHaveLength(0);
        });

        it('always calls errorHandler.validation', () => {
            expect(() => service.validateRefinanceDetails(makeRefiDto())).toThrow();
            expect(aBuilderService.errorHandler.validation).toHaveBeenCalledTimes(1);
        });
    });

    describe('resolveRefinanceValue', () => {
        beforeEach(() => {
            aBuilderService.errorHandler.validation.mockReturnValue(undefined!);
            jest.spyOn(service, 'validateRefinanceDetails').mockImplementation(() => undefined);
        });

        it('returns calculateItemizedRefinance result when item is present', () => {
            const itemDto = { items: [] } as any;
            const dto = makeRefiDto({ hasItems: true, item: itemDto, closingCoast: undefined });
            aBuilderService.refinanceItemService.calculateItemizedRefinance.mockReturnValue(8_000);

            const result = service.resolveRefinanceValue(dto);

            expect(
                aBuilderService.refinanceItemService.calculateItemizedRefinance,
            ).toHaveBeenCalledWith(itemDto);
            expect(result).toBe(8_000);
        });

        it('returns closingCoast when hasItems=false and closingCoast is provided', () => {
            const dto = makeRefiDto({ hasItems: false, closingCoast: 5_000, item: undefined });

            const result = service.resolveRefinanceValue(dto);

            expect(result).toBe(5_000);
        });

        it('returns 0 when hasItems=false and closingCoast is undefined', () => {
            const dto = makeRefiDto({ hasItems: false, closingCoast: undefined, item: undefined });

            const result = service.resolveRefinanceValue(dto);

            expect(result).toBe(0);
        });

        it('calls validateRefinanceDetails with dto', () => {
            const dto = makeRefiDto();
            service.resolveRefinanceValue(dto);
            expect(service.validateRefinanceDetails).toHaveBeenCalledWith(dto);
        });
    });

    describe('handleRefinanceItemizedCreation', () => {
        it('calls resolveRefiItem when dto.item is present', async () => {
            const refi = makeRefinanceEntity();
            const itemDto = { items: [] } as any;
            const dto = makeRefiDto({ item: itemDto });
            aBuilderService.refinanceItemService.resolveRefiItem.mockResolvedValue(undefined);

            await service.handleRefinanceItemizedCreation(dto, refi);

            expect(aBuilderService.refinanceItemService.resolveRefiItem).toHaveBeenCalledWith(
                refi,
                itemDto,
            );
        });

        it('does NOT call resolveRefiItem when dto.item is absent', async () => {
            const refi = makeRefinanceEntity();
            const dto = makeRefiDto({ item: undefined });

            await service.handleRefinanceItemizedCreation(dto, refi);

            expect(aBuilderService.refinanceItemService.resolveRefiItem).not.toHaveBeenCalled();
        });
    });

    describe('buildRefinance', () => {
        const required = {
            afterRepairValue: 400_000,
            refiLTV: 75,
            newLoanAmount: 300_000,
            oldLoanAmount: 250_000,
            pInterest: 1_500,
            interestRate: 5,
            pmi: 100,
            hoa: 200,
            point: 1,
            closingCoast: 5_000,
        };

        it('returns a RefinanceEntity instance', () => {
            const result = service.buildRefinance(required, {});
            expect(result).toBeInstanceOf(RefinanceEntity);
        });

        it('assigns all required fields', () => {
            const result = service.buildRefinance(required, {});
            expect(result.afterRepairValue).toBe(400_000);
            expect(result.refiLTV).toBe(75);
            expect(result.newLoanAmount).toBe(300_000);
            expect(result.closingCoast).toBe(5_000);
        });

        it('assigns optional analysisBuilder when provided', () => {
            const builder = makeABuilder();
            const result = service.buildRefinance(required, { analysisBuilder: builder });
            expect(result.analysisBuilder).toBe(builder);
        });

        it('leaves analysisBuilder undefined when not provided', () => {
            const result = service.buildRefinance(required, {});
            expect(result.analysisBuilder).toBeUndefined();
        });
    });

    describe('createRefinance', () => {
        beforeEach(() => {
            jest.spyOn(service, 'resolveRefinanceValue').mockReturnValue(5_000);
            jest.spyOn(service, 'handleRefinanceItemizedCreation').mockResolvedValue(undefined);
        });

        it('creates and returns a refinance entity', async () => {
            const refi = makeRefinanceEntity();
            aBuilderService.refinanceRepository.create.mockResolvedValue(refi);

            const result = await service.createRefinance(makeABuilder(), makeRefiDto());

            expect(aBuilderService.refinanceRepository.create).toHaveBeenCalledTimes(1);
            expect(result).toBe(refi);
        });

        it('calls resolveRefinanceValue with dto', async () => {
            aBuilderService.refinanceRepository.create.mockResolvedValue(makeRefinanceEntity());
            const dto = makeRefiDto();

            await service.createRefinance(makeABuilder(), dto);

            expect(service.resolveRefinanceValue).toHaveBeenCalledWith(dto);
        });

        it('passes closingCoast resolved value into buildRefinance', async () => {
            const refi = makeRefinanceEntity();
            aBuilderService.refinanceRepository.create.mockResolvedValue(refi);
            const buildSpy = jest.spyOn(service, 'buildRefinance');

            await service.createRefinance(makeABuilder(), makeRefiDto());

            expect(buildSpy.mock.calls[0][0].closingCoast).toBe(5_000);
        });

        it('calls handleRefinanceItemizedCreation with dto and created refi', async () => {
            const refi = makeRefinanceEntity();
            aBuilderService.refinanceRepository.create.mockResolvedValue(refi);
            const dto = makeRefiDto();

            await service.createRefinance(makeABuilder(), dto);

            expect(service.handleRefinanceItemizedCreation).toHaveBeenCalledWith(dto, refi);
        });
    });

    describe('updateRefinance', () => {
        it('returns message when itemized is undefined', async () => {
            const result = await service.updateRefinance(makeRefinanceEntity(), undefined);
            expect(result).toEqual({ message: 'No updates provided for refinance.' });
        });

        it('returns message when itemized is empty object', async () => {
            const result = await service.updateRefinance(makeRefinanceEntity(), {});
            expect(result).toEqual({ message: 'No updates provided for refinance.' });
        });

        it('calls repo.update with correct id and payload', async () => {
            aBuilderService.refinanceRepository.update.mockResolvedValue({ affected: 1 });
            const refi = makeRefinanceEntity({ id: 'refi-1' });

            await service.updateRefinance(refi, { afterRepairValue: 500_000 });

            expect(aBuilderService.refinanceRepository.update).toHaveBeenCalledWith(
                { id: 'refi-1' },
                { afterRepairValue: 500_000 },
            );
        });

        it('only includes defined fields in payload', async () => {
            aBuilderService.refinanceRepository.update.mockResolvedValue({ affected: 1 });

            await service.updateRefinance(makeRefinanceEntity(), {
                afterRepairValue: 500_000,
                pmi: undefined,
            });

            const payload = aBuilderService.refinanceRepository.update.mock.calls[0][1];
            expect(payload).toHaveProperty('afterRepairValue', 500_000);
            expect(payload).not.toHaveProperty('pmi');
        });

        it('includes value of 0 in update payload', async () => {
            aBuilderService.refinanceRepository.update.mockResolvedValue({ affected: 1 });

            await service.updateRefinance(makeRefinanceEntity(), { hoa: 0 });

            const payload = aBuilderService.refinanceRepository.update.mock.calls[0][1];
            expect(payload).toHaveProperty('hoa', 0);
        });

        it('handles all supported fields', async () => {
            aBuilderService.refinanceRepository.update.mockResolvedValue({ affected: 1 });

            const itemized = {
                afterRepairValue: 1,
                refiLTV: 2,
                newLoanAmount: 3,
                oldLoanAmount: 4,
                pInterest: 5,
                interestRate: 6,
                pmi: 7,
                hoa: 8,
                point: 9,
                closingCoast: 10,
            };

            await service.updateRefinance(makeRefinanceEntity(), itemized);

            const payload = aBuilderService.refinanceRepository.update.mock.calls[0][1];
            expect(payload).toMatchObject(itemized);
        });
    });

    describe('handleRefiUpdate', () => {
        beforeEach(() => {
            jest.spyOn(service, 'resolveRefinanceValue').mockReturnValue(6_000);
            jest.spyOn(service, 'updateRefinance').mockResolvedValue({ affected: 1 } as any);
            jest.spyOn(service, 'handleRefinanceItemizedCreation').mockResolvedValue(undefined);
        });

        it('returns the refi entity', async () => {
            const refi = makeRefinanceEntity();
            const result = await service.handleRefiUpdate(refi, makeRefiDto());
            expect(result).toBe(refi);
        });

        it('calls resolveRefinanceValue with dto', async () => {
            const dto = makeRefiDto();
            await service.handleRefiUpdate(makeRefinanceEntity(), dto);
            expect(service.resolveRefinanceValue).toHaveBeenCalledWith(dto);
        });

        it('calls updateRefinance with refi and resolved closingCoast', async () => {
            const refi = makeRefinanceEntity();
            const dto = makeRefiDto();

            await service.handleRefiUpdate(refi, dto);

            expect(service.updateRefinance).toHaveBeenCalledWith(refi, {
                ...dto,
                closingCoast: 6_000,
            });
        });

        it('calls handleRefinanceItemizedCreation with dto and refi', async () => {
            const refi = makeRefinanceEntity();
            const dto = makeRefiDto();

            await service.handleRefiUpdate(refi, dto);

            expect(service.handleRefinanceItemizedCreation).toHaveBeenCalledWith(dto, refi);
        });
    });
});
