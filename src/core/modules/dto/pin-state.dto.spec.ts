import { validate } from 'class-validator';
import { PinStateDto } from './pin-state.dto';

describe('PinStateDto', () => {
    let dto: PinStateDto;

    beforeEach(() => {
        dto = new PinStateDto();
    });

    describe('isPin', () => {
        it('should accept true as a valid boolean', async () => {
            dto.isPin = true;
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should accept false as a valid boolean', async () => {
            dto.isPin = false;
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should reject undefined isPin (required field)', async () => {
            dto.isPin = undefined as any;
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isNotEmpty');
        });

        it('should reject null isPin (required field)', async () => {
            dto.isPin = null as any;
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isNotEmpty');
        });

        it('should reject non-boolean value (string)', async () => {
            dto.isPin = 'true' as any;
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isBoolean');
        });

        it('should reject non-boolean value (number)', async () => {
            dto.isPin = 1 as any;
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isBoolean');
        });

        it('should reject non-boolean value (object)', async () => {
            dto.isPin = {} as any;
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isBoolean');
        });

        it('should reject non-boolean value (array)', async () => {
            dto.isPin = [] as any;
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isBoolean');
        });
    });
});
