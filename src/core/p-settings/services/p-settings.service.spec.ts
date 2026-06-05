import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PSettingsService } from './p-settings.service';
import { TransformPSettingService } from './transform-p-setting.service';
import { PreSettingsService } from './pre-settings.service';
import { MetricsService } from './metrics.service';
import { SMetricService } from './s-metric.service';
import { UsersService } from '../../users/services';
import { OtherUtils } from '../../../utils/services/tools';
import { ErrorHandlerService } from '../../../common/response';
import { PSettingRepository, MetricsRepository, SMetricRepository } from '../repositories';
import { PSettingCreateDto } from '../dto/p-setting-create.dto';
import { PSettingUpdateDto } from '../dto/p-setting-update.dto';
import { PSettingEntity, MetricsEntity } from '../entities';
import { UserEntity } from '../../users/entities/user.entity';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const makeUser = (overrides: Partial<UserEntity> = {}): UserEntity =>
    ({ id: 'user-1', ...overrides }) as UserEntity;

const makeEntity = (overrides: Partial<PSettingEntity> = {}): PSettingEntity =>
    ({
        id: 'setting-1',
        label: 'My Profile',
        isDefault: false,
        createdBy: makeUser(),
        taxRate: 20,
        occupancyRate: 95,
        managementFees: 10,
        maintenanceEscrow: 5,
        cashReserves: 3,
        capRate: 6,
        cashFlow: 200,
        fTermRoi: 8,
        roi: 10,
        agm: 4,
        ber: 60,
        oer: 40,
        dscr: 1.25,
        coc: 7,
        goi: 30000,
        noi: 25000,
        payBackPeriod: 10,
        grm: 12,
        yearlyIncome: 36000,
        cashNeeded: 50000,
        cashFlowAtLeast: 100,
        fiftyPercent: false,
        onePercent: true,
        twoPercent: false,
        ...overrides,
    }) as PSettingEntity;

const makeCreateDto = (overrides: Partial<PSettingCreateDto> = {}): PSettingCreateDto =>
    ({
        label: 'New Profile',
        metrics: ['metric-1'],
        taxRate: 20,
        occupancyRate: 95,
        managementFees: 10,
        maintenanceEscrow: 5,
        cashReserves: 3,
        capRate: 6,
        cashFlow: 200,
        fTermRoi: 8,
        roi: 10,
        agm: 4,
        ber: 60,
        oer: 40,
        dscr: 1.25,
        coc: 7,
        goi: 30000,
        noi: 25000,
        payBackPeriod: 10,
        grm: 12,
        yearlyIncome: 36000,
        cashNeeded: 50000,
        cashFlowAtLeast: 100,
        fiftyPercent: false,
        onePercent: true,
        twoPercent: false,
        ...overrides,
    }) as PSettingCreateDto;

const makeUpdateDto = (overrides: Partial<PSettingUpdateDto> = {}): PSettingUpdateDto =>
    ({
        label: 'Updated Profile',
        metrics: ['metric-2'],
        taxRate: 25,
        occupancyRate: 90,
        managementFees: 12,
        maintenanceEscrow: 6,
        capRate: 7,
        goi: 32000,
        noi: 26000,
        ber: 62,
        oer: 42,
        dscr: 1.3,
        grm: 13,
        agm: 5,
        coc: 8,
        cashFlow: 250,
        fTermRoi: 9,
        yearlyIncome: 38000,
        roi: 11,
        payBackPeriod: 9,
        onePercent: false,
        twoPercent: true,
        fiftyPercent: true,
        cashFlowAtLeast: 150,
        cashNeeded: 60000,
        ...overrides,
    }) as PSettingUpdateDto;

const mockLogger = { info: jest.fn(), error: jest.fn() };

const mockTransformPSetting = {
    transformProfiles: jest.fn(),
    transformProfile: jest.fn(),
    updateSettingEntities: jest.fn().mockReturnValue({}),
    createdBy: jest.fn().mockReturnValue({}),
};

const mockPreSettings = {
    getUserProfiles: jest.fn(),
    getDefaultUserProfile: jest.fn(),
    retrieveSettingByCriteria: jest.fn(),
    ensureUniqueSettingLabel: jest.fn(),
    buildSettingEntity: jest.fn(),
    updateSettingDetails: jest.fn(),
};

const mockMetricsService = { retrieveMetrics: jest.fn() };
const mockSMetricService = {
    createSMetrics: jest.fn(),
    syncProfileMetrics: jest.fn(),
};

