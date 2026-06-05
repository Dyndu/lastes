import { Test, TestingModule } from '@nestjs/testing';
import { RepairsService } from './repairs.service';
import { ABuilderService } from './a-builder.service';
import { ABuilderEntity, RepairsEntity } from '../entities';
import { CreateRepairsDto, UpdateRepairsDto } from '../dto';

jest.mock('uuid', () => ({ v4: jest.fn(() => 'mock-uuid-1234') }));

const mockCreateERepair = jest.fn();
const mockUpdateERepairs = jest.fn();
const mockDeleteERepair = jest.fn();

const mockCreateIRepair = jest.fn();
const mockUpdateIRepairs = jest.fn();
const mockDeleteIRepair = jest.fn();

const mockCreateORepair = jest.fn();
const mockUpdateORepairs = jest.fn();
const mockDeleteORepair = jest.fn();

const mockRepairsRepositoryCreate = jest.fn();
const mockRepairsRepositoryUpdate = jest.fn();

const mockABuilderService = {
    eRepairsService: {
        createERepair: mockCreateERepair,
        updateERepairs: mockUpdateERepairs,
        deleteERepair: mockDeleteERepair,
    },
    iRepairsService: {
        createIRepair: mockCreateIRepair,
        updateIRepairs: mockUpdateIRepairs,
        deleteIRepair: mockDeleteIRepair,
    },
    oRepairsService: {
        createORepair: mockCreateORepair,
        updateORepairs: mockUpdateORepairs,
        deleteORepair: mockDeleteORepair,
    },
    repairsRepository: {
        create: mockRepairsRepositoryCreate,
        update: mockRepairsRepositoryUpdate,
    },
};

function makeCreateDto(overrides: Partial<CreateRepairsDto> = {}): CreateRepairsDto {
    return {
        afterRepairValue: 500000,
        total: 25000,
        eRepairs: undefined,
        iRepairs: undefined,
        oRepairs: undefined,
        ...overrides,
    };
}

function makeUpdateDto(overrides: Partial<UpdateRepairsDto> = {}): UpdateRepairsDto {
    return {
        afterRepairValue: 500000,
        total: 25000,
        eRepairs: undefined,
        iRepairs: undefined,
        oRepairs: undefined,
        ...overrides,
    };
}

function makeRepairsEntity(overrides: Partial<RepairsEntity> = {}): RepairsEntity {
    return Object.assign(new RepairsEntity(), {
        id: 'repairs-001',
        total: 25000,
        afterRepairsValue: 500000,
        analysisBuilder: null,
        eRepairs: null,
        iRepairs: null,
        oRepairs: null,
        ...overrides,
    });
}

