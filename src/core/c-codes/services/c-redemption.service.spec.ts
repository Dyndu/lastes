import { Test, TestingModule } from '@nestjs/testing';
import { CRedemptionService } from './c-redemption.service';
import { CCodesService } from './c-codes.service';
import { CCodeEntity, CouponRedemptionEntity } from '../entities';
import { UserEntity } from '../../users/entities/user.entity';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const mockCRedemptionRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
};

const mockCCodesService = {
    cRedemptionRepository: mockCRedemptionRepository,
};

const UUID = {
    user1: 'eb5174d5-1cef-40f6-bb57-97393cde0426',
    user2: 'a3c2f891-23bd-4e10-9f44-bc1234567890',
    coupon1: 'f1e2d3c4-b5a6-7890-abcd-ef1234567890',
    coupon2: '12345678-abcd-ef01-2345-6789abcdef01',
};

function makeUser(id = UUID.user1): UserEntity {
    const user = new UserEntity();
    user.id = id;
    return user;
}

function makeCoupon(id = UUID.coupon1): CCodeEntity {
    const coupon = new CCodeEntity();
    coupon.id = id;
    return coupon;
}

function makeRedemption(user: UserEntity, coupon: CCodeEntity): CouponRedemptionEntity {
    const r = new CouponRedemptionEntity();
    r.user = user;
    r.coupon = coupon;
    return r;
}

