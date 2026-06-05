import { Test, TestingModule } from '@nestjs/testing';
import { UnitsService } from './units.service';
import { ABuilderService } from './a-builder.service';
import { UnitEntity } from '../entities';
import { PDetailsEntity } from '../entities';
import { UnitsDto } from '../dto';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const mockUnitRepository = {
    createMany: jest.fn(),
    delete: jest.fn(),
};

const mockABuilderService = {
    unitRepository: mockUnitRepository,
};

describe('UnitsService', () => {
    let service: UnitsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UnitsService,
                {
                    provide: ABuilderService,
                    useValue: mockABuilderService,
                },
            ],
        }).compile();

        service = module.get<UnitsService>(UnitsService);
        jest.clearAllMocks();
    });

    describe('buildUnitEntity', () => {
        it('should build and return a UnitEntity with the required fields', () => {
            const pDetails = new PDetailsEntity();
            const required = {
                sqFootage: 1200,
                bedRooms: 3,
                bathRooms: 2,
                monthlyRent: 1500,
                pDetails,
            };

            const result = service.buildUnitEntity(required);

            expect(result).toBeInstanceOf(UnitEntity);
            expect(result.sqFootage).toBe(1200);
            expect(result.bedRooms).toBe(3);
            expect(result.bathRooms).toBe(2);
            expect(result.monthlyRent).toBe(1500);
            expect(result.pDetails).toBe(pDetails);
        });
    });

    describe('createPDetailsUnits', () => {
        it('should return early without calling createMany when items array is empty', async () => {
            const pDetails = new PDetailsEntity();

            await service.createPDetailsUnits(pDetails, []);

            expect(mockUnitRepository.createMany).not.toHaveBeenCalled();
        });

        it('should call createMany with mapped UnitEntities when items array is not empty', async () => {
            const pDetails = new PDetailsEntity();
            pDetails.id = 'pdetails-uuid-123';

            const items: UnitsDto[] = [
                { sqFootage: 800, bedRooms: 1, bathRooms: 1, monthlyRent: 900 },
                {
                    sqFootage: 1200,
                    bedRooms: 2,
                    bathRooms: 2,
                    monthlyRent: 1400,
                },
            ];

            mockUnitRepository.createMany.mockResolvedValue(undefined);

            await service.createPDetailsUnits(pDetails, items);

            expect(mockUnitRepository.createMany).toHaveBeenCalledTimes(1);

            const calledWith = mockUnitRepository.createMany.mock.calls[0][0];
            expect(calledWith).toHaveLength(2);

            expect(calledWith[0]).toBeInstanceOf(UnitEntity);
            expect(calledWith[0].sqFootage).toBe(800);
            expect(calledWith[0].bedRooms).toBe(1);
            expect(calledWith[0].bathRooms).toBe(1);
            expect(calledWith[0].monthlyRent).toBe(900);
            expect(calledWith[0].pDetails).toBe(pDetails);

            expect(calledWith[1]).toBeInstanceOf(UnitEntity);
            expect(calledWith[1].sqFootage).toBe(1200);
            expect(calledWith[1].bedRooms).toBe(2);
            expect(calledWith[1].bathRooms).toBe(2);
            expect(calledWith[1].monthlyRent).toBe(1400);
            expect(calledWith[1].pDetails).toBe(pDetails);
        });
    });

    describe('deletePDetailsUnits', () => {
        it('should call delete with the correct pDetails id condition', async () => {
            const pDetails = new PDetailsEntity();
            pDetails.id = 'pdetails-uuid-456';

            mockUnitRepository.delete.mockResolvedValue(undefined);

            await service.deletePDetailsUnits(pDetails);

            expect(mockUnitRepository.delete).toHaveBeenCalledTimes(1);
            expect(mockUnitRepository.delete).toHaveBeenCalledWith({
                pDetails: { id: 'pdetails-uuid-456' },
            });
        });
    });
});
