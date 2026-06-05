import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateDtiCardDto } from './update-dti-card.dto';

describe('UpdateDtiCardDto', () => {
    const build = (overrides = {}) => plainToInstance(UpdateDtiCardDto, { ...overrides });

    describe('amount is optional', () => {
        it('should pass with empty object', async () => {
            const errors = await validate(build());
            expect(errors).toHaveLength(0);
        });

        it('should pass with a valid amount', async () => {
            const errors = await validate(build({ amount: 250 }));
            expect(errors).toHaveLength(0);
        });

        it('should pass with amount = 0', async () => {
            const errors = await validate(build({ amount: 0 }));
            expect(errors).toHaveLength(0);
        });

        it('should pass with decimal amount', async () => {
            const errors = await validate(build({ amount: 12.5 }));
            expect(errors).toHaveLength(0);
        });
    });

    describe('amount validation (when provided)', () => {
        it('should fail when amount is negative', async () => {
            const errors = await validate(build({ amount: -50 }));
            expect(errors.some((e) => e.property === 'amount')).toBe(true);
        });

        it('should fail when amount is not a number', async () => {
            const errors = await validate(build({ amount: 'not-a-number' }));
            expect(errors.some((e) => e.property === 'amount')).toBe(true);
        });
    });

    describe('unknown fields ignored', () => {
        it('should ignore code and expiry if passed', async () => {
            const errors = await validate(
                build({ code: 'somevalue', expiry: '12/2027', amount: 100 }),
            );
            expect(errors).toHaveLength(0);
        });
    });
});