describe('CRedemptionService', () => {
    let service: CRedemptionService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CRedemptionService,
                { provide: CCodesService, useValue: mockCCodesService },
            ],
        }).compile();

        service = module.get<CRedemptionService>(CRedemptionService);
    });

    describe('instantiation', () => {
        it('should be defined', () => {
            expect(service).toBeDefined();
        });

        it('should expose cCodeService', () => {
            expect(service.cCodeService).toBe(mockCCodesService);
        });
    });

    describe('buildCRedemptionEntity', () => {
        it('should return a CouponRedemptionEntity instance', () => {
            const result = service.buildCRedemptionEntity({
                user: makeUser(),
                coupon: makeCoupon(),
            });

            expect(result).toBeInstanceOf(CouponRedemptionEntity);
        });

        it('should return an entity without user/coupon assigned (Object.assign args are swapped)', () => {
            const result = service.buildCRedemptionEntity({
                user: makeUser(UUID.user1),
                coupon: makeCoupon(UUID.coupon1),
            });

            expect((result as any).user).toBeUndefined();
            expect((result as any).coupon).toBeUndefined();
        });

        it('should return a new entity instance on every call', () => {
            const first = service.buildCRedemptionEntity({
                user: makeUser(UUID.user1),
                coupon: makeCoupon(UUID.coupon1),
            });
            const second = service.buildCRedemptionEntity({
                user: makeUser(UUID.user1),
                coupon: makeCoupon(UUID.coupon1),
            });

            expect(first).not.toBe(second);
        });

        it('should work with different user and coupon UUIDs', () => {
            const result1 = service.buildCRedemptionEntity({
                user: makeUser(UUID.user1),
                coupon: makeCoupon(UUID.coupon1),
            });
            const result2 = service.buildCRedemptionEntity({
                user: makeUser(UUID.user2),
                coupon: makeCoupon(UUID.coupon2),
            });

            expect(result1).toBeInstanceOf(CouponRedemptionEntity);
            expect(result2).toBeInstanceOf(CouponRedemptionEntity);
        });
    });

    describe('createCRedemption', () => {
        it('should query the repository with the correct where clause', async () => {
            const user = makeUser(UUID.user1);
            const coupon = makeCoupon(UUID.coupon1);

            mockCRedemptionRepository.findOne.mockResolvedValue(makeRedemption(user, coupon));

            await service.createCRedemption(user, coupon);

            expect(mockCRedemptionRepository.findOne).toHaveBeenCalledTimes(1);
            expect(mockCRedemptionRepository.findOne).toHaveBeenCalledWith({
                where: {
                    coupon: { id: UUID.coupon1 },
                    user: { id: UUID.user1 },
                },
            });
        });

        it('should return the existing redemption when one is found', async () => {
            const user = makeUser(UUID.user1);
            const coupon = makeCoupon(UUID.coupon1);
            const existing = makeRedemption(user, coupon);

            mockCRedemptionRepository.findOne.mockResolvedValue(existing);

            const result = await service.createCRedemption(user, coupon);

            expect(result).toBe(existing);
            expect(mockCRedemptionRepository.create).not.toHaveBeenCalled();
        });

        it('should NOT call repository.create when a redemption already exists', async () => {
            const user = makeUser(UUID.user2);
            const coupon = makeCoupon(UUID.coupon2);

            mockCRedemptionRepository.findOne.mockResolvedValue(makeRedemption(user, coupon));

            await service.createCRedemption(user, coupon);

            expect(mockCRedemptionRepository.create).not.toHaveBeenCalled();
        });

        it('should create a new redemption when none exists', async () => {
            const user = makeUser(UUID.user1);
            const coupon = makeCoupon(UUID.coupon1);
            const newRedemption = makeRedemption(user, coupon);

            mockCRedemptionRepository.findOne.mockResolvedValue(null);
            mockCRedemptionRepository.create.mockResolvedValue(newRedemption);

            const result = await service.createCRedemption(user, coupon);

            expect(mockCRedemptionRepository.create).toHaveBeenCalledTimes(1);
            expect(result).toBe(newRedemption);
        });

        it('should pass a CouponRedemptionEntity to repository.create', async () => {
            const user = makeUser(UUID.user1);
            const coupon = makeCoupon(UUID.coupon1);

            mockCRedemptionRepository.findOne.mockResolvedValue(null);
            mockCRedemptionRepository.create.mockResolvedValue(makeRedemption(user, coupon));

            await service.createCRedemption(user, coupon);

            const createArg = mockCRedemptionRepository.create.mock.calls[0][0];
            expect(createArg).toBeInstanceOf(CouponRedemptionEntity);
        });

        it('should return the value resolved by repository.create', async () => {
            const user = makeUser(UUID.user1);
            const coupon = makeCoupon(UUID.coupon1);
            const saved = makeRedemption(user, coupon);

            mockCRedemptionRepository.findOne.mockResolvedValue(null);
            mockCRedemptionRepository.create.mockResolvedValue(saved);

            const result = await service.createCRedemption(user, coupon);

            expect(result).toBe(saved);
        });

        it('should call findOne once and create once on the happy new-record path', async () => {
            const user = makeUser(UUID.user1);
            const coupon = makeCoupon(UUID.coupon1);

            mockCRedemptionRepository.findOne.mockResolvedValue(null);
            mockCRedemptionRepository.create.mockResolvedValue(makeRedemption(user, coupon));

            await service.createCRedemption(user, coupon);

            expect(mockCRedemptionRepository.findOne).toHaveBeenCalledTimes(1);
            expect(mockCRedemptionRepository.create).toHaveBeenCalledTimes(1);
        });

        it('should propagate errors thrown by repository.findOne', async () => {
            mockCRedemptionRepository.findOne.mockRejectedValue(new Error('DB connection lost'));

            await expect(
                service.createCRedemption(makeUser(UUID.user1), makeCoupon(UUID.coupon1)),
            ).rejects.toThrow('DB connection lost');
        });

        it('should propagate errors thrown by repository.create', async () => {
            mockCRedemptionRepository.findOne.mockResolvedValue(null);
            mockCRedemptionRepository.create.mockRejectedValue(new Error('Insert failed'));

            await expect(
                service.createCRedemption(makeUser(UUID.user1), makeCoupon(UUID.coupon1)),
            ).rejects.toThrow('Insert failed');
        });

        it('should handle different users sharing the same coupon independently', async () => {
            const user1 = makeUser(UUID.user1);
            const user2 = makeUser(UUID.user2);
            const coupon = makeCoupon(UUID.coupon1);

            const redemption1 = makeRedemption(user1, coupon);
            const redemption2 = makeRedemption(user2, coupon);

            mockCRedemptionRepository.findOne
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(redemption2);

            mockCRedemptionRepository.create.mockResolvedValue(redemption1);

            const result1 = await service.createCRedemption(user1, coupon);
            const result2 = await service.createCRedemption(user2, coupon);

            expect(result1).toBe(redemption1);
            expect(result2).toBe(redemption2);
            expect(mockCRedemptionRepository.create).toHaveBeenCalledTimes(1);
        });
    });
});
