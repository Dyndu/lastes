import { Test, TestingModule } from '@nestjs/testing';
import { PSettingsController } from './p-settings.controller';
import { PSettingsService } from './services';
import type { CurrentUserInterface } from '../../interface';
import { PSettingCreateDto } from './dto/p-setting-create.dto';
import { PSettingUpdateDto } from './dto/p-setting-update.dto';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('PSettingsController', () => {
    let controller: PSettingsController;

    const mockUser: CurrentUserInterface = {
        id: 'user-uuid-1234',
        role: 'user',
        sessionId: 'session-uuid-5678',
        permissions: {},
    };

    const mockMetricsService = {
        getAllMetrics: jest.fn(),
    };

    const mockPSettingsService = {
        retrieveUserSProfile: jest.fn(),
        settingDetails: jest.fn(),
        createPSetting: jest.fn(),
        updatePSetting: jest.fn(),
        metricsService: mockMetricsService,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PSettingsController],
            providers: [
                {
                    provide: PSettingsService,
                    useValue: mockPSettingsService,
                },
            ],
        })
            .overrideGuard(require('../../common/guard').JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(require('../../common/guard').PermissionsGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<PSettingsController>(PSettingsController);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('userSettings', () => {
        it('should call retrieveUserSProfile with the current user id', async () => {
            const expectedResult = [{ id: 'setting-1' }];
            mockPSettingsService.retrieveUserSProfile.mockResolvedValue(expectedResult);

            const result = await controller.userSettings(mockUser);

            expect(mockPSettingsService.retrieveUserSProfile).toHaveBeenCalledWith(mockUser.id);
            expect(result).toEqual(expectedResult);
        });

        it('should return the result from retrieveUserSProfile', async () => {
            mockPSettingsService.retrieveUserSProfile.mockResolvedValue([]);

            const result = await controller.userSettings(mockUser);

            expect(result).toEqual([]);
        });
    });

    describe('allMetrics', () => {
        it('should call getAllMetrics on metricsService', async () => {
            const expectedMetrics = [{ id: 'metric-1' }, { id: 'metric-2' }];
            mockMetricsService.getAllMetrics.mockResolvedValue(expectedMetrics);

            const result = await controller.allMetrics();

            expect(mockMetricsService.getAllMetrics).toHaveBeenCalled();
            expect(result).toEqual(expectedMetrics);
        });

        it('should return the result from getAllMetrics', async () => {
            mockMetricsService.getAllMetrics.mockResolvedValue([]);

            const result = await controller.allMetrics();

            expect(result).toEqual([]);
        });
    });

    describe('settingDetails', () => {
        it('should call settingDetails with the provided id', async () => {
            const id = '30ac88d4-7ffe-418c-9551-66eeec2e6783';
            const expectedResult = { id, label: 'My Profile' };
            mockPSettingsService.settingDetails.mockResolvedValue(expectedResult);

            const result = await controller.settingDetails(id);

            expect(mockPSettingsService.settingDetails).toHaveBeenCalledWith(id);
            expect(result).toEqual(expectedResult);
        });

        it('should return the result from settingDetails', async () => {
            const id = '30ac88d4-7ffe-418c-9551-66eeec2e6783';
            mockPSettingsService.settingDetails.mockResolvedValue(null);

            const result = await controller.settingDetails(id);

            expect(result).toBeNull();
        });
    });

    describe('createNewSettingProfile', () => {
        it('should call createPSetting with user id and dto', async () => {
            const dto: PSettingCreateDto = { label: 'My Profile' };
            const expectedResult = { id: 'new-setting-uuid', ...dto };
            mockPSettingsService.createPSetting.mockResolvedValue(expectedResult);

            const result = await controller.createNewSettingProfile(mockUser, dto);

            expect(mockPSettingsService.createPSetting).toHaveBeenCalledWith(mockUser.id, dto);
            expect(result).toEqual(expectedResult);
        });

        it('should return the result from createPSetting', async () => {
            const dto: PSettingCreateDto = { label: 'Profile 2', taxRate: 20 };
            mockPSettingsService.createPSetting.mockResolvedValue({
                id: 'uuid',
                ...dto,
            });

            const result = await controller.createNewSettingProfile(mockUser, dto);

            expect(result).toMatchObject({ label: 'Profile 2', taxRate: 20 });
        });
    });

    describe('updateSettingProfile', () => {
        it('should call updatePSetting with user id, setting id and dto', async () => {
            const id = '30ac88d4-7ffe-418c-9551-66eeec2e6783';
            const updateDto: PSettingUpdateDto = { label: 'Updated Profile' };
            const expectedResult = { id, ...updateDto };
            mockPSettingsService.updatePSetting.mockResolvedValue(expectedResult);

            const result = await controller.updateSettingProfile(mockUser, id, updateDto);

            expect(mockPSettingsService.updatePSetting).toHaveBeenCalledWith(
                mockUser.id,
                id,
                updateDto,
            );
            expect(result).toEqual(expectedResult);
        });

        it('should return the result from updatePSetting', async () => {
            const id = '30ac88d4-7ffe-418c-9551-66eeec2e6783';
            const updateDto: PSettingUpdateDto = { taxRate: 15 };
            mockPSettingsService.updatePSetting.mockResolvedValue({
                id,
                taxRate: 15,
            });

            const result = await controller.updateSettingProfile(mockUser, id, updateDto);

            expect(result).toMatchObject({ id, taxRate: 15 });
        });
    });
});
