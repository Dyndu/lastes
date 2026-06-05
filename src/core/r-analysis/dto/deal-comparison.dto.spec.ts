import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DealComparisonDto } from './deal-comparison.dto';

const validUuid1 = '3fb7cde0-35d2-43b7-8172-87ddae7fda60';
const validUuid2 = '3fb9cde0-90d2-43b7-8172-87ddae7fda60';
const validUuid3 = 'a1b2c3d4-e5f6-4789-abcd-ef0123456789';
const validUuid4 = 'b2c3d4e5-f6a7-4890-bcde-f01234567890';

function make(data: unknown) {
    return plainToInstance(DealComparisonDto, data);
}

async function getErrors(data: unknown) {
    return validate(make(data));
}

describe('DealComparisonDto', () => {

    it('should pass with a single valid UUID', async () => {
        const errors = await getErrors({ analysisIds: [validUuid1] });
        expect(errors.length).toBe(0);
    });

    it('should pass with multiple valid UUIDs up to the max of 4', async () => {
        const errors = await getErrors({
            analysisIds: [validUuid1, validUuid2, validUuid3, validUuid4],
        });
        expect(errors.length).toBe(0);
    });

    it('should fail if analysisIds is an empty array', async () => {
        const errors = await getErrors({ analysisIds: [] });
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('arrayNotEmpty');
        expect(errors[0].constraints?.arrayNotEmpty).toContain(
            'Array of analysis ids should not be empty',
        );
    });

    it('should fail if analysisIds is not an array', async () => {
        const errors = await getErrors({ analysisIds: validUuid1 as any });
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isArray');
        expect(errors[0].constraints?.isArray).toContain(
            'Array of analysis ids must be an array',
        );
    });

    it('should fail if analysisIds contains a non-string element', async () => {
        const errors = await getErrors({ analysisIds: [validUuid1, 123] as any });
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isString');
        expect(errors[0].constraints?.isString).toContain(
            'Array of analysis ids elements must be strings',
        );
    });

    it('should fail if analysisIds contains an element shorter than 1 character', async () => {
        const errors = await getErrors({ analysisIds: [''] });
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('minLength');
        expect(errors[0].constraints?.minLength).toContain(
            'Array of analysis ids elements must be at least 1 characters long',
        );
    });

    it('should fail if analysisIds contains duplicate UUIDs', async () => {
        const errors = await getErrors({ analysisIds: [validUuid1, validUuid1] });
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('arrayUnique');
        expect(errors[0].constraints?.arrayUnique).toContain(
            'Array of analysis ids must not contain duplicate values',
        );
    });

    it('should fail if analysisIds contains more than 4 elements', async () => {
        const errors = await getErrors({
            analysisIds: [validUuid1, validUuid2, validUuid3, validUuid4, '00000000-0000-4000-8000-000000000005'],
        });
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('arrayMaxSize');
        expect(errors[0].constraints?.arrayMaxSize).toContain(
            'Array of analysis ids must contain at most 4 items',
        );
    });

    it('should pass with exactly 4 elements (boundary)', async () => {
        const errors = await getErrors({
            analysisIds: [validUuid1, validUuid2, validUuid3, validUuid4],
        });
        expect(errors.length).toBe(0);
    });

    it('should fail if analysisIds contains a non-UUID string', async () => {
        const errors = await getErrors({ analysisIds: ['not-a-uuid'] });
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isUuid');
    });

    it('should fail if analysisIds contains a UUID v1 instead of v4', async () => {
        const uuidV1 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
        const errors = await getErrors({ analysisIds: [uuidV1] });
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isUuid');
    });

    it('should fail if analysisIds is missing (required field)', async () => {
        const errors = await getErrors({});
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('analysisIds');
    });
});
