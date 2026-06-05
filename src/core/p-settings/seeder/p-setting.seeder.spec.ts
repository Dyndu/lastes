import { Test, TestingModule } from '@nestjs/testing';
import { PSettingSeeder } from './p-setting.seeder';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PSettingRepository } from '../repositories';
import { PSettingEntity } from '../entities';
import { IsNull } from 'typeorm';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('PSettingSeeder', () => {
    let seeder: PSettingSeeder;

    const mockLogger = {
        info: jest.fn(),
    };

    const mockPSettingRepository = {
        findOne: jest.fn(),
        create: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PSettingSeeder,
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: mockLogger,
                },
                {
                    provide: PSettingRepository,
                    useValue: mockPSettingRepository,
                },
            ],
        }).compile();

        seeder = module.get<PSettingSeeder>(PSettingSeeder);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(seeder).toBeDefined();
    });

    describe('seed', () => {
        it('should log seeding started', async () => {
            mockPSettingRepository.findOne.mockResolvedValue({
                id: 'existing-setting',
            });

            await seeder.seed();

            expect(mockLogger.info).toHaveBeenCalledWith('[Setting seeder] Seeding started');
        });

        it('should call findOne with correct where clause', async () => {
            mockPSettingRepository.findOne.mockResolvedValue({
                id: 'existing-setting',
            });

            await seeder.seed();

            expect(mockPSettingRepository.findOne).toHaveBeenCalledWith({
                where: { deleted: false, isDefault: true, createdBy: IsNull() },
            });
        });

        describe('when a default setting already exists', () => {
            it('should not create a new setting', async () => {
                mockPSettingRepository.findOne.mockResolvedValue({
                    id: 'existing-setting',
                });

                await seeder.seed();

                expect(mockPSettingRepository.create).not.toHaveBeenCalled();
            });
        });

        describe('when no default setting exists', () => {
            it('should create a new PSettingEntity', async () => {
                mockPSettingRepository.findOne.mockResolvedValue(null);
                mockPSettingRepository.create.mockResolvedValue({});

                await seeder.seed();

                expect(mockPSettingRepository.create).toHaveBeenCalledTimes(1);
            });

            it('should create the entities with label "Default Profile"', async () => {
                mockPSettingRepository.findOne.mockResolvedValue(null);
                mockPSettingRepository.create.mockResolvedValue({});

                await seeder.seed();

                const createdEntity = mockPSettingRepository.create.mock.calls[0][0];
                expect(createdEntity).toBeInstanceOf(PSettingEntity);
                expect(createdEntity.label).toBe('Default Profile');
            });
        });
    });
});