const mockUsersService = {
    preUserService: { retrieveUserByCriteria: jest.fn() },
};

const mockPSettingRepository = { create: jest.fn() };
const mockMetricsRepository = {};
const mockSMetricRepository = {};
const mockOtherUtils = {};
const mockErrorHandler = {};

describe('PSettingsService', () => {
    let service: PSettingsService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PSettingsService,
                { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
                {
                    provide: TransformPSettingService,
                    useValue: mockTransformPSetting,
                },
                { provide: PreSettingsService, useValue: mockPreSettings },
                { provide: MetricsService, useValue: mockMetricsService },
                { provide: SMetricService, useValue: mockSMetricService },
                { provide: UsersService, useValue: mockUsersService },
                {
                    provide: PSettingRepository,
                    useValue: mockPSettingRepository,
                },
                { provide: MetricsRepository, useValue: mockMetricsRepository },
                { provide: SMetricRepository, useValue: mockSMetricRepository },
                { provide: OtherUtils, useValue: mockOtherUtils },
                { provide: ErrorHandlerService, useValue: mockErrorHandler },
            ],
        }).compile();

        service = module.get<PSettingsService>(PSettingsService);
    });

    describe('retrieveUserSProfile', () => {
        it('should retrieve and transform user profiles', async () => {
            const profiles = [makeEntity({ id: 'p1' })];
            const defaultOne = makeEntity({ id: 'default', isDefault: true });
            const transformed = [{ id: 'default' }, { id: 'p1' }];

            mockPreSettings.getUserProfiles.mockResolvedValue(profiles);
            mockPreSettings.getDefaultUserProfile.mockResolvedValue(defaultOne);
            mockTransformPSetting.transformProfiles.mockReturnValue(transformed);

            const result = await service.retrieveUserSProfile('user-1');

            expect(mockLogger.info).toHaveBeenCalledWith('Getting user profiles for user-1');
            expect(mockPreSettings.getUserProfiles).toHaveBeenCalledWith('user-1');
            expect(mockPreSettings.getDefaultUserProfile).toHaveBeenCalledWith('user-1');
            expect(mockTransformPSetting.transformProfiles).toHaveBeenCalledWith([
                defaultOne,
                ...profiles,
            ]);
            expect(result).toBe(transformed);
        });
    });

    describe('settingDetails', () => {
        it('should retrieve and transform setting details', async () => {
            const entity = makeEntity();
            const transformed = { id: 'setting-1', label: 'My Profile' };

            mockPreSettings.retrieveSettingByCriteria.mockResolvedValue(entity);
            mockTransformPSetting.transformProfile.mockReturnValue(transformed);

            const result = await service.settingDetails('setting-1');

            expect(mockLogger.info).toHaveBeenCalledWith(
                'Retrieving a setting details for setting-1',
            );
            expect(mockPreSettings.retrieveSettingByCriteria).toHaveBeenCalledWith(
                { id: 'setting-1' },
                {},
            );
            expect(mockTransformPSetting.transformProfile).toHaveBeenCalledWith(entity);
            expect(result).toBe(transformed);
        });
    });

    describe('getCreatedBy', () => {
        it('should retrieve the user entities by id', async () => {
            const user = makeUser();
            mockUsersService.preUserService.retrieveUserByCriteria.mockResolvedValue(user);

            const result = await service.getCreatedBy('user-1');

            expect(mockUsersService.preUserService.retrieveUserByCriteria).toHaveBeenCalledWith({
                id: 'user-1',
            });
            expect(result).toBe(user);
        });
    });

    describe('genericPSettingCreation', () => {
        it('should build and persist a new PSettingEntity', async () => {
            const user = makeUser();
            const builtEntity = makeEntity();
            const createdEntity = makeEntity({ id: 'new-1' });
            const dto = makeCreateDto();

            mockPreSettings.buildSettingEntity.mockReturnValue(builtEntity);
            mockPSettingRepository.create.mockResolvedValue(createdEntity);

            const result = await service.genericPSettingCreation({
                ...dto,
                createdBy: user,
            });

            expect(mockPreSettings.buildSettingEntity).toHaveBeenCalledWith(
                { label: dto.label, createdBy: user },
                { taxRate: dto.taxRate, occupancyRate: dto.occupancyRate },
                {
                    managementFees: dto.managementFees,
                    maintenanceEscrow: dto.maintenanceEscrow,
                    cashReserves: dto.cashReserves,
                },
                {
                    capRate: dto.capRate,
                    cashFlow: dto.cashFlow,
                    fTermRoi: dto.fTermRoi,
                    roi: dto.roi,
                    agm: dto.agm,
                    ber: dto.ber,
                    oer: dto.oer,
                    dscr: dto.dscr,
                    coc: dto.coc,
                    goi: dto.goi,
                    noi: dto.noi,
                    payBackPeriod: dto.payBackPeriod,
                    grm: dto.grm,
                    yearlyIncome: dto.yearlyIncome,
                },
                {
                    cashNeeded: dto.cashNeeded,
                    cashFlowAtLeast: dto.cashFlowAtLeast,
                    fiftyPercent: dto.fiftyPercent,
                    onePercent: dto.onePercent,
                    twoPercent: dto.twoPercent,
                },
            );
            expect(mockPSettingRepository.create).toHaveBeenCalledWith(builtEntity);
            expect(result).toBe(createdEntity);
        });
    });

    describe('buildInputFromEntity (via updatePSetting)', () => {
        it('should correctly map entities fields when cloning a default profile', async () => {
            const user = makeUser();
            const defaultEntity = makeEntity({
                isDefault: true,
                createdBy: null as any,
            });
            const clonedEntity = makeEntity({
                id: 'cloned-1',
                isDefault: false,
                createdBy: user,
            });
            const updateDto = makeUpdateDto({ metrics: [] });

            mockUsersService.preUserService.retrieveUserByCriteria.mockResolvedValue(user);
            mockPreSettings.retrieveSettingByCriteria
                .mockResolvedValueOnce(defaultEntity)
                .mockResolvedValueOnce(clonedEntity);
            mockPreSettings.buildSettingEntity.mockReturnValue({});
            mockPSettingRepository.create.mockResolvedValue(clonedEntity);
            mockPreSettings.updateSettingDetails.mockResolvedValue(undefined);

            await service.updatePSetting('user-1', 'setting-1', updateDto);

            expect(mockPreSettings.buildSettingEntity).toHaveBeenCalledWith(
                { label: defaultEntity.label, createdBy: user },
                {
                    taxRate: defaultEntity.taxRate,
                    occupancyRate: defaultEntity.occupancyRate,
                },
                {
                    managementFees: defaultEntity.managementFees,
                    maintenanceEscrow: defaultEntity.maintenanceEscrow,
                    cashReserves: defaultEntity.cashReserves,
                },
                expect.objectContaining({ capRate: defaultEntity.capRate }),
                expect.objectContaining({
                    cashNeeded: defaultEntity.cashNeeded,
                }),
            );
        });
    });

    describe('createPSetting', () => {
        it('should create a profile with metrics', async () => {
            const user = makeUser();
            const dto = makeCreateDto({ metrics: ['metric-1'] });
            const createdEntity = makeEntity();
            const mEntities = [{ id: 'metric-1' } as MetricsEntity];

            mockPreSettings.ensureUniqueSettingLabel.mockResolvedValue(undefined);
            mockUsersService.preUserService.retrieveUserByCriteria.mockResolvedValue(user);
            mockMetricsService.retrieveMetrics.mockResolvedValue(mEntities);
            mockPreSettings.buildSettingEntity.mockReturnValue({});
            mockPSettingRepository.create.mockResolvedValue(createdEntity);
            mockSMetricService.createSMetrics.mockResolvedValue(undefined);

            const result = await service.createPSetting('user-1', dto);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Creating a new setting profile by user user-1 with data ${JSON.stringify(dto)}`,
            );
            expect(mockPreSettings.ensureUniqueSettingLabel).toHaveBeenCalledWith(dto.label);
            expect(mockMetricsService.retrieveMetrics).toHaveBeenCalledWith(dto.metrics);
            expect(mockSMetricService.createSMetrics).toHaveBeenCalledWith(
                createdEntity,
                mEntities,
            );
            expect(result).toEqual({
                message: 'Profile setting created successfully',
            });
        });

        it('should create a profile without metrics when metrics is undefined', async () => {
            const user = makeUser();
            const dto = makeCreateDto({ metrics: undefined });
            const createdEntity = makeEntity();

            mockPreSettings.ensureUniqueSettingLabel.mockResolvedValue(undefined);
            mockUsersService.preUserService.retrieveUserByCriteria.mockResolvedValue(user);
            mockPreSettings.buildSettingEntity.mockReturnValue({});
            mockPSettingRepository.create.mockResolvedValue(createdEntity);

            const result = await service.createPSetting('user-1', dto);

            expect(mockMetricsService.retrieveMetrics).not.toHaveBeenCalled();
            expect(mockSMetricService.createSMetrics).not.toHaveBeenCalled();
            expect(result).toEqual({
                message: 'Profile setting created successfully',
            });
        });

        it('should not call createSMetrics when mEntities is empty', async () => {
            const user = makeUser();
            const dto = makeCreateDto({ metrics: [] });
            const createdEntity = makeEntity();

            mockPreSettings.ensureUniqueSettingLabel.mockResolvedValue(undefined);
            mockUsersService.preUserService.retrieveUserByCriteria.mockResolvedValue(user);
            mockMetricsService.retrieveMetrics.mockResolvedValue([]);
            mockPreSettings.buildSettingEntity.mockReturnValue({});
            mockPSettingRepository.create.mockResolvedValue(createdEntity);

            await service.createPSetting('user-1', dto);

            expect(mockSMetricService.createSMetrics).not.toHaveBeenCalled();
        });
    });

    describe('updatePSetting', () => {
        it('should update a regular (non-default) profile', async () => {
            const user = makeUser();
            const entity = makeEntity({ isDefault: false, createdBy: user });
            const updateDto = makeUpdateDto({ metrics: ['metric-2'] });
            const mEntities = [{ id: 'metric-2' } as MetricsEntity];

            mockUsersService.preUserService.retrieveUserByCriteria.mockResolvedValue(user);
            mockPreSettings.retrieveSettingByCriteria
                .mockResolvedValueOnce(entity) // check existence
                .mockResolvedValueOnce(entity); // re-fetch for update
            mockPreSettings.updateSettingDetails.mockResolvedValue(undefined);
            mockMetricsService.retrieveMetrics.mockResolvedValue(mEntities);
            mockSMetricService.syncProfileMetrics.mockResolvedValue(undefined);

            const result = await service.updatePSetting('user-1', 'setting-1', updateDto);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Update setting with id: setting-1 with updateDto: ${JSON.stringify(updateDto)}`,
            );
            expect(mockPSettingRepository.create).not.toHaveBeenCalled();

            expect(mockPreSettings.updateSettingDetails).toHaveBeenCalledWith(
                entity,
                expect.objectContaining({ label: updateDto.label }),
            );
            expect(mockMetricsService.retrieveMetrics).toHaveBeenCalledWith(updateDto.metrics);
            expect(mockSMetricService.syncProfileMetrics).toHaveBeenCalledWith(entity, mEntities);
            expect(result).toEqual({
                message: 'Profile setting updated successfully',
            });
        });

        it('should clone a default profile (isDefault=true, no createdBy) before updating', async () => {
            const user = makeUser();
            const defaultEntity = makeEntity({
                id: 'default-1',
                isDefault: true,
                createdBy: null as any,
            });
            const clonedEntity = makeEntity({
                id: 'cloned-1',
                isDefault: false,
                createdBy: user,
            });
            const updateDto = makeUpdateDto({ metrics: [] });

            mockUsersService.preUserService.retrieveUserByCriteria.mockResolvedValue(user);
            mockPreSettings.retrieveSettingByCriteria
                .mockResolvedValueOnce(defaultEntity)
                .mockResolvedValueOnce(clonedEntity);
            mockPreSettings.buildSettingEntity.mockReturnValue({});
            mockPSettingRepository.create.mockResolvedValue(clonedEntity);
            mockPreSettings.updateSettingDetails.mockResolvedValue(undefined);

            const result = await service.updatePSetting('user-1', 'default-1', updateDto);

            expect(mockPSettingRepository.create).toHaveBeenCalledTimes(1);
            expect(mockPreSettings.updateSettingDetails).toHaveBeenCalledWith(
                clonedEntity,
                expect.objectContaining({ label: updateDto.label }),
            );
            expect(result).toEqual({
                message: 'Profile setting updated successfully',
            });
        });

        it('should not sync metrics when updateDto.metrics is empty', async () => {
            const user = makeUser();
            const entity = makeEntity({ isDefault: false, createdBy: user });
            const updateDto = makeUpdateDto({ metrics: [] });

            mockUsersService.preUserService.retrieveUserByCriteria.mockResolvedValue(user);
            mockPreSettings.retrieveSettingByCriteria
                .mockResolvedValueOnce(entity)
                .mockResolvedValueOnce(entity);
            mockPreSettings.updateSettingDetails.mockResolvedValue(undefined);

            await service.updatePSetting('user-1', 'setting-1', updateDto);

            expect(mockMetricsService.retrieveMetrics).not.toHaveBeenCalled();
            expect(mockSMetricService.syncProfileMetrics).not.toHaveBeenCalled();
        });

        it('should not sync metrics when updateDto.metrics is undefined', async () => {
            const user = makeUser();
            const entity = makeEntity({ isDefault: false, createdBy: user });
            const updateDto = makeUpdateDto({ metrics: undefined });

            mockUsersService.preUserService.retrieveUserByCriteria.mockResolvedValue(user);
            mockPreSettings.retrieveSettingByCriteria
                .mockResolvedValueOnce(entity)
                .mockResolvedValueOnce(entity);
            mockPreSettings.updateSettingDetails.mockResolvedValue(undefined);

            await service.updatePSetting('user-1', 'setting-1', updateDto);

            expect(mockSMetricService.syncProfileMetrics).not.toHaveBeenCalled();
        });

        it('should pass all updateDto fields to updateSettingDetails', async () => {
            const user = makeUser();
            const entity = makeEntity({ isDefault: false, createdBy: user });
            const updateDto = makeUpdateDto({ metrics: [] });

            mockUsersService.preUserService.retrieveUserByCriteria.mockResolvedValue(user);
            mockPreSettings.retrieveSettingByCriteria
                .mockResolvedValueOnce(entity)
                .mockResolvedValueOnce(entity);
            mockPreSettings.updateSettingDetails.mockResolvedValue(undefined);

            await service.updatePSetting('user-1', 'setting-1', updateDto);

            expect(mockPreSettings.updateSettingDetails).toHaveBeenCalledWith(entity, {
                label: updateDto.label,
                taxRate: updateDto.taxRate,
                occupancyRate: updateDto.occupancyRate,
                managementFees: updateDto.managementFees,
                maintenanceEscrow: updateDto.maintenanceEscrow,
                capRate: updateDto.capRate,
                goi: updateDto.goi,
                noi: updateDto.noi,
                ber: updateDto.ber,
                oer: updateDto.oer,
                dscr: updateDto.dscr,
                grm: updateDto.grm,
                agm: updateDto.agm,
                coc: updateDto.coc,
                cashFlow: updateDto.cashFlow,
                fTermRoi: updateDto.fTermRoi,
                yearlyIncome: updateDto.yearlyIncome,
                roi: updateDto.roi,
                payBackPeriod: updateDto.payBackPeriod,
                onePercent: updateDto.onePercent,
                twoPercent: updateDto.twoPercent,
                fiftyPercent: updateDto.fiftyPercent,
                cashFlowAtLeast: updateDto.cashFlowAtLeast,
                cashNeeded: updateDto.cashNeeded,
            });
        });

        it('should not clone when isDefault=true but createdBy is set', async () => {
            const user = makeUser();
            const entity = makeEntity({ isDefault: true, createdBy: user });
            const updateDto = makeUpdateDto({ metrics: [] });

            mockUsersService.preUserService.retrieveUserByCriteria.mockResolvedValue(user);
            mockPreSettings.retrieveSettingByCriteria
                .mockResolvedValueOnce(entity)
                .mockResolvedValueOnce(entity);
            mockPreSettings.updateSettingDetails.mockResolvedValue(undefined);

            await service.updatePSetting('user-1', 'setting-1', updateDto);

            expect(mockPSettingRepository.create).not.toHaveBeenCalled();
        });

        it('should not clone when isDefault=false and no createdBy', async () => {
            const user = makeUser();
            const entity = makeEntity({
                isDefault: false,
                createdBy: null as any,
            });
            const updateDto = makeUpdateDto({ metrics: [] });

            mockUsersService.preUserService.retrieveUserByCriteria.mockResolvedValue(user);
            mockPreSettings.retrieveSettingByCriteria
                .mockResolvedValueOnce(entity)
                .mockResolvedValueOnce(entity);
            mockPreSettings.updateSettingDetails.mockResolvedValue(undefined);

            await service.updatePSetting('user-1', 'setting-1', updateDto);

            expect(mockPSettingRepository.create).not.toHaveBeenCalled();
        });
    });
});
