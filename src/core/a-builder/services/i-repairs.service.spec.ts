import { Test, TestingModule } from '@nestjs/testing';
import { IRepairsService } from './i-repairs.service';
import { ABuilderService } from './a-builder.service';
import {
    BrRefinanceEntity,
    CCoastEntity,
    HDurationEntity,
    IRepairsEntity,
    RepairsEntity,
} from '../entities';
import { RItemDto } from '../dto';

jest.mock('uuid', () => ({ v4: jest.fn(() => 'mock-uuid-1234') }));

const makeRItem = (overrides: Partial<RItemDto> = {}): RItemDto => ({
    roof: 100,
    landscaping: 200,
    concierge: 300,
    garage: 400,
    bathrooms: 500,
    ...overrides,
});

const mockIRepairsRepository = { create: jest.fn(), update: jest.fn(), delete: jest.fn() };

describe('IRepairsService', () => {
    let service: IRepairsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                IRepairsService,
                {
                    provide: ABuilderService,
                    useValue: { iRepairsRepository: mockIRepairsRepository },
                },
            ],
        }).compile();

        service = module.get<IRepairsService>(IRepairsService);
        jest.clearAllMocks();
    });

    describe('calculateItemizedIRepairsCoast', () => {
        it('should return the sum of all fields', () => {
            expect(service.calculateItemizedIRepairsCoast(makeRItem())).toBe(1500);
        });

        it('should return 0 when all fields are 0', () => {
            expect(
                service.calculateItemizedIRepairsCoast(
                    makeRItem({ roof: 0, landscaping: 0, concierge: 0, garage: 0, bathrooms: 0 }),
                ),
            ).toBe(0);
        });

        it('should skip NaN values', () => {
            expect(
                service.calculateItemizedIRepairsCoast({
                    roof: 100,
                    garage: NaN,
                    bathrooms: 200,
                    concierge: NaN,
                    landscaping: 300,
                } as any),
            ).toBe(600);
        });

        it('should return 0 when all fields are NaN', () => {
            expect(
                service.calculateItemizedIRepairsCoast({
                    roof: NaN,
                    garage: NaN,
                    bathrooms: NaN,
                    concierge: NaN,
                    landscaping: NaN,
                } as any),
            ).toBe(0);
        });

        it('should handle a single non-zero field', () => {
            expect(
                service.calculateItemizedIRepairsCoast(
                    makeRItem({ roof: 750, landscaping: 0, concierge: 0, garage: 0, bathrooms: 0 }),
                ),
            ).toBe(750);
        });
    });

    describe('buildIRepairsEntity', () => {
        const required = {
            roof: 100,
            landscaping: 200,
            concierge: 300,
            garage: 400,
            bathrooms: 500,
        };

        it('should return an IRepairsEntity with required fields', () => {
            const result = service.buildIRepairsEntity(required, {});
            expect(result).toBeInstanceOf(IRepairsEntity);
            expect(result.roof).toBe(100);
            expect(result.landscaping).toBe(200);
            expect(result.concierge).toBe(300);
            expect(result.garage).toBe(400);
            expect(result.bathrooms).toBe(500);
        });

        it('should assign repairs when provided', () => {
            const repairs = new RepairsEntity();
            expect(service.buildIRepairsEntity(required, { repairs }).repairs).toBe(repairs);
        });

        it('should assign hDuration when provided', () => {
            const hDuration = new HDurationEntity();
            expect(service.buildIRepairsEntity(required, { hDuration }).hDuration).toBe(hDuration);
        });

        it('should assign cCoast when provided', () => {
            const cCoast = new CCoastEntity();
            expect(service.buildIRepairsEntity(required, { cCoast }).cCoast).toBe(cCoast);
        });

        it('should assign brRefi when provided', () => {
            const brRefi = new BrRefinanceEntity();
            expect(service.buildIRepairsEntity(required, { brRefi }).brRefi).toBe(brRefi);
        });

        it('should assign all optional fields when all provided', () => {
            const repairs = new RepairsEntity();
            const hDuration = new HDurationEntity();
            const cCoast = new CCoastEntity();
            const brRefi = new BrRefinanceEntity();
            const result = service.buildIRepairsEntity(required, {
                repairs,
                hDuration,
                cCoast,
                brRefi,
            });
            expect(result.repairs).toBe(repairs);
            expect(result.hDuration).toBe(hDuration);
            expect(result.cCoast).toBe(cCoast);
            expect(result.brRefi).toBe(brRefi);
        });

        it('should leave optional fields undefined when not provided', () => {
            const result = service.buildIRepairsEntity(required, {});
            expect(result.repairs).toBeUndefined();
            expect(result.hDuration).toBeUndefined();
            expect(result.cCoast).toBeUndefined();
            expect(result.brRefi).toBeUndefined();
        });

        it('should assign zero values correctly', () => {
            const result = service.buildIRepairsEntity(
                { roof: 0, landscaping: 0, concierge: 0, garage: 0, bathrooms: 0 },
                {},
            );
            expect(result.roof).toBe(0);
            expect(result.landscaping).toBe(0);
        });
    });

    describe('createIRepair', () => {
        it('should call repository.create with built entity and return result', async () => {
            const saved = new IRepairsEntity();
            mockIRepairsRepository.create.mockResolvedValue(saved);
            const result = await service.createIRepair(makeRItem());
            expect(mockIRepairsRepository.create).toHaveBeenCalledWith(expect.any(IRepairsEntity));
            expect(result).toBe(saved);
        });

        it('should assign repairs when provided', async () => {
            const repairs = new RepairsEntity();
            mockIRepairsRepository.create.mockResolvedValue(new IRepairsEntity());
            await service.createIRepair(makeRItem(), repairs);
            expect(mockIRepairsRepository.create.mock.calls[0][0].repairs).toBe(repairs);
        });

        it('should assign hDuration when provided', async () => {
            const hDuration = new HDurationEntity();
            mockIRepairsRepository.create.mockResolvedValue(new IRepairsEntity());
            await service.createIRepair(makeRItem(), undefined, hDuration);
            expect(mockIRepairsRepository.create.mock.calls[0][0].hDuration).toBe(hDuration);
        });

        it('should assign cCoast when provided', async () => {
            const cCoast = new CCoastEntity();
            mockIRepairsRepository.create.mockResolvedValue(new IRepairsEntity());
            await service.createIRepair(makeRItem(), undefined, undefined, cCoast);
            expect(mockIRepairsRepository.create.mock.calls[0][0].cCoast).toBe(cCoast);
        });

        it('should assign brRefi when provided', async () => {
            const brRefi = new BrRefinanceEntity();
            mockIRepairsRepository.create.mockResolvedValue(new IRepairsEntity());
            await service.createIRepair(makeRItem(), undefined, undefined, undefined, brRefi);
            expect(mockIRepairsRepository.create.mock.calls[0][0].brRefi).toBe(brRefi);
        });

        it('should leave all optional fields undefined when called with dto only', async () => {
            mockIRepairsRepository.create.mockResolvedValue(new IRepairsEntity());
            await service.createIRepair(makeRItem());
            const called = mockIRepairsRepository.create.mock.calls[0][0];
            expect(called.repairs).toBeUndefined();
            expect(called.hDuration).toBeUndefined();
            expect(called.cCoast).toBeUndefined();
            expect(called.brRefi).toBeUndefined();
        });

        it('should spread all dto fields onto the entity', async () => {
            mockIRepairsRepository.create.mockResolvedValue(new IRepairsEntity());
            await service.createIRepair(makeRItem({ roof: 999 }));
            expect(mockIRepairsRepository.create.mock.calls[0][0].roof).toBe(999);
        });

        it('should assign all optional relations simultaneously', async () => {
            const repairs = new RepairsEntity();
            const hDuration = new HDurationEntity();
            const cCoast = new CCoastEntity();
            const brRefi = new BrRefinanceEntity();
            mockIRepairsRepository.create.mockResolvedValue(new IRepairsEntity());
            await service.createIRepair(makeRItem(), repairs, hDuration, cCoast, brRefi);
            const called = mockIRepairsRepository.create.mock.calls[0][0];
            expect(called.repairs).toBe(repairs);
            expect(called.hDuration).toBe(hDuration);
            expect(called.cCoast).toBe(cCoast);
            expect(called.brRefi).toBe(brRefi);
        });
    });

    describe('updateIRepairs', () => {
        let entity: IRepairsEntity;

        beforeEach(() => {
            entity = Object.assign(new IRepairsEntity(), { id: 'ir-uuid-001' });
        });

        it('should return early message when itemized is undefined', async () => {
            expect(await service.updateIRepairs(entity, undefined)).toEqual({
                message: 'No updates provided for interior repairs update',
            });
            expect(mockIRepairsRepository.update).not.toHaveBeenCalled();
        });

        it('should return early message when itemized is empty object', async () => {
            expect(await service.updateIRepairs(entity, {})).toEqual({
                message: 'No updates provided for interior repairs update',
            });
            expect(mockIRepairsRepository.update).not.toHaveBeenCalled();
        });

        it('should call update with only defined fields', async () => {
            mockIRepairsRepository.update.mockResolvedValue({ affected: 1 });
            await service.updateIRepairs(entity, { roof: 999, garage: 888 });
            expect(mockIRepairsRepository.update).toHaveBeenCalledWith(
                { id: 'ir-uuid-001' },
                { roof: 999, garage: 888 },
            );
        });

        it('should exclude undefined fields from payload', async () => {
            mockIRepairsRepository.update.mockResolvedValue({ affected: 1 });
            await service.updateIRepairs(entity, { roof: 100, landscaping: undefined });
            const payload = mockIRepairsRepository.update.mock.calls[0][1];
            expect(payload).toHaveProperty('roof', 100);
            expect(payload).not.toHaveProperty('landscaping');
        });

        it('should include all fields when all provided', async () => {
            mockIRepairsRepository.update.mockResolvedValue({ affected: 1 });
            const updates = { roof: 1, landscaping: 2, concierge: 3, garage: 4, bathrooms: 5 };
            await service.updateIRepairs(entity, updates);
            expect(mockIRepairsRepository.update).toHaveBeenCalledWith(
                { id: 'ir-uuid-001' },
                updates,
            );
        });

        it('should include fields with value 0', async () => {
            mockIRepairsRepository.update.mockResolvedValue({ affected: 1 });
            await service.updateIRepairs(entity, { roof: 0 });
            expect(mockIRepairsRepository.update.mock.calls[0][1]).toEqual({ roof: 0 });
        });

        it('should return the repository update result', async () => {
            const mockResult = { affected: 1, raw: [] };
            mockIRepairsRepository.update.mockResolvedValue(mockResult);
            expect(await service.updateIRepairs(entity, { roof: 100 })).toBe(mockResult);
        });
    });

    describe('deleteIRepair', () => {
        it('should call repository.delete with the entity id', async () => {
            mockIRepairsRepository.delete.mockResolvedValue({ affected: 1 });
            const entity = Object.assign(new IRepairsEntity(), { id: 'ir-del-001' });
            await service.deleteIRepair(entity);
            expect(mockIRepairsRepository.delete).toHaveBeenCalledWith({ id: 'ir-del-001' });
        });

        it('should return the result from repository.delete', async () => {
            const deleteResult = { affected: 1, raw: [] };
            mockIRepairsRepository.delete.mockResolvedValue(deleteResult);
            const entity = Object.assign(new IRepairsEntity(), { id: 'ir-del-001' });
            expect(await service.deleteIRepair(entity)).toBe(deleteResult);
        });

        it('should call delete only once', async () => {
            mockIRepairsRepository.delete.mockResolvedValue({ affected: 1 });
            await service.deleteIRepair(Object.assign(new IRepairsEntity(), { id: 'ir-del-002' }));
            expect(mockIRepairsRepository.delete).toHaveBeenCalledTimes(1);
        });
    });
});
