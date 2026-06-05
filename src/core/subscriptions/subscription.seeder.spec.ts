import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { SubscriptionSeeder } from './subscription.seeder';
import { SubscriptionRepository } from './subscription.repository';
import { EnvConfigService } from '../../utils/services/config';
import { SubscriptionEntity } from './entities/subscription.entity';

jest.mock('./entities/subscription.entity');

describe('SubscriptionSeeder', () => {
    let seeder: SubscriptionSeeder;
    let logger: { info: jest.Mock; warn: jest.Mock };
    let repository: { findOne: jest.Mock; create: jest.Mock };
    let envConfigService: { monthlySPrice: any; yearlySPrice: any };

    beforeEach(async () => {
        jest.clearAllMocks();

        logger = { info: jest.fn(), warn: jest.fn() };
        repository = { findOne: jest.fn(), create: jest.fn() };
        envConfigService = { monthlySPrice: 3200, yearlySPrice: 32000 };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SubscriptionSeeder,
                { provide: WINSTON_MODULE_PROVIDER, useValue: logger },
                { provide: SubscriptionRepository, useValue: repository },
                { provide: EnvConfigService, useValue: envConfigService },
            ],
        }).compile();

        seeder = module.get<SubscriptionSeeder>(SubscriptionSeeder);
    });

    describe('seed()', () => {
        it('should always log the start message', async () => {
            repository.findOne.mockResolvedValue({});

            await seeder.seed();

            expect(logger.info).toHaveBeenCalledWith('Seeding default subscription plan prices...');
        });

        it('should warn and return early when both prices are undefined', async () => {
            envConfigService.monthlySPrice = undefined;
            envConfigService.yearlySPrice = undefined;

            await seeder.seed();

            expect(logger.warn).toHaveBeenCalledWith(
                'No valid subscription plan prices to seed. Check your environment variables.',
            );
            expect(repository.findOne).not.toHaveBeenCalled();
            expect(repository.create).not.toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalledTimes(1);
        });

        it('should warn and return early when both prices are null', async () => {
            envConfigService.monthlySPrice = null;
            envConfigService.yearlySPrice = null;

            await seeder.seed();

            expect(logger.warn).toHaveBeenCalledWith(
                'No valid subscription plan prices to seed. Check your environment variables.',
            );
            expect(repository.findOne).not.toHaveBeenCalled();
        });

        it('should warn and return early when both prices are 0 (falsy)', async () => {
            envConfigService.monthlySPrice = 0;
            envConfigService.yearlySPrice = 0;

            await seeder.seed();

            expect(logger.warn).toHaveBeenCalledWith(
                'No valid subscription plan prices to seed. Check your environment variables.',
            );
            expect(repository.findOne).not.toHaveBeenCalled();
        });

        it('should log already seeded and NOT call create when data already exists in DB', async () => {
            repository.findOne.mockResolvedValue({ id: 'existing-uuid' });

            await seeder.seed();

            expect(repository.findOne).toHaveBeenCalledWith({ where: { deleted: false } });
            expect(logger.info).toHaveBeenCalledWith(
                'Subscriptions plan prices are already seeded',
            );
            expect(repository.create).not.toHaveBeenCalled();
        });

        it('should log the final message when data already exists', async () => {
            repository.findOne.mockResolvedValue({ id: 'existing-uuid' });

            await seeder.seed();

            expect(logger.info).toHaveBeenCalledWith(
                'All subscription plan prices already exist, nothing to seed.',
            );
        });

        it('should create a new SubscriptionEntity with data[0] and data[1] when no data exists', async () => {
            repository.findOne.mockResolvedValue(null);
            repository.create.mockResolvedValue(undefined);

            const mockInstance = { monthlyPrice: undefined, yearlyPrice: undefined };
            (SubscriptionEntity as jest.Mock).mockImplementation(() => mockInstance);

            await seeder.seed();

            expect(SubscriptionEntity).toHaveBeenCalledTimes(1);

            expect(mockInstance.monthlyPrice).toBe(3200);
            expect(mockInstance.yearlyPrice).toBe(32000);

            expect(repository.create).toHaveBeenCalledWith(mockInstance);
        });

        it('should set yearlyPrice to undefined (data[1]) when only monthlyPrice is provided', async () => {
            envConfigService.monthlySPrice = 3200;
            envConfigService.yearlySPrice = undefined;

            repository.findOne.mockResolvedValue(null);
            repository.create.mockResolvedValue(undefined);

            const mockInstance = { monthlyPrice: undefined, yearlyPrice: undefined };
            (SubscriptionEntity as jest.Mock).mockImplementation(() => mockInstance);

            await seeder.seed();

            expect(mockInstance.monthlyPrice).toBe(3200);
            expect(mockInstance.yearlyPrice).toBeUndefined();
            expect(repository.create).toHaveBeenCalledWith(mockInstance);
        });

        it('should log the final message after creating the entity', async () => {
            repository.findOne.mockResolvedValue(null);
            repository.create.mockResolvedValue(undefined);
            (SubscriptionEntity as jest.Mock).mockImplementation(() => ({}));

            await seeder.seed();

            expect(logger.info).toHaveBeenCalledWith(
                'All subscription plan prices already exist, nothing to seed.',
            );
        });

        it('should call findOne with correct where clause', async () => {
            repository.findOne.mockResolvedValue({});

            await seeder.seed();

            expect(repository.findOne).toHaveBeenCalledWith({ where: { deleted: false } });
        });
    });
});
