import { Test, TestingModule } from '@nestjs/testing';
import { ERepairsService } from './e-repairs.service';
import { ABuilderService } from './a-builder.service';
import { BrRefinanceEntity, CCoastEntity, ERepairsEntity, RepairsEntity } from '../entities';
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

const mockERepairsRepository = { create: jest.fn(), update: jest.fn(), delete: jest.fn() };

describe('ERepairsService', () => {
    let service: ERepairsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ERepairsService,
                {
                    provide: ABuilderService,
                    useValue: { eRepairsRepository: mockERepairsRepository },
                },
            ],
        }).compile();

        service = module.get<ERepairsService>(ERepairsService);
        jest.clearAllMocks();
    });

    describe('buildERepairsEntity', () => {
        const required = {
            roof: 100,
            landscaping: 200,
            concierge: 300,
            garage: 400,
            bathrooms: 500,
        };

        it('should return an ERepairsEntity with required fields', () => {
            const result = service.buildERepairsEntity(required, {});
            expect(result).toBeInstanceOf(ERepairsEntity);
            expect(result.roof).toBe(100);
            expect(result.landscaping).toBe(200);
            expect(result.concierge).toBe(300);
            expect(result.garage).toBe(400);
            expect(result.bathrooms).toBe(500);
        });

        it('should assign repairs when provided', () => {
            const repairs = new RepairsEntity();
            expect(service.buildERepairsEntity(required, { repairs }).repairs).toBe(repairs);
        });

        it('should assign cCoast when provided', () => {
            const cCoast = new CCoastEntity();
            expect(service.buildERepairsEntity(required, { cCoast }).cCoast).toBe(cCoast);
        });

        it('should assign brRefi when provided', () => {
            const brRefi = new BrRefinanceEntity();
            expect(service.buildERepairsEntity(required, { brRefi }).brRefi).toBe(brRefi);
        });

        it('should assign repairs, cCoast and brRefi when all provided', () => {
            const repairs = new RepairsEntity();
            const cCoast = new CCoastEntity();
            const brRefi = new BrRefinanceEntity();
            const result = service.buildERepairsEntity(required, { repairs, cCoast, brRefi });
            expect(result.repairs).toBe(repairs);
            expect(result.cCoast).toBe(cCoast);
            expect(result.brRefi).toBe(brRefi);
        });

        it('should leave optional fields undefined when not provided', () => {
            const result = service.buildERepairsEntity(required, {});
            expect(result.repairs).toBeUndefined();
            expect(result.cCoast).toBeUndefined();
            expect(result.brRefi).toBeUndefined();
        });

        it('should assign zero values correctly', () => {
            const result = service.buildERepairsEntity(
                { roof: 0, landscaping: 0, concierge: 0, garage: 0, bathrooms: 0 },
                {},
            );
            expect(result.roof).toBe(0);
            expect(result.bathrooms).toBe(0);
        });
    });

    describe('createERepair', () => {
        it('should call repository.create with built entity and return result', async () => {
            const saved = new ERepairsEntity();
            mockERepairsRepository.create.mockResolvedValue(saved);
            expect(await service.createERepair(makeRItem())).toBe(saved);
            expect(mockERepairsRepository.create).toHaveBeenCalledWith(expect.any(ERepairsEntity));
        });

        it('should assign repairs when provided', async () => {
            const repairs = new RepairsEntity();
            mockERepairsRepository.create.mockResolvedValue(new ERepairsEntity());
            await service.createERepair(makeRItem(), repairs);
            expect(mockERepairsRepository.create.mock.calls[0][0].repairs).toBe(repairs);
        });

        it('should assign cCoast when provided', async () => {
            const cCoast = new CCoastEntity();
            mockERepairsRepository.create.mockResolvedValue(new ERepairsEntity());
            await service.createERepair(makeRItem(), undefined, cCoast);
            expect(mockERepairsRepository.create.mock.calls[0][0].cCoast).toBe(cCoast);
        });

        it('should assign brRefi when provided', async () => {
            const brRefi = new BrRefinanceEntity();
            mockERepairsRepository.create.mockResolvedValue(new ERepairsEntity());
            await service.createERepair(makeRItem(), undefined, undefined, brRefi);
            expect(mockERepairsRepository.create.mock.calls[0][0].brRefi).toBe(brRefi);
        });

        it('should leave all optional fields undefined when called with dto only', async () => {
            mockERepairsRepository.create.mockResolvedValue(new ERepairsEntity());
            await service.createERepair(makeRItem());
            const called = mockERepairsRepository.create.mock.calls[0][0];
            expect(called.repairs).toBeUndefined();
            expect(called.cCoast).toBeUndefined();
            expect(called.brRefi).toBeUndefined();
        });

        it('should spread all dto fields onto the entity', async () => {
            mockERepairsRepository.create.mockResolvedValue(new ERepairsEntity());
            await service.createERepair(makeRItem({ roof: 888 }));
            expect(mockERepairsRepository.create.mock.calls[0][0].roof).toBe(888);
        });

        it('should assign all optional relations simultaneously', async () => {
            const repairs = new RepairsEntity();
            const cCoast = new CCoastEntity();
            const brRefi = new BrRefinanceEntity();
            mockERepairsRepository.create.mockResolvedValue(new ERepairsEntity());
            await service.createERepair(makeRItem(), repairs, cCoast, brRefi);
            const called = mockERepairsRepository.create.mock.calls[0][0];
            expect(called.repairs).toBe(repairs);
            expect(called.cCoast).toBe(cCoast);
            expect(called.brRefi).toBe(brRefi);
        });
    });

    describe('updateERepairs', () => {
        let entity: ERepairsEntity;

        beforeEach(() => {
            entity = Object.assign(new ERepairsEntity(), { id: 'er-uuid-001' });
        });

        it('should return early message when itemized is undefined', async () => {
            expect(await service.updateERepairs(entity, undefined)).toEqual({
                message: 'No updates provided for exterior repairs update',
            });
            expect(mockERepairsRepository.update).not.toHaveBeenCalled();
        });

        it('should return early message when itemized is empty object', async () => {
            expect(await service.updateERepairs(entity, {})).toEqual({
                message: 'No updates provided for exterior repairs update',
            });
            expect(mockERepairsRepository.update).not.toHaveBeenCalled();
        });

        it('should call update with only defined fields', async () => {
            mockERepairsRepository.update.mockResolvedValue({ affected: 1 });
            await service.updateERepairs(entity, { roof: 777, bathrooms: 333 });
            expect(mockERepairsRepository.update).toHaveBeenCalledWith(
                { id: 'er-uuid-001' },
                { roof: 777, bathrooms: 333 },
            );
        });

        it('should exclude undefined fields from payload', async () => {
            mockERepairsRepository.update.mockResolvedValue({ affected: 1 });
            await service.updateERepairs(entity, { roof: 200, concierge: undefined });
            const payload = mockERepairsRepository.update.mock.calls[0][1];
            expect(payload).toHaveProperty('roof', 200);
            expect(payload).not.toHaveProperty('concierge');
        });

        it('should include all fields when all provided', async () => {
            mockERepairsRepository.update.mockResolvedValue({ affected: 1 });
            const updates = { roof: 1, landscaping: 2, concierge: 3, garage: 4, bathrooms: 5 };
            await service.updateERepairs(entity, updates);
            expect(mockERepairsRepository.update).toHaveBeenCalledWith(
                { id: 'er-uuid-001' },
                updates,
            );
        });

        it('should include fields with value 0', async () => {
            mockERepairsRepository.update.mockResolvedValue({ affected: 1 });
            await service.updateERepairs(entity, { garage: 0 });
            expect(mockERepairsRepository.update.mock.calls[0][1]).toEqual({ garage: 0 });
        });

        it('should return the repository update result', async () => {
            const mockResult = { affected: 1, raw: [] };
            mockERepairsRepository.update.mockResolvedValue(mockResult);
            expect(await service.updateERepairs(entity, { roof: 100 })).toBe(mockResult);
        });
    });

    describe('deleteERepair', () => {
        it('should call repository.delete with the entity id', async () => {
            mockERepairsRepository.delete.mockResolvedValue({ affected: 1 });
            const entity = Object.assign(new ERepairsEntity(), { id: 'er-del-001' });
            await service.deleteERepair(entity);
            expect(mockERepairsRepository.delete).toHaveBeenCalledWith({ id: 'er-del-001' });
        });

        it('should return the result from repository.delete', async () => {
            const deleteResult = { affected: 1, raw: [] };
            mockERepairsRepository.delete.mockResolvedValue(deleteResult);
            expect(
                await service.deleteERepair(
                    Object.assign(new ERepairsEntity(), { id: 'er-del-001' }),
                ),
            ).toBe(deleteResult);
        });

        it('should call delete only once', async () => {
            mockERepairsRepository.delete.mockResolvedValue({ affected: 1 });
            await service.deleteERepair(Object.assign(new ERepairsEntity(), { id: 'er-del-002' }));
            expect(mockERepairsRepository.delete).toHaveBeenCalledTimes(1);
        });
    });
});
