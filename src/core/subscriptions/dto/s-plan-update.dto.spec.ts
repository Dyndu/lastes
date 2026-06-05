import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { SPlanUpdateDto } from './s-plan-update.dto';

describe('SPlanUpdateDto', () => {
    const validate$ = (plain: object) => validate(plainToInstance(SPlanUpdateDto, plain));

    it('should pass with both prices provided', async () => {
        const errors = await validate$({ monthlyPrice: 3200, yearlyPrice: 32000 });
        expect(errors).toHaveLength(0);
    });

    it('should pass with only monthlyPrice', async () => {
        const errors = await validate$({ monthlyPrice: 3200 });
        expect(errors).toHaveLength(0);
    });

    it('should pass with only yearlyPrice', async () => {
        const errors = await validate$({ yearlyPrice: 32000 });
        expect(errors).toHaveLength(0);
    });

    it('should pass with empty object (both optional)', async () => {
        const errors = await validate$({});
        expect(errors).toHaveLength(0);
    });

    it('should fail when monthlyPrice is negative', async () => {
        const errors = await validate$({ monthlyPrice: -1 });
        const prop = errors.find((e) => e.property === 'monthlyPrice');
        expect(prop).toBeDefined();
    });

    it('should fail when yearlyPrice is negative', async () => {
        const errors = await validate$({ yearlyPrice: -100 });
        const prop = errors.find((e) => e.property === 'yearlyPrice');
        expect(prop).toBeDefined();
    });

    it('should fail when monthlyPrice is not a number', async () => {
        const errors = await validate$({ monthlyPrice: 'abc' });
        const prop = errors.find((e) => e.property === 'monthlyPrice');
        expect(prop).toBeDefined();
    });

    it('should fail when yearlyPrice is not a number', async () => {
        const errors = await validate$({ yearlyPrice: 'abc' });
        const prop = errors.find((e) => e.property === 'yearlyPrice');
        expect(prop).toBeDefined();
    });

    it('should pass with price equal to 0 (min boundary)', async () => {
        const errors = await validate$({ monthlyPrice: 0, yearlyPrice: 0 });
        expect(errors).toHaveLength(0);
    });

    it('should fail when monthlyPrice has more than 2 decimal places', async () => {
        const errors = await validate$({ monthlyPrice: 10.123 });
        const prop = errors.find((e) => e.property === 'monthlyPrice');
        expect(prop).toBeDefined();
    });
});
