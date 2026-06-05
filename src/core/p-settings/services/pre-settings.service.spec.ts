import { Test, TestingModule } from '@nestjs/testing';
import { PreSettingsService } from './pre-settings.service';
import { PSettingsService } from './p-settings.service';
import { PSettingEntity } from '../entities';
import { UserEntity } from '../../users/entities/user.entity';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('PreSettingsService', () => {
    let service: PreSettingsService;

    const mockUser: UserEntity = {
        id: 'user-123',
        email: 'user@test.com',
    } as UserEntity;

    const mockSetting: PSettingEntity = {
        id: 'setting-123',
        label: 'Test Setting',
        createdBy: mockUser,
        isDefault: false,
        deleted: false,
    } as PSettingEntity;

    const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };
    const mockOtherUtils = { formatCriteria: jest.fn() };
    const mockErrorHandler = {
        notFound: jest.fn().mockImplementation((msg: string) => {
            throw new Error(msg);
        }),
        validation: jest.fn().mockImplementation((errors: any) => {
            throw new Error(JSON.stringify(errors));
        }),
    };
    const mockPSettingRepository = {
        findActiveOne: jest.fn(),
        update: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        assertUniqueActive: jest.fn(),
    };
    const mockTransformPSettingService = {
        profileEntities: jest.fn().mockReturnValue(['createdBy']),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const mockPSettingsServiceValue = {
            logger: mockLogger,
            otherUtils: mockOtherUtils,
            errorHandler: mockErrorHandler,
            pSettingRepository: mockPSettingRepository,
            transformPSettingService: mockTransformPSettingService,
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PreSettingsService,
                {
                    provide: PSettingsService,
                    useValue: mockPSettingsServiceValue,
                },
            ],
        }).compile();

        service = module.get<PreSettingsService>(PreSettingsService);
        module.get(PSettingsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('buildSettingEntity', () => {
        const required = { label: 'My Setting', createdBy: mockUser };
        const basicSettings = { taxRate: 25, occupancyRate: 95 };
        const variablesExpenses = {
            managementFees: 10,
            maintenanceEscrow: 5,
            cashReserves: 3,
        };
        const targetLimits = {
            capRate: 6,
            goi: 50000,
            noi: 40000,
            ber: 70,
            oer: 35,
            dscr: 1.2,
            grm: 10,
            agm: 8,
            coc: 7,
            cashFlow: 500,
            fTermRoi: 15,
            yearlyIncome: 60000,
            roi: 12,
            payBackPeriod: 10,
        };
        const cashFlowCriteria = {
            onePercent: true,
            twoPercent: false,
            fiftyPercent: true,
            cashFlowAtLeast: 200,
            cashNeeded: 50000,
        };

        it('should build a PSettingEntity instance', () => {
            const result = service.buildSettingEntity(required, {}, {}, {}, {});
            expect(result).toBeInstanceOf(PSettingEntity);
        });

        it('should assign required fields', () => {
            const result = service.buildSettingEntity(required, {}, {}, {}, {});
            expect(result.label).toBe('My Setting');
            expect(result.createdBy).toBe(mockUser);
        });

        it('should assign basicSettings fields', () => {
            const result = service.buildSettingEntity(required, basicSettings, {}, {}, {});
            expect(result.taxRate).toBe(25);
            expect(result.occupancyRate).toBe(95);
        });

        it('should assign variablesExpenses fields', () => {
            const result = service.buildSettingEntity(required, {}, variablesExpenses, {}, {});
            expect(result.managementFees).toBe(10);
            expect(result.maintenanceEscrow).toBe(5);
            expect(result.cashReserves).toBe(3);
        });

        it('should assign targetLimits fields', () => {
            const result = service.buildSettingEntity(required, {}, {}, targetLimits, {});
            expect(result.capRate).toBe(6);
            expect(result.dscr).toBe(1.2);
            expect(result.roi).toBe(12);
            expect(result.payBackPeriod).toBe(10);
        });

        it('should assign cashFlowCriteria fields', () => {
            const result = service.buildSettingEntity(required, {}, {}, {}, cashFlowCriteria);
            expect(result.onePercent).toBe(true);
            expect(result.twoPercent).toBe(false);
            expect(result.fiftyPercent).toBe(true);
            expect(result.cashFlowAtLeast).toBe(200);
            expect(result.cashNeeded).toBe(50000);
        });

        it('should assign all fields together', () => {
            const result = service.buildSettingEntity(
                required,
                basicSettings,
                variablesExpenses,
                targetLimits,
                cashFlowCriteria,
            );
            expect(result.label).toBe('My Setting');
            expect(result.taxRate).toBe(25);
            expect(result.managementFees).toBe(10);
            expect(result.capRate).toBe(6);
            expect(result.onePercent).toBe(true);
        });

        it('should create a new instance each call', () => {
            const r1 = service.buildSettingEntity(required, {}, {}, {}, {});
            const r2 = service.buildSettingEntity(required, {}, {}, {}, {});
            expect(r1).not.toBe(r2);
        });

        it('should handle empty optional groups', () => {
            const result = service.buildSettingEntity(required, {}, {}, {}, {});
            expect(result.taxRate).toBeUndefined();
            expect(result.capRate).toBeUndefined();
            expect(result.onePercent).toBeUndefined();
        });
    });

    describe('retrieveSettingByCriteria', () => {
        it('should return setting when found', async () => {
            mockOtherUtils.formatCriteria.mockReturnValue('id=setting-123');
            mockPSettingRepository.findActiveOne.mockResolvedValue(mockSetting);

            const result = await service.retrieveSettingByCriteria({
                id: 'setting-123',
            });

            expect(mockLogger.info).toHaveBeenCalledWith(
                'Find a profile setting by id=setting-123',
            );
            expect(mockPSettingRepository.findActiveOne).toHaveBeenCalledWith(
                mockPSettingRepository,
                { id: 'setting-123' },
                undefined,
            );
            expect(result).toEqual(mockSetting);
        });

        it('should return setting with relations', async () => {
            mockOtherUtils.formatCriteria.mockReturnValue('id=setting-123');
            mockPSettingRepository.findActiveOne.mockResolvedValue(mockSetting);

            const result = await service.retrieveSettingByCriteria({ id: 'setting-123' }, [
                'createdBy',
            ]);

            expect(mockPSettingRepository.findActiveOne).toHaveBeenCalledWith(
                mockPSettingRepository,
                { id: 'setting-123' },
                ['createdBy'],
            );
            expect(result).toEqual(mockSetting);
        });

        it('should throw notFound when setting does not exist', async () => {
            mockOtherUtils.formatCriteria.mockReturnValue('id=missing');
            mockPSettingRepository.findActiveOne.mockResolvedValue(null);

            await expect(service.retrieveSettingByCriteria({ id: 'missing' })).rejects.toThrow(
                'Data not found with id=missing',
            );
            expect(mockErrorHandler.notFound).toHaveBeenCalledWith(
                'Data not found with id=missing',
                'Data not found',
            );
        });

        it('should throw notFound when findActiveOne returns undefined', async () => {
            mockOtherUtils.formatCriteria.mockReturnValue('id=missing');
            mockPSettingRepository.findActiveOne.mockResolvedValue(undefined);

            await expect(service.retrieveSettingByCriteria({ id: 'missing' })).rejects.toThrow();
        });
    });

    describe('updateSettingDetails', () => {
        it('should return "no updates" message when no updates provided', async () => {
            const result = await service.updateSettingDetails(mockSetting);
            expect(result).toEqual({
                message: 'No updates provided for settings',
            });
            expect(mockPSettingRepository.update).not.toHaveBeenCalled();
        });

        it('should return "no updates" message when empty object provided', async () => {
            const result = await service.updateSettingDetails(mockSetting, {});
            expect(result).toEqual({
                message: 'No updates provided for settings',
            });
            expect(mockPSettingRepository.update).not.toHaveBeenCalled();
        });

        it('should update label with trimming', async () => {
            mockPSettingRepository.update.mockResolvedValue({ affected: 1 });
            await service.updateSettingDetails(mockSetting, {
                label: '  New Label  ',
            });
            expect(mockPSettingRepository.update).toHaveBeenCalledWith(
                { id: mockSetting.id },
                { label: 'New Label' },
            );
        });

        it('should not update label when empty after trim', async () => {
            mockPSettingRepository.update.mockResolvedValue({ affected: 1 });
            await service.updateSettingDetails(mockSetting, { label: '   ' });
            expect(mockPSettingRepository.update).toHaveBeenCalledWith({ id: mockSetting.id }, {});
        });

        it('should update numeric fields', async () => {
            mockPSettingRepository.update.mockResolvedValue({ affected: 1 });
            await service.updateSettingDetails(mockSetting, {
                taxRate: 30,
                capRate: 7,
                roi: 15,
            });
            expect(mockPSettingRepository.update).toHaveBeenCalledWith(
                { id: mockSetting.id },
                { taxRate: 30, capRate: 7, roi: 15 },
            );
        });

        it('should update boolean fields', async () => {
            mockPSettingRepository.update.mockResolvedValue({ affected: 1 });
            await service.updateSettingDetails(mockSetting, {
                onePercent: true,
                twoPercent: false,
            });
            expect(mockPSettingRepository.update).toHaveBeenCalledWith(
                { id: mockSetting.id },
                { onePercent: true, twoPercent: false },
            );
        });

        it('should update all field categories together', async () => {
            mockPSettingRepository.update.mockResolvedValue({ affected: 1 });
            await service.updateSettingDetails(mockSetting, {
                label: 'Updated',
                taxRate: 20,
                onePercent: true,
                cashFlowAtLeast: 300,
            });
            expect(mockPSettingRepository.update).toHaveBeenCalledWith(
                { id: mockSetting.id },
                {
                    label: 'Updated',
                    taxRate: 20,
                    onePercent: true,
                    cashFlowAtLeast: 300,
                },
            );
        });

        it('should skip undefined numeric fields', async () => {
            mockPSettingRepository.update.mockResolvedValue({ affected: 1 });
            await service.updateSettingDetails(mockSetting, {
                taxRate: undefined,
                capRate: 5,
            });
            expect(mockPSettingRepository.update).toHaveBeenCalledWith(
                { id: mockSetting.id },
                { capRate: 5 },
            );
        });

        it('should update zero values (falsy but defined)', async () => {
            mockPSettingRepository.update.mockResolvedValue({ affected: 1 });
            await service.updateSettingDetails(mockSetting, {
                taxRate: 0,
                cashFlowAtLeast: 0,
            });
            expect(mockPSettingRepository.update).toHaveBeenCalledWith(
                { id: mockSetting.id },
                { taxRate: 0, cashFlowAtLeast: 0 },
            );
        });

        it('should return result from repository update', async () => {
            mockPSettingRepository.update.mockResolvedValue({ affected: 1 });
            const result = await service.updateSettingDetails(mockSetting, {
                taxRate: 25,
            });
            expect(result).toEqual({ affected: 1 });
        });
    });

    describe('ensureUniqueSettingLabel', () => {
        it('should pass when label is unique', async () => {
            mockPSettingRepository.assertUniqueActive.mockResolvedValue(undefined);
            await expect(service.ensureUniqueSettingLabel('Unique Label')).resolves.not.toThrow();
            expect(mockPSettingRepository.assertUniqueActive).toHaveBeenCalledWith(
                mockPSettingRepository,
                {},
                { label: 'Unique Label' },
                'Setting',
            );
        });

        it('should throw validation error when label already exists', async () => {
            mockPSettingRepository.assertUniqueActive.mockImplementation(
                (_repo: any, errors: Record<string, string>) => {
                    errors.label = 'Label already exists';
                },
            );

            await expect(service.ensureUniqueSettingLabel('Taken Label')).rejects.toThrow();
            expect(mockErrorHandler.validation).toHaveBeenCalledWith({
                label: 'Label already exists',
            });
        });

        it('should not throw when assertUniqueActive adds no errors', async () => {
            mockPSettingRepository.assertUniqueActive.mockResolvedValue(undefined);
            await expect(service.ensureUniqueSettingLabel('Free Label')).resolves.toBeUndefined();
        });
    });

    describe('ensureUniqueSettingLabelForUpdate', () => {
        it('should pass when label is unique for update', async () => {
            mockPSettingRepository.assertUniqueActive.mockResolvedValue(undefined);

            await expect(
                service.ensureUniqueSettingLabelForUpdate('New Label', mockSetting),
            ).resolves.not.toThrow();

            expect(mockPSettingRepository.assertUniqueActive).toHaveBeenCalledWith(
                mockPSettingRepository,
                {},
                { label: 'New Label' },
                'Setting',
                mockSetting.id,
            );
        });

        it('should throw validation error when another setting has the same label', async () => {
            mockPSettingRepository.assertUniqueActive.mockImplementation(
                (_repo: any, errors: Record<string, string>) => {
                    errors.label = 'Label already taken';
                },
            );

            await expect(
                service.ensureUniqueSettingLabelForUpdate('Taken', mockSetting),
            ).rejects.toThrow();

            expect(mockErrorHandler.validation).toHaveBeenCalledWith({
                label: 'Label already taken',
            });
        });

        it('should pass the setting id to exclude it from uniqueness check', async () => {
            mockPSettingRepository.assertUniqueActive.mockResolvedValue(undefined);
            await service.ensureUniqueSettingLabelForUpdate('Same Label', mockSetting);

            expect(mockPSettingRepository.assertUniqueActive).toHaveBeenCalledWith(
                expect.anything(),
                expect.anything(),
                expect.anything(),
                expect.anything(),
                'setting-123',
            );
        });
    });

    describe('getUserProfiles', () => {
        it('should return profiles for a user', async () => {
            const profiles = [mockSetting];
            mockPSettingRepository.find.mockResolvedValue(profiles);

            const result = await service.getUserProfiles('user-123');

            expect(mockPSettingRepository.find).toHaveBeenCalledWith({
                where: {
                    createdBy: { id: 'user-123' },
                    deleted: false,
                    isDefault: false,
                },
                relations: ['createdBy'],
            });
            expect(result).toEqual(profiles);
        });

        it('should return empty array when no profiles found', async () => {
            mockPSettingRepository.find.mockResolvedValue([]);

            const result = await service.getUserProfiles('user-456');

            expect(result).toEqual([]);
        });

        it('should call transformPSettingService.profileEntities for relations', async () => {
            mockPSettingRepository.find.mockResolvedValue([]);
            await service.getUserProfiles('user-123');
            expect(mockTransformPSettingService.profileEntities).toHaveBeenCalled();
        });

        it('should exclude deleted and default profiles', async () => {
            mockPSettingRepository.find.mockResolvedValue([]);
            await service.getUserProfiles('user-123');

            const callArg = mockPSettingRepository.find.mock.calls[0][0];
            expect(callArg.where.deleted).toBe(false);
            expect(callArg.where.isDefault).toBe(false);
        });
    });

    describe('getDefaultUserProfile', () => {
        it('should return user-specific default profile when found', async () => {
            const defaultProfile = {
                ...mockSetting,
                isDefault: true,
            } as PSettingEntity;
            mockPSettingRepository.findOne.mockResolvedValueOnce(defaultProfile);

            const result = await service.getDefaultUserProfile('user-123');

            expect(mockPSettingRepository.findOne).toHaveBeenCalledTimes(1);
            expect(mockPSettingRepository.findOne).toHaveBeenCalledWith({
                where: {
                    isDefault: true,
                    createdBy: { id: 'user-123' },
                    deleted: false,
                },
                relations: ['createdBy'],
            });
            expect(result).toEqual(defaultProfile);
        });

        it('should fall back to global default profile when user-specific not found', async () => {
            const globalDefault = {
                ...mockSetting,
                isDefault: true,
            } as PSettingEntity;
            mockPSettingRepository.findOne
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(globalDefault);

            const result = await service.getDefaultUserProfile('user-123');

            expect(mockPSettingRepository.findOne).toHaveBeenCalledTimes(2);
            expect(mockPSettingRepository.findOne).toHaveBeenNthCalledWith(2, {
                where: { isDefault: true, deleted: false },
                relations: ['createdBy'],
            });
            expect(result).toEqual(globalDefault);
        });

        it('should throw notFound when neither user nor global default exists', async () => {
            mockPSettingRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

            await expect(service.getDefaultUserProfile('user-123')).rejects.toThrow(
                'Default profile setting not found for user user-123',
            );
            expect(mockErrorHandler.notFound).toHaveBeenCalledWith(
                'Default profile setting not found for user user-123',
                'Default profile setting not found',
            );
        });

        it('should use profileEntities relations for both findOne calls', async () => {
            const globalDefault = {
                ...mockSetting,
                isDefault: true,
            } as PSettingEntity;
            mockPSettingRepository.findOne
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(globalDefault);

            await service.getDefaultUserProfile('user-123');

            expect(mockTransformPSettingService.profileEntities).toHaveBeenCalledTimes(2);
        });

        it('should not call second findOne when first returns a profile', async () => {
            const userDefault = {
                ...mockSetting,
                isDefault: true,
            } as PSettingEntity;
            mockPSettingRepository.findOne.mockResolvedValueOnce(userDefault);

            await service.getDefaultUserProfile('user-123');

            expect(mockPSettingRepository.findOne).toHaveBeenCalledTimes(1);
        });
    });
});
