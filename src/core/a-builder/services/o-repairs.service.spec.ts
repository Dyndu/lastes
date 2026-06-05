import { Test, TestingModule } from '@nestjs/testing';
import { ORepairsService } from './o-repairs.service';
import { ABuilderService } from './a-builder.service';
import { BrRefinanceEntity, CCoastEntity, ORepairsEntity, RepairsEntity } from '../entities';
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

const mockORepairsRepository = { create: jest.fn(), update: jest.fn(), delete: jest.fn() };

describe('ORepairsService', () => {
    let service: ORepairsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ORepairsService,
                {
                    provide: ABuilderService,
                    useValue: { oRepairsRepository: mockORepairsRepository },
                },
            ],
        }).compile();

        service = module.get<ORepairsService>(ORepairsService);
        jest.clearAllMocks();
    });

    describe('buildORepairsEntity', () => {
        const required = {
            roof: 100,
            landscaping: 200,
            concierge: 300,
            garage: 400,
            bathrooms: 500,
        };

        it('should return an ORepairsEntity with required fields', () => {
            const result = service.buildORepairsEntity(required, {});
            expect(result).toBeInstanceOf(ORepairsEntity);
            expect(result.roof).toBe(100);
            expect(result.landscaping).toBe(200);
            expect(result.concierge).toBe(300);
            expect(result.garage).toBe(400);
            expect(result.bathrooms).toBe(500);
        });

        it('should assign repairs when provided', () => {
            const repairs = new RepairsEntity();
            expect(service.buildORepairsEntity(required, { repairs }).repairs).toBe(repairs);
        });

        it('should assign cCoast when provided', () => {
            const cCoast = new CCoastEntity();
            expect(service.buildORepairsEntity(required, { cCoast }).cCoast).toBe(cCoast);
        });

        it('should assign brRefi when provided', () => {
            const brRefi = new BrRefinanceEntity();
            expect(service.buildORepairsEntity(required, { brRefi }).brRefi).toBe(brRefi);
        });

        it('should assign repairs, cCoast and brRefi when all provided', () => {
            const repairs = new RepairsEntity();
            const cCoast = new CCoastEntity();
            const brRefi = new BrRefinanceEntity();
            const result = service.buildORepairsEntity(required, { repairs, cCoast, brRefi });
            expect(result.repairs).toBe(repairs);
            expect(result.cCoast).toBe(cCoast);
            expect(result.brRefi).toBe(brRefi);
        });

        it('should leave optional fields undefined when not provided', () => {
            const result = service.buildORepairsEntity(required, {});
            expect(result.repairs).toBeUndefined();
            expect(result.cCoast).toBeUndefined();
            expect(result.brRefi).toBeUndefined();
        });

        it('should assign zero values correctly', () => {
            const result = service.buildORepairsEntity(
                { roof: 0, landscaping: 0, concierge: 0, garage: 0, bathrooms: 0 },
                {},
            );
            expect(result.roof).toBe(0);
            expect(result.bathrooms).toBe(0);
        });
    });

    describe('createORepair', () => {
        it('should call repository.create with built entity and return result', async () => {
            const saved = new ORepairsEntity();
            mockORepairsRepository.create.mockResolvedValue(saved);
            expect(await service.createORepair(makeRItem())).toBe(saved);
            expect(mockORepairsRepository.create).toHaveBeenCalledWith(expect.any(ORepairsEntity));
        });

        it('should assign repairs when provided', async () => {
            const repairs = new RepairsEntity();
            mockORepairsRepository.create.mockResolvedValue(new ORepairsEntity());
            await service.createORepair(makeRItem(), repairs);
            expect(mockORepairsRepository.create.mock.calls[0][0].repairs).toBe(repairs);
        });

        it('should assign cCoast when provided', async () => {
            const cCoast = new CCoastEntity();
            mockORepairsRepository.create.mockResolvedValue(new ORepairsEntity());
            await service.createORepair(makeRItem(), undefined, cCoast);
            expect(mockORepairsRepository.create.mock.calls[0][0].cCoast).toBe(cCoast);
        });

        it('should assign brRefi when provided', async () => {
            const brRefi = new BrRefinanceEntity();
            mockORepairsRepository.create.mockResolvedValue(new ORepairsEntity());
            await service.createORepair(makeRItem(), undefined, undefined, brRefi);
            expect(mockORepairsRepository.create.mock.calls[0][0].brRefi).toBe(brRefi);
        });

        it('should leave all optional fields undefined when called with dto only', async () => {
            mockORepairsRepository.create.mockResolvedValue(new ORepairsEntity());
            await service.createORepair(makeRItem());
            const called = mockORepairsRepository.create.mock.calls[0][0];
            expect(called.repairs).toBeUndefined();
            expect(called.cCoast).toBeUndefined();
            expect(called.brRefi).toBeUndefined();
        });

        it('should spread all dto fields onto the entity', async () => {
            mockORepairsRepository.create.mockResolvedValue(new ORepairsEntity());
            await service.createORepair(makeRItem({ concierge: 555 }));
            expect(mockORepairsRepository.create.mock.calls[0][0].concierge).toBe(555);
        });

        it('should assign all optional relations simultaneously', async () => {
            const repairs = new RepairsEntity();
            const cCoast = new CCoastEntity();
            const brRefi = new BrRefinanceEntity();
            mockORepairsRepository.create.mockResolvedValue(new ORepairsEntity());
            await service.createORepair(makeRItem(), repairs, cCoast, brRefi);
            const called = mockORepairsRepository.create.mock.calls[0][0];
            expect(called.repairs).toBe(repairs);
            expect(called.cCoast).toBe(cCoast);
            expect(called.brRefi).toBe(brRefi);
        });
    });

    describe('updateORepairs', () => {
        let entity: ORepairsEntity;

        beforeEach(() => {
            entity = Object.assign(new ORepairsEntity(), { id: 'or-uuid-001' });
        });

        it('should return early message when itemized is undefined', async () => {
            expect(await service.updateORepairs(entity, undefined)).toEqual({
                message: 'No updates provided for other repairs update',
            });
            expect(mockORepairsRepository.update).not.toHaveBeenCalled();
        });

        it('should return early message when itemized is empty object', async () => {
            expect(await service.updateORepairs(entity, {})).toEqual({
                message: 'No updates provided for other repairs update',
            });
            expect(mockORepairsRepository.update).not.toHaveBeenCalled();
        });

        it('should call update with only defined fields', async () => {
            mockORepairsRepository.update.mockResolvedValue({ affected: 1 });
            await service.updateORepairs(entity, { roof: 111, landscaping: 222 });
            expect(mockORepairsRepository.update).toHaveBeenCalledWith(
                { id: 'or-uuid-001' },
                { roof: 111, landscaping: 222 },
            );
        });

        it('should exclude undefined fields from payload', async () => {
            mockORepairsRepository.update.mockResolvedValue({ affected: 1 });
            await service.updateORepairs(entity, { bathrooms: 500, garage: undefined });
            const payload = mockORepairsRepository.update.mock.calls[0][1];
            expect(payload).toHaveProperty('bathrooms', 500);
            expect(payload).not.toHaveProperty('garage');
        });

        it('should include all fields when all provided', async () => {
            mockORepairsRepository.update.mockResolvedValue({ affected: 1 });
            const updates = { roof: 1, landscaping: 2, concierge: 3, garage: 4, bathrooms: 5 };
            await service.updateORepairs(entity, updates);
            expect(mockORepairsRepository.update).toHaveBeenCalledWith(
                { id: 'or-uuid-001' },
                updates,
            );
        });

        it('should include fields with value 0', async () => {
            mockORepairsRepository.update.mockResolvedValue({ affected: 1 });
            await service.updateORepairs(entity, { landscaping: 0 });
            expect(mockORepairsRepository.update.mock.calls[0][1]).toEqual({ landscaping: 0 });
        });

        it('should return the repository update result', async () => {
            const mockResult = { affected: 1, raw: [] };
            mockORepairsRepository.update.mockResolvedValue(mockResult);
            expect(await service.updateORepairs(entity, { roof: 100 })).toBe(mockResult);
        });
    });

    describe('deleteORepair', () => {
        it('should call repository.delete with the entity id', async () => {
            mockORepairsRepository.delete.mockResolvedValue({ affected: 1 });
            await service.deleteORepair(Object.assign(new ORepairsEntity(), { id: 'or-del-001' }));
            expect(mockORepairsRepository.delete).toHaveBeenCalledWith({ id: 'or-del-001' });
        });

        it('should return the result from repository.delete', async () => {
            const deleteResult = { affected: 1, raw: [] };
            mockORepairsRepository.delete.mockResolvedValue(deleteResult);
            expect(
                await service.deleteORepair(
                    Object.assign(new ORepairsEntity(), { id: 'or-del-001' }),
                ),
            ).toBe(deleteResult);
        });

        it('should call delete only once', async () => {
            mockORepairsRepository.delete.mockResolvedValue({ affected: 1 });
            await service.deleteORepair(Object.assign(new ORepairsEntity(), { id: 'or-del-002' }));
            expect(mockORepairsRepository.delete).toHaveBeenCalledTimes(1);
        });
    });
});
