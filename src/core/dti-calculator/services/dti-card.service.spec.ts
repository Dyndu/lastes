import { Test, TestingModule } from '@nestjs/testing';
import { DtiCardService } from './dti-card.service';
import { DtiCalculatorService } from './dti-calculator.service';
import { CardTypeEnum } from '../../../common/enum';
import { DtiCardEntity, DtiCalculatorEntity } from '../entities';
import { UpdateDtiCardDto } from '../dto';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const mockCalculatorService = {
    cardSecret: 'test-secret',
    logger: { info: jest.fn() },
    errorHandler: {
        badRequest: jest.fn().mockImplementation((msg) => {
            throw new Error(msg);
        }),
        notFound: jest.fn().mockImplementation((msg) => {
            throw new Error(msg);
        }),
        conflict: jest.fn().mockImplementation((msg) => {
            throw new Error(msg);
        }),
    },
    otherUtils: {
        formatCriteria: jest.fn().mockReturnValue('id=123'),
    },
    dtiCardRepo: {
        findOne: jest.fn(),
        findActiveOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
};

describe('DtiCardService', () => {
    let service: DtiCardService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DtiCardService,
                { provide: DtiCalculatorService, useValue: mockCalculatorService },
            ],
        }).compile();

        service = module.get<DtiCardService>(DtiCardService);
    });

    describe('fingerprint()', () => {
        it('should return a hex string', () => {
            const result = service.fingerprint('4111111111111111', 'secret');
            expect(typeof result).toBe('string');
            expect(result).toMatch(/^[a-f0-9]{64}$/);
        });

        it('should strip non-digit characters before hashing', () => {
            const a = service.fingerprint('4111-1111-1111-1111', 'secret');
            const b = service.fingerprint('4111111111111111', 'secret');
            expect(a).toBe(b);
        });

        it('should produce different results for different PANs', () => {
            const a = service.fingerprint('4111111111111111', 'secret');
            const b = service.fingerprint('5500000000000004', 'secret');
            expect(a).not.toBe(b);
        });
    });

    describe('isValidCard()', () => {
        it('should return true for a valid Luhn number', () => {
            expect(service.isValidCard('4111111111111111')).toBe(true);
        });

        it('should return false for an invalid Luhn number', () => {
            expect(service.isValidCard('4111111111111112')).toBe(false);
        });

        it('should return false if length < 13', () => {
            expect(service.isValidCard('411111111111')).toBe(false);
        });

        it('should return false if length > 19', () => {
            expect(service.isValidCard('41111111111111111111')).toBe(false);
        });

        it('should handle dashes and spaces gracefully', () => {
            expect(service.isValidCard('4111-1111-1111-1111')).toBe(true);
        });
    });

    describe('isValidExpiry()', () => {
        it('should return true for a future expiry MM/YYYY', () => {
            const future = `12/${new Date().getFullYear() + 2}`;
            expect(service.isValidExpiry(future)).toBe(true);
        });

        it('should return true for a future expiry MM/YY', () => {
            const year = String(new Date().getFullYear() + 2).slice(-2);
            expect(service.isValidExpiry(`12/${year}`)).toBe(true);
        });

        it('should return false for a past expiry', () => {
            expect(service.isValidExpiry('01/2000')).toBe(false);
        });

        it('should return false for invalid format', () => {
            expect(service.isValidExpiry('2027-12')).toBe(false);
        });

        it('should return false for invalid month 00', () => {
            expect(service.isValidExpiry('00/2030')).toBe(false);
        });

        it('should return false for invalid month 13', () => {
            expect(service.isValidExpiry('13/2030')).toBe(false);
        });
    });

    describe('detectBrand()', () => {
        it('should detect VISA', () => {
            expect(service.detectBrand('4111111111111111')).toBe(CardTypeEnum.VISA);
        });

        it('should detect MASTERCARD (51-55)', () => {
            expect(service.detectBrand('5500000000000004')).toBe(CardTypeEnum.MASTERCARD);
        });

        it('should detect MASTERCARD (2221+)', () => {
            expect(service.detectBrand('2221000000000009')).toBe(CardTypeEnum.MASTERCARD);
        });

        it('should detect AMEX', () => {
            expect(service.detectBrand('378282246310005')).toBe(CardTypeEnum.AMEX);
        });

        it('should detect DISCOVER', () => {
            expect(service.detectBrand('6011111111111117')).toBe(CardTypeEnum.DISCOVER);
        });

        it('should call badRequest for unknown card type', () => {
            expect(() => service.detectBrand('9999999999999999')).toThrow();
            expect(mockCalculatorService.errorHandler.badRequest).toHaveBeenCalled();
        });
    });

    describe('prepareCardData()', () => {
        const futureExpiry = `12/${new Date().getFullYear() + 2}`;

        it('should return card data for valid inputs', () => {
            const result = service.prepareCardData('4111111111111111', futureExpiry, 'secret');
            expect(result.last4).toBe('1111');
            expect(result.brand).toBe(CardTypeEnum.VISA);
            expect(result.expiry).toBe(futureExpiry);
            expect(result.fingerprint).toBeDefined();
        });

        it('should throw if expiry is invalid', () => {
            expect(() =>
                service.prepareCardData('4111111111111111', '01/2000', 'secret'),
            ).toThrow();
            expect(mockCalculatorService.errorHandler.badRequest).toHaveBeenCalled();
        });

        it('should throw if card number is invalid', () => {
            expect(() =>
                service.prepareCardData('4111111111111112', futureExpiry, 'secret'),
            ).toThrow();
            expect(mockCalculatorService.errorHandler.badRequest).toHaveBeenCalled();
        });
    });

    describe('buildDtiCardEntity()', () => {
        it('should return a DtiCardEntity with correct fields', () => {
            const calculator = new DtiCalculatorEntity();
            const result = service.buildDtiCardEntity({
                last4: '1111',
                brand: CardTypeEnum.VISA,
                fingerprint: 'abc',
                expiry: '12/2027',
                amount: 100,
                calculator,
            });
            expect(result).toBeInstanceOf(DtiCardEntity);
            expect(result.last4).toBe('1111');
            expect(result.brand).toBe(CardTypeEnum.VISA);
            expect(result.amount).toBe(100);
        });
    });

    describe('retrieveCardByCriteria()', () => {
        it('should return the card when found', async () => {
            const card = new DtiCardEntity();
            card.id = 'card-1';
            mockCalculatorService.dtiCardRepo.findActiveOne.mockResolvedValueOnce(card);

            const result = await service.retrieveCardByCriteria({ id: 'card-1' });
            expect(result).toBe(card);
        });

        it('should throw notFound when card does not exist', async () => {
            mockCalculatorService.dtiCardRepo.findActiveOne.mockResolvedValueOnce(null);

            await expect(service.retrieveCardByCriteria({ id: 'missing' })).rejects.toThrow();
            expect(mockCalculatorService.errorHandler.notFound).toHaveBeenCalled();
        });

        it('should pass relations to the repo', async () => {
            const card = new DtiCardEntity();
            mockCalculatorService.dtiCardRepo.findActiveOne.mockResolvedValueOnce(card);

            await service.retrieveCardByCriteria({ id: 'card-1' }, ['calculator']);
            expect(mockCalculatorService.dtiCardRepo.findActiveOne).toHaveBeenCalledWith(
                mockCalculatorService.dtiCardRepo,
                { id: 'card-1' },
                ['calculator'],
            );
        });
    });

    describe('createDtiCard()', () => {
        const futureExpiry = `12/${new Date().getFullYear() + 2}`;
        const pan = '4111111111111111';

        it('should create and return a new card', async () => {
            const calculator = new DtiCalculatorEntity();
            calculator.id = 'calc-1';

            mockCalculatorService.dtiCardRepo.findOne.mockResolvedValueOnce(null);
            const created = new DtiCardEntity();
            mockCalculatorService.dtiCardRepo.create.mockResolvedValueOnce(created);

            const result = await service.createDtiCard(calculator, pan, futureExpiry, 200);
            expect(result).toBe(created);
            expect(mockCalculatorService.dtiCardRepo.create).toHaveBeenCalled();
        });

        it('should throw conflict if fingerprint already exists', async () => {
            const calculator = new DtiCalculatorEntity();
            calculator.id = 'calc-1';

            const existing = new DtiCardEntity();
            existing.id = 'existing-card';
            mockCalculatorService.dtiCardRepo.findOne.mockResolvedValueOnce(existing);

            await expect(
                service.createDtiCard(calculator, pan, futureExpiry, 200),
            ).rejects.toThrow();
            expect(mockCalculatorService.errorHandler.conflict).toHaveBeenCalled();
        });

        it('should throw if card data is invalid', async () => {
            const calculator = new DtiCalculatorEntity();
            calculator.id = 'calc-1';

            await expect(service.createDtiCard(calculator, pan, '01/2000', 200)).rejects.toThrow();
        });
    });

    describe('updateCardEntity()', () => {
        it('should return early message when no itemized provided', async () => {
            const card = new DtiCardEntity();
            const result = await service.updateCardEntity(card, undefined);
            expect(result).toEqual({ message: 'No updates provided for card details' });
        });

        it('should return early message when empty object provided', async () => {
            const card = new DtiCardEntity();
            const result = await service.updateCardEntity(card, {});
            expect(result).toEqual({ message: 'No updates provided for card details' });
        });

        it('should call repo.update with trimmed fields', async () => {
            const card = new DtiCardEntity();
            card.id = 'card-1';
            mockCalculatorService.dtiCardRepo.update.mockResolvedValueOnce({ affected: 1 });

            await service.updateCardEntity(card, {
                pan: '  4111  ',
                expiry: '12/2027',
                amount: 50,
            });
            expect(mockCalculatorService.dtiCardRepo.update).toHaveBeenCalledWith(
                { id: 'card-1' },
                expect.objectContaining({ pan: '4111', expiry: '12/2027', amount: 50 }),
            );
        });

        it('should skip fields with empty strings', async () => {
            const card = new DtiCardEntity();
            card.id = 'card-1';
            mockCalculatorService.dtiCardRepo.update.mockResolvedValueOnce({ affected: 1 });

            await service.updateCardEntity(card, { pan: '', amount: 100 });
            const [[, payload]] = mockCalculatorService.dtiCardRepo.update.mock.calls;
            expect(payload).not.toHaveProperty('pan');
            expect(payload).toHaveProperty('amount', 100);
        });
    });

    describe('updateCard()', () => {
        const buildCard = (overrides = {}): DtiCardEntity => {
            const card = new DtiCardEntity();
            const calculator = new DtiCalculatorEntity();
            calculator.id = 'calc-1';
            Object.assign(card, {
                id: 'card-1',
                last4: '1111',
                fingerprint: 'old-fingerprint',
                calculator,
                ...overrides,
            });
            return card;
        };

        it('should retrieve the card and update amount', async () => {
            const card = buildCard();
            mockCalculatorService.dtiCardRepo.findActiveOne.mockResolvedValueOnce(card);
            mockCalculatorService.dtiCardRepo.update.mockResolvedValueOnce({ affected: 1 });

            const dto: UpdateDtiCardDto = { amount: 300 };
            await service.updateCard('card-1', dto);

            expect(mockCalculatorService.dtiCardRepo.findActiveOne).toHaveBeenCalled();
            expect(mockCalculatorService.dtiCardRepo.update).toHaveBeenCalledWith(
                { id: 'card-1' },
                expect.objectContaining({ amount: 300 }),
            );
        });

        it('should throw if card not found', async () => {
            mockCalculatorService.dtiCardRepo.findActiveOne.mockResolvedValueOnce(null);

            await expect(service.updateCard('missing-id', { amount: 100 })).rejects.toThrow();
            expect(mockCalculatorService.errorHandler.notFound).toHaveBeenCalled();
        });

        it('should pass amount = 0 correctly', async () => {
            const card = buildCard();
            mockCalculatorService.dtiCardRepo.findActiveOne.mockResolvedValueOnce(card);
            mockCalculatorService.dtiCardRepo.update.mockResolvedValueOnce({ affected: 1 });

            await service.updateCard('card-1', { amount: 0 });

            expect(mockCalculatorService.dtiCardRepo.update).toHaveBeenCalledWith(
                { id: 'card-1' },
                expect.objectContaining({ amount: 0 }),
            );
        });
    });

    describe('deleteCardEntity()', () => {
        it('should delete the card when found', async () => {
            const card = new DtiCardEntity();
            card.id = 'card-1';
            mockCalculatorService.dtiCardRepo.findActiveOne.mockResolvedValueOnce(card);
            mockCalculatorService.dtiCardRepo.delete.mockResolvedValueOnce({ affected: 1 });

            await service.deleteCardEntity('card-1');
            expect(mockCalculatorService.dtiCardRepo.delete).toHaveBeenCalledWith({ id: 'card-1' });
        });

        it('should throw notFound when card does not exist', async () => {
            mockCalculatorService.dtiCardRepo.findActiveOne.mockResolvedValueOnce(null);

            await expect(service.deleteCardEntity('missing-id')).rejects.toThrow();
            expect(mockCalculatorService.errorHandler.notFound).toHaveBeenCalled();
        });
    });
});
