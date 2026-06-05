import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { SPlanUpdateDto } from './dto/s-plan-update.dto';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';

describe('SubscriptionController', () => {
    let controller: SubscriptionController;
    let service: jest.Mocked<SubscriptionService>;

    const VALID_UUID = '30ac88d4-7ffe-418c-9551-66eeec2e6783';

    const mockEnvConfigService = {
        sAdminRole: 'superadmin',
        adminRole: 'admin',
        userRole: 'user',
        supportRole: 'support',
    };

    const mockPlan = {
        id: VALID_UUID,
        monthlyPrice: 3200,
        yearlyPrice: 32000,
    };

    const mockErrorHandlerService = {
        forbidden: jest.fn((_message, userMessage) => {
            throw new Error(userMessage);
        }),
    };

    beforeEach(async () => {
        service = {
            retrieveSPlansByCriteria: jest.fn(),
            updateSPlans: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            controllers: [SubscriptionController],
            providers: [
                { provide: SubscriptionService, useValue: service },
                {
                    provide: EnvConfigService,
                    useValue: mockEnvConfigService,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
            ],
        }).compile();

        controller = module.get<SubscriptionController>(SubscriptionController);
    });

    afterEach(() => jest.clearAllMocks());

    describe('findOne()', () => {
        it('should call service.retrieveSPlansByCriteria with the correct id', async () => {
            service.retrieveSPlansByCriteria.mockResolvedValue(mockPlan);

            const result = await controller.findOne(VALID_UUID);

            expect(service.retrieveSPlansByCriteria).toHaveBeenCalledWith({ id: VALID_UUID });
            expect(result).toEqual(mockPlan);
        });

        it('should propagate errors thrown by the service', async () => {
            service.retrieveSPlansByCriteria.mockRejectedValue(new Error('Not found'));

            await expect(controller.findOne(VALID_UUID)).rejects.toThrow('Not found');
        });
    });

    describe('updateSubscription()', () => {
        it('should call service.updateSPlans with the correct id and dto', async () => {
            const dto: SPlanUpdateDto = { monthlyPrice: 5000, yearlyPrice: 50000 };
            service.updateSPlans.mockResolvedValue({ message: 'Code updated successfully.' });

            const result = await controller.updateSubscription(VALID_UUID, dto);

            expect(service.updateSPlans).toHaveBeenCalledWith(VALID_UUID, dto);
            expect(result).toEqual({ message: 'Code updated successfully.' });
        });

        it('should work with a partial dto (only monthlyPrice)', async () => {
            const dto: SPlanUpdateDto = { monthlyPrice: 4000 };
            service.updateSPlans.mockResolvedValue({ message: 'Code updated successfully.' });

            await controller.updateSubscription(VALID_UUID, dto);

            expect(service.updateSPlans).toHaveBeenCalledWith(VALID_UUID, dto);
        });

        it('should work with an empty dto', async () => {
            const dto: SPlanUpdateDto = {};
            service.updateSPlans.mockResolvedValue({ message: 'Code updated successfully.' });

            await controller.updateSubscription(VALID_UUID, dto);

            expect(service.updateSPlans).toHaveBeenCalledWith(VALID_UUID, dto);
        });

        it('should propagate errors thrown by the service', async () => {
            service.updateSPlans.mockRejectedValue(new Error('Update failed'));

            await expect(controller.updateSubscription(VALID_UUID, {})).rejects.toThrow(
                'Update failed',
            );
        });
    });
});
