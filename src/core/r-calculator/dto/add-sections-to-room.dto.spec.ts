import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AddSectionsToRoomDto } from './add-sections-to-room.dto';

async function validateDto(plain: object): Promise<string[]> {
    const instance = plainToInstance(AddSectionsToRoomDto, plain);
    const errors = await validate(instance);
    return errors.flatMap((e) => Object.values(e.constraints ?? {}));
}

describe('AddSectionsToRoomDto', () => {
    describe('valid payloads', () => {
        it('accepts a single valid label', async () => {
            const errors = await validateDto({ labels: ['Roof'] });
            expect(errors).toHaveLength(0);
        });

        it('accepts multiple unique valid labels', async () => {
            const errors = await validateDto({ labels: ['Roof', 'Kitchen', 'Toilets'] });
            expect(errors).toHaveLength(0);
        });

        it('accepts labels with exactly 1 character (minLength boundary)', async () => {
            const errors = await validateDto({ labels: ['A'] });
            expect(errors).toHaveLength(0);
        });
    });

    describe('labels – array constraints', () => {
        it('rejects an empty array', async () => {
            const errors = await validateDto({ labels: [] });
            expect(errors.some((m) => m.includes('should not be empty'))).toBe(true);
        });

        it('rejects a non-array value (string)', async () => {
            const errors = await validateDto({ labels: 'Roof' as any });
            expect(errors.some((m) => m.includes('must be an array'))).toBe(true);
        });

        it('rejects a non-array value (number)', async () => {
            const errors = await validateDto({ labels: 42 as any });
            expect(errors.some((m) => m.includes('must be an array'))).toBe(true);
        });

        it('rejects duplicate labels', async () => {
            const errors = await validateDto({ labels: ['Roof', 'Roof'] });
            expect(errors.some((m) => m.includes('must not contain duplicate values'))).toBe(true);
        });
    });

    describe('labels – element constraints', () => {
        it('rejects an array containing a number element', async () => {
            const errors = await validateDto({ labels: [1 as any] });
            expect(errors.some((m) => m.includes('elements must be strings'))).toBe(true);
        });

        it('rejects an array containing a boolean element', async () => {
            const errors = await validateDto({ labels: [true as any] });
            expect(errors.some((m) => m.includes('elements must be strings'))).toBe(true);
        });

        it('rejects an element shorter than minLength (empty string)', async () => {
            const errors = await validateDto({ labels: [''] });
            expect(
                errors.some((m) => m.includes('elements must be at least 1 characters long')),
            ).toBe(true);
        });
    });

    describe('labels – missing / undefined', () => {
        it('rejects when labels is undefined', async () => {
            const errors = await validateDto({});
            expect(errors.length).toBeGreaterThan(0);
        });

        it('rejects when labels is null', async () => {
            const errors = await validateDto({ labels: null as any });
            expect(errors.length).toBeGreaterThan(0);
        });
    });
});