describe('RepairsService', () => {
    let service: RepairsService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RepairsService,
                { provide: ABuilderService, useValue: mockABuilderService },
            ],
        }).compile();

        service = module.get<RepairsService>(RepairsService);
    });

    describe('buildRepairsEntity', () => {
        it('should create a RepairsEntity with total only', () => {
            const result = service.buildRepairsEntity({ total: 30000 });
            expect(result).toBeInstanceOf(RepairsEntity);
            expect(result.total).toBe(30000);
            expect(result.afterRepairsValue).toBeUndefined();
            expect(result.analysisBuilder).toBeUndefined();
        });

        it('should create a RepairsEntity with total and afterRepairsValue', () => {
            const result = service.buildRepairsEntity({ total: 30000, afterRepairsValue: 600000 });
            expect(result).toBeInstanceOf(RepairsEntity);
            expect(result.total).toBe(30000);
            expect(result.afterRepairsValue).toBe(600000);
            expect(result.analysisBuilder).toBeUndefined();
        });

        it('should create a RepairsEntity with analysisBuilder', () => {
            const aBuilder = new ABuilderEntity();
            const result = service.buildRepairsEntity({ total: 30000, analysisBuilder: aBuilder });
            expect(result).toBeInstanceOf(RepairsEntity);
            expect(result.total).toBe(30000);
            expect(result.analysisBuilder).toBe(aBuilder);
        });

        it('should create a RepairsEntity with all properties', () => {
            const aBuilder = new ABuilderEntity();
            const result = service.buildRepairsEntity({
                total: 30000,
                afterRepairsValue: 600000,
                analysisBuilder: aBuilder,
            });
            expect(result).toBeInstanceOf(RepairsEntity);
            expect(result.total).toBe(30000);
            expect(result.afterRepairsValue).toBe(600000);
            expect(result.analysisBuilder).toBe(aBuilder);
        });

        it('should handle zero total', () => {
            const result = service.buildRepairsEntity({ total: 0 });
            expect(result.total).toBe(0);
        });
    });

    describe('resolveTotal', () => {
        it('should return explicit total when provided', () => {
            const dto = makeCreateDto({ total: 42000 });
            expect(service.resolveTotal(dto)).toBe(42000);
        });

        it('should return explicit total when total is 0', () => {
            const dto = makeCreateDto({ total: 0 });
            expect(service.resolveTotal(dto)).toBe(0);
        });

        it('should sum eRepairs values when total is undefined', () => {
            const dto = makeCreateDto({
                total: undefined,
                eRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
            });
            expect(service.resolveTotal(dto)).toBe(49800);
        });

        it('should sum iRepairs values when total is undefined', () => {
            const dto = makeCreateDto({
                total: undefined,
                iRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
            });
            expect(service.resolveTotal(dto)).toBe(49800);
        });

        it('should sum oRepairs values when total is undefined', () => {
            const dto = makeCreateDto({
                total: undefined,
                oRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
            });
            expect(service.resolveTotal(dto)).toBe(49800);
        });

        it('should sum all three repair types when total is undefined', () => {
            const dto = makeCreateDto({
                total: undefined,
                eRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
                iRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
                oRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
            });
            expect(service.resolveTotal(dto)).toBe(149400);
        });

        it('should handle undefined objects gracefully', () => {
            const dto = makeCreateDto({ total: undefined });
            expect(service.resolveTotal(dto)).toBe(0);
        });

        it('should handle null values in repair objects', () => {
            const dto = makeCreateDto({
                total: undefined,
                eRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
            });
            expect(service.resolveTotal(dto)).toBe(49800);
        });

        it('should handle empty objects', () => {
            const dto = makeCreateDto({
                total: undefined,
                eRepairs: null!,
                iRepairs: null!,
                oRepairs: null!,
            });
            expect(service.resolveTotal(dto)).toBe(0);
        });

        it('should handle UpdateRepairsDto with explicit total', () => {
            const dto = makeUpdateDto({ total: 35000 });
            expect(service.resolveTotal(dto)).toBe(35000);
        });

        it('should sum values from UpdateRepairsDto when total is undefined', () => {
            const dto = makeUpdateDto({
                total: undefined,
                eRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
            });
            expect(service.resolveTotal(dto)).toBe(49800);
        });
    });

    describe('createRepairs', () => {
        let aBuilder: ABuilderEntity;
        let savedRepairs: RepairsEntity;

        beforeEach(() => {
            aBuilder = new ABuilderEntity();
            savedRepairs = makeRepairsEntity();
            mockRepairsRepositoryCreate.mockResolvedValue(savedRepairs);
        });

        it('should create repairs with explicit total', async () => {
            const dto = makeCreateDto({ total: 30000, afterRepairValue: 600000 });
            const result = await service.createRepairs(dto, aBuilder);

            expect(mockRepairsRepositoryCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    total: 30000,
                    afterRepairsValue: 600000,
                    analysisBuilder: aBuilder,
                }),
            );
            expect(result).toBe(savedRepairs);
        });

        it('should create repairs with resolved total when total not provided', async () => {
            const dto = makeCreateDto({
                total: undefined,
                eRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
                afterRepairValue: 600000,
            });
            const result = await service.createRepairs(dto, aBuilder);

            expect(mockRepairsRepositoryCreate).toHaveBeenCalled();
            expect(result).toBe(savedRepairs);
        });

        it('should use default afterRepairValue 0 when not provided', async () => {
            const dto = makeCreateDto({ afterRepairValue: undefined, total: 30000 });
            const result = await service.createRepairs(dto, aBuilder);

            expect(mockRepairsRepositoryCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    total: 30000,
                    afterRepairsValue: 0,
                }),
            );
            expect(result).toBe(savedRepairs);
        });

        it('should create eRepairs when provided', async () => {
            const eRepairs = {
                roof: 20000,
                landscaping: 3000,
                garage: 9000,
                bathrooms: 8000,
                concierge: 9800,
            };
            const dto = makeCreateDto({ eRepairs });
            mockCreateERepair.mockResolvedValue({ id: 'e-repair-001' });

            await service.createRepairs(dto, aBuilder);

            expect(mockCreateERepair).toHaveBeenCalledWith(eRepairs, savedRepairs);
        });

        it('should create iRepairs when provided', async () => {
            const iRepairs = {
                roof: 20000,
                landscaping: 3000,
                garage: 9000,
                bathrooms: 8000,
                concierge: 9800,
            };
            const dto = makeCreateDto({ iRepairs });
            mockCreateIRepair.mockResolvedValue({ id: 'i-repair-001' });

            await service.createRepairs(dto, aBuilder);

            expect(mockCreateIRepair).toHaveBeenCalledWith(iRepairs, savedRepairs);
        });

        it('should create oRepairs when provided', async () => {
            const oRepairs = {
                roof: 20000,
                landscaping: 3000,
                garage: 9000,
                bathrooms: 8000,
                concierge: 9800,
            };
            const dto = makeCreateDto({ oRepairs });
            mockCreateORepair.mockResolvedValue({ id: 'o-repair-001' });

            await service.createRepairs(dto, aBuilder);

            expect(mockCreateORepair).toHaveBeenCalledWith(oRepairs, savedRepairs);
        });

        it('should create multiple repair types concurrently', async () => {
            const dto = makeCreateDto({
                eRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
                iRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
                oRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
            });

            mockCreateERepair.mockResolvedValue({ id: 'e-001' });
            mockCreateIRepair.mockResolvedValue({ id: 'i-001' });
            mockCreateORepair.mockResolvedValue({ id: 'o-001' });

            await service.createRepairs(dto, aBuilder);

            expect(mockCreateERepair).toHaveBeenCalled();
            expect(mockCreateIRepair).toHaveBeenCalled();
            expect(mockCreateORepair).toHaveBeenCalled();
        });

        it('should create repairs without analysisBuilder when not provided', async () => {
            const dto = makeCreateDto({ total: 30000 });
            const result = await service.createRepairs(dto);

            expect(mockRepairsRepositoryCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    total: 30000,
                    analysisBuilder: undefined,
                }),
            );
            expect(result).toBe(savedRepairs);
        });

        it('should handle repository create error', async () => {
            const dto = makeCreateDto({ total: 30000 });
            const error = new Error('Database error');
            mockRepairsRepositoryCreate.mockRejectedValue(error);

            await expect(service.createRepairs(dto, aBuilder)).rejects.toThrow('Database error');
        });
    });

    describe('reconcileBeforeUpdate', () => {
        let repair: RepairsEntity;

        beforeEach(() => {
            repair = makeRepairsEntity();
            mockDeleteERepair.mockResolvedValue({ affected: 1 });
            mockDeleteIRepair.mockResolvedValue({ affected: 1 });
            mockDeleteORepair.mockResolvedValue({ affected: 1 });
        });

        it('should delete eRepairs when both exist', async () => {
            const eRepairs = { id: 'e-001' };
            repair.eRepairs = eRepairs as any;
            const dto = makeUpdateDto({
                eRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
            });

            const total = await service.reconcileBeforeUpdate(repair, dto);

            expect(mockDeleteERepair).toHaveBeenCalledWith(eRepairs);
            expect(total).toBe(25000);
        });

        it('should delete iRepairs when both exist', async () => {
            const iRepairs = { id: 'i-001' };
            repair.iRepairs = iRepairs as any;
            const dto = makeUpdateDto({
                iRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
            });

            const total = await service.reconcileBeforeUpdate(repair, dto);

            expect(mockDeleteIRepair).toHaveBeenCalledWith(iRepairs);
            expect(total).toBe(25000);
        });

        it('should delete oRepairs when both exist', async () => {
            const oRepairs = { id: 'o-001' };
            repair.oRepairs = oRepairs as any;
            const dto = makeUpdateDto({
                oRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
            });

            const total = await service.reconcileBeforeUpdate(repair, dto);

            expect(mockDeleteORepair).toHaveBeenCalledWith(oRepairs);
            expect(total).toBe(25000);
        });

        it('should delete multiple repair types when they exist', async () => {
            repair.eRepairs = { id: 'e-001' } as any;
            repair.iRepairs = { id: 'i-001' } as any;
            repair.oRepairs = { id: 'o-001' } as any;
            const dto = makeUpdateDto({
                eRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
                iRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
                oRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
            });

            await service.reconcileBeforeUpdate(repair, dto);

            expect(mockDeleteERepair).toHaveBeenCalled();
            expect(mockDeleteIRepair).toHaveBeenCalled();
            expect(mockDeleteORepair).toHaveBeenCalled();
        });

        it('should not delete eRepairs when dto.eRepairs is undefined', async () => {
            repair.eRepairs = { id: 'e-001' } as any;
            const dto = makeUpdateDto({});

            await service.reconcileBeforeUpdate(repair, dto);

            expect(mockDeleteERepair).not.toHaveBeenCalled();
        });

        it('should not delete iRepairs when dto.iRepairs is undefined', async () => {
            repair.iRepairs = { id: 'i-001' } as any;
            const dto = makeUpdateDto({});

            await service.reconcileBeforeUpdate(repair, dto);

            expect(mockDeleteIRepair).not.toHaveBeenCalled();
        });

        it('should not delete oRepairs when dto.oRepairs is undefined', async () => {
            repair.oRepairs = { id: 'o-001' } as any;
            const dto = makeUpdateDto({});

            await service.reconcileBeforeUpdate(repair, dto);

            expect(mockDeleteORepair).not.toHaveBeenCalled();
        });

        it('should return resolved total from dto', async () => {
            const dto = makeUpdateDto({ total: 40000 });

            const total = await service.reconcileBeforeUpdate(repair, dto);

            expect(total).toBe(40000);
        });

        it('should return summed total when dto.total is undefined', async () => {
            const dto = makeUpdateDto({
                total: undefined,
                eRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
                iRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
            });

            const total = await service.reconcileBeforeUpdate(repair, dto);

            expect(total).toBe(99600);
        });

        it('should handle delete errors gracefully', async () => {
            repair.eRepairs = { id: 'e-001' } as any;
            const dto = makeUpdateDto({
                eRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
            });
            const error = new Error('Delete failed');
            mockDeleteERepair.mockRejectedValue(error);

            await expect(service.reconcileBeforeUpdate(repair, dto)).rejects.toThrow(
                'Delete failed',
            );
        });

        it('should not delete when repair sub-entity is null', async () => {
            repair.eRepairs = null as any;
            const dto = makeUpdateDto({
                eRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
            });

            await service.reconcileBeforeUpdate(repair, dto);

            expect(mockDeleteERepair).not.toHaveBeenCalled();
        });
    });

    describe('updateRepairs', () => {
        let repair: RepairsEntity;

        beforeEach(() => {
            repair = makeRepairsEntity();
            mockRepairsRepositoryUpdate.mockResolvedValue({ affected: 1 });
            mockCreateERepair.mockResolvedValue({ id: 'e-001' });
            mockUpdateERepairs.mockResolvedValue({ affected: 1 });
            mockCreateIRepair.mockResolvedValue({ id: 'i-001' });
            mockUpdateIRepairs.mockResolvedValue({ affected: 1 });
            mockCreateORepair.mockResolvedValue({ id: 'o-001' });
            mockUpdateORepairs.mockResolvedValue({ affected: 1 });
            mockDeleteERepair.mockResolvedValue({ affected: 1 });
            mockDeleteIRepair.mockResolvedValue({ affected: 1 });
            mockDeleteORepair.mockResolvedValue({ affected: 1 });
        });

        it('should update total and afterRepairsValue', async () => {
            const dto = makeUpdateDto({ total: 35000, afterRepairValue: 550000 });

            await service.updateRepairs(repair, dto);

            expect(mockRepairsRepositoryUpdate).toHaveBeenCalledWith(
                { id: repair.id },
                { total: 35000, afterRepairsValue: 550000 },
            );
        });

        it('should preserve afterRepairsValue when not in dto', async () => {
            const dto = makeUpdateDto({ total: 35000, afterRepairValue: undefined });

            await service.updateRepairs(repair, dto);

            expect(mockRepairsRepositoryUpdate).toHaveBeenCalledWith(
                { id: repair.id },
                { total: 35000, afterRepairsValue: repair.afterRepairsValue },
            );
        });

        it('should update existing iRepairs when present', async () => {
            repair.iRepairs = { id: 'i-001' } as any;
            const iRepairs = {
                roof: 20000,
                landscaping: 3000,
                garage: 9000,
                bathrooms: 8000,
                concierge: 9800,
            };
            const dto = makeUpdateDto({ iRepairs });

            await service.updateRepairs(repair, dto);

            expect(mockUpdateIRepairs).toHaveBeenCalledWith(repair.iRepairs, iRepairs);
            expect(mockCreateIRepair).not.toHaveBeenCalled();
        });

        it('should create new iRepairs when not present', async () => {
            repair.iRepairs = null as any;
            const iRepairs = {
                roof: 20000,
                landscaping: 3000,
                garage: 9000,
                bathrooms: 8000,
                concierge: 9800,
            };
            const dto = makeUpdateDto({ iRepairs });

            await service.updateRepairs(repair, dto);

            expect(mockCreateIRepair).toHaveBeenCalledWith(iRepairs, repair);
            expect(mockUpdateIRepairs).not.toHaveBeenCalled();
        });

        it('should update existing eRepairs when present', async () => {
            repair.eRepairs = { id: 'e-001' } as any;
            const eRepairs = {
                roof: 20000,
                landscaping: 3000,
                garage: 9000,
                bathrooms: 8000,
                concierge: 9800,
            };
            const dto = makeUpdateDto({ eRepairs });

            await service.updateRepairs(repair, dto);

            expect(mockUpdateERepairs).toHaveBeenCalledWith(repair.eRepairs, eRepairs);
            expect(mockCreateERepair).not.toHaveBeenCalled();
        });

        it('should create new eRepairs when not present', async () => {
            repair.eRepairs = null as any;
            const eRepairs = {
                roof: 20000,
                landscaping: 3000,
                garage: 9000,
                bathrooms: 8000,
                concierge: 9800,
            };
            const dto = makeUpdateDto({ eRepairs });

            await service.updateRepairs(repair, dto);

            expect(mockCreateERepair).toHaveBeenCalledWith(eRepairs, repair);
            expect(mockUpdateERepairs).not.toHaveBeenCalled();
        });

        it('should update existing oRepairs when present', async () => {
            repair.oRepairs = { id: 'o-001' } as any;
            const oRepairs = {
                roof: 20000,
                landscaping: 3000,
                garage: 9000,
                bathrooms: 8000,
                concierge: 9800,
            };
            const dto = makeUpdateDto({ oRepairs });

            await service.updateRepairs(repair, dto);

            expect(mockUpdateORepairs).toHaveBeenCalledWith(repair.oRepairs, oRepairs);
            expect(mockCreateORepair).not.toHaveBeenCalled();
        });

        it('should create new oRepairs when not present', async () => {
            repair.oRepairs = null as any;
            const oRepairs = {
                roof: 20000,
                landscaping: 3000,
                garage: 9000,
                bathrooms: 8000,
                concierge: 9800,
            };
            const dto = makeUpdateDto({ oRepairs });

            await service.updateRepairs(repair, dto);

            expect(mockCreateORepair).toHaveBeenCalledWith(oRepairs, repair);
            expect(mockUpdateORepairs).not.toHaveBeenCalled();
        });

        it('should handle all three repair types in update', async () => {
            repair.eRepairs = { id: 'e-001' } as any;
            repair.iRepairs = null as any;
            repair.oRepairs = { id: 'o-001' } as any;

            const dto = makeUpdateDto({
                eRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
                iRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
                oRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
            });

            await service.updateRepairs(repair, dto);

            expect(mockUpdateERepairs).toHaveBeenCalled();
            expect(mockCreateIRepair).toHaveBeenCalled();
            expect(mockUpdateORepairs).toHaveBeenCalled();
        });

        it('should call reconcileBeforeUpdate to get total', async () => {
            const reconcileSpy = jest.spyOn(service, 'reconcileBeforeUpdate');
            reconcileSpy.mockResolvedValueOnce(42000);

            const dto = makeUpdateDto({
                total: undefined,
                eRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
            });

            await service.updateRepairs(repair, dto);

            expect(reconcileSpy).toHaveBeenCalledWith(repair, dto);
            expect(mockRepairsRepositoryUpdate).toHaveBeenCalledWith(
                { id: repair.id },
                expect.objectContaining({ total: 42000 }),
            );
        });

        it('should not create or update repairs when DTO fields are undefined', async () => {
            const dto = makeUpdateDto({});

            await service.updateRepairs(repair, dto);

            expect(mockCreateIRepair).not.toHaveBeenCalled();
            expect(mockUpdateIRepairs).not.toHaveBeenCalled();
            expect(mockCreateERepair).not.toHaveBeenCalled();
            expect(mockUpdateERepairs).not.toHaveBeenCalled();
            expect(mockCreateORepair).not.toHaveBeenCalled();
            expect(mockUpdateORepairs).not.toHaveBeenCalled();
        });

        it('should handle repository update error', async () => {
            const dto = makeUpdateDto({ total: 35000 });
            const error = new Error('Update failed');
            mockRepairsRepositoryUpdate.mockRejectedValue(error);

            await expect(service.updateRepairs(repair, dto)).rejects.toThrow('Update failed');
        });

        it('should handle create/update errors in concurrent operations', async () => {
            repair.iRepairs = null as any;
            const dto = makeUpdateDto({
                iRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
            });
            const error = new Error('Creation failed');
            mockCreateIRepair.mockRejectedValue(error);

            await expect(service.updateRepairs(repair, dto)).rejects.toThrow('Creation failed');
        });
    });

    describe('Integration scenarios', () => {
        it('should handle create then update flow', async () => {
            const aBuilder = new ABuilderEntity();
            const createDto = makeCreateDto({
                total: 25000,
                eRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
                iRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
            });

            const savedRepairs = makeRepairsEntity({ id: 'rep-001', total: 25000 });
            mockRepairsRepositoryCreate.mockResolvedValue(savedRepairs);
            mockCreateERepair.mockResolvedValue({ id: 'e-001' });
            mockCreateIRepair.mockResolvedValue({ id: 'i-001' });

            const repairs = await service.createRepairs(createDto, aBuilder);

            const updateDto = makeUpdateDto({
                total: 35000,
                eRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
                oRepairs: {
                    roof: 20000,
                    landscaping: 3000,
                    garage: 9000,
                    bathrooms: 8000,
                    concierge: 9800,
                },
            });

            repairs.eRepairs = { id: 'e-001' } as any;
            repairs.iRepairs = { id: 'i-001' } as any;
            repairs.oRepairs = null as any;

            mockDeleteERepair.mockResolvedValue({ affected: 1 });
            mockUpdateERepairs.mockResolvedValue({ affected: 1 });
            mockCreateORepair.mockResolvedValue({ id: 'o-001' });
            mockRepairsRepositoryUpdate.mockResolvedValue({ affected: 1 });

            await service.updateRepairs(repairs, updateDto);

            expect(mockDeleteERepair).toHaveBeenCalled();
            expect(mockUpdateERepairs).toHaveBeenCalled();
            expect(mockCreateORepair).toHaveBeenCalled();
            expect(mockRepairsRepositoryUpdate).toHaveBeenCalledWith(
                { id: repairs.id },
                { total: 35000, afterRepairsValue: 500000 },
            );
        });
    });
});
