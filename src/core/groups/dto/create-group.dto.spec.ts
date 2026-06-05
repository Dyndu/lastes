import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateGroupDto } from './create-group.dto';

describe('CreateGroupDto', () => {
    describe('label field', () => {
        it('should pass validation with valid label', async () => {
            const dto = plainToInstance(CreateGroupDto, {
                label: 'Management',
                permissionIds: ['362fcfb7-6de6-48d3-87ff-1c9767394a2e'],
            });

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should fail validation when label is empty', async () => {
            const dto = plainToInstance(CreateGroupDto, {
                label: '',
                permissionIds: ['362fcfb7-6de6-48d3-87ff-1c9767394a2e'],
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const labelError = errors.find((err) => err.property === 'label');
            expect(labelError).toBeDefined();
            expect(labelError?.constraints).toHaveProperty('isNotEmpty');
        });

        it('should fail validation when label is missing', async () => {
            const dto = plainToInstance(CreateGroupDto, {
                permissionIds: ['362fcfb7-6de6-48d3-87ff-1c9767394a2e'],
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const labelError = errors.find((err) => err.property === 'label');
            expect(labelError).toBeDefined();
            expect(labelError?.constraints).toHaveProperty('isNotEmpty');
        });

        it('should fail validation when label is not a string', async () => {
            const dto = plainToInstance(CreateGroupDto, {
                label: 123,
                permissionIds: ['362fcfb7-6de6-48d3-87ff-1c9767394a2e'],
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const labelError = errors.find((err) => err.property === 'label');
            expect(labelError).toBeDefined();
            expect(labelError?.constraints).toHaveProperty('isString');
        });

        it('should fail validation when label is less than 2 characters', async () => {
            const dto = plainToInstance(CreateGroupDto, {
                label: 'A',
                permissionIds: ['362fcfb7-6de6-48d3-87ff-1c9767394a2e'],
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const labelError = errors.find((err) => err.property === 'label');
            expect(labelError).toBeDefined();
            expect(labelError?.constraints).toHaveProperty('minLength');
            expect(labelError?.constraints?.minLength).toContain('at least 2 characters');
        });

        it('should pass validation with label exactly 2 characters', async () => {
            const dto = plainToInstance(CreateGroupDto, {
                label: 'AB',
                permissionIds: ['362fcfb7-6de6-48d3-87ff-1c9767394a2e'],
            });

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should pass validation with long label', async () => {
            const dto = plainToInstance(CreateGroupDto, {
                label: 'Very Long Group Name For Testing',
                permissionIds: ['362fcfb7-6de6-48d3-87ff-1c9767394a2e'],
            });

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });
    });

    describe('permissionIds field', () => {
        it('should fail validation when permissionIds is missing (required field)', async () => {
            const dto = plainToInstance(CreateGroupDto, {
                label: 'Management',
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const permError = errors.find((err) => err.property === 'permissionIds');
            expect(permError).toBeDefined();
            // Since it's required (no ? in TypeScript), it will fail validation
        });

        it('should fail validation with empty array (required=true in decorator)', async () => {
            const dto = plainToInstance(CreateGroupDto, {
                label: 'Management',
                permissionIds: [],
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const permError = errors.find((err) => err.property === 'permissionIds');
            expect(permError).toBeDefined();
            expect(permError?.constraints).toHaveProperty('arrayNotEmpty');
            expect(permError?.constraints?.arrayNotEmpty).toContain('should not be empty');
        });

        it('should pass validation with valid UUID array', async () => {
            const dto = plainToInstance(CreateGroupDto, {
                label: 'Management',
                permissionIds: [
                    '362fcfb7-6de6-48d3-87ff-1c9767394a2e',
                    '924a4955-966e-4db2-90e5-384401c51a89',
                ],
            });

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should pass validation with single UUID', async () => {
            const dto = plainToInstance(CreateGroupDto, {
                label: 'Management',
                permissionIds: ['362fcfb7-6de6-48d3-87ff-1c9767394a2e'],
            });

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should fail validation when permissionIds is not an array', async () => {
            const dto = plainToInstance(CreateGroupDto, {
                label: 'Management',
                permissionIds: 'not-an-array' as any,
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const permError = errors.find((err) => err.property === 'permissionIds');
            expect(permError).toBeDefined();
            expect(permError?.constraints).toHaveProperty('isArray');
        });

        it('should fail validation with invalid UUID format', async () => {
            const dto = plainToInstance(CreateGroupDto, {
                label: 'Management',
                permissionIds: ['invalid-uuid', 'another-invalid'],
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const permError = errors.find((err) => err.property === 'permissionIds');
            expect(permError).toBeDefined();
            expect(permError?.constraints).toHaveProperty('isUuid');
        });

        it('should fail validation with mixed valid and invalid UUIDs', async () => {
            const dto = plainToInstance(CreateGroupDto, {
                label: 'Management',
                permissionIds: ['362fcfb7-6de6-48d3-87ff-1c9767394a2e', 'invalid-uuid'],
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const permError = errors.find((err) => err.property === 'permissionIds');
            expect(permError).toBeDefined();
            expect(permError?.constraints).toHaveProperty('isUuid');
        });

        it('should fail validation when array contains duplicate UUIDs', async () => {
            const dto = plainToInstance(CreateGroupDto, {
                label: 'Management',
                permissionIds: [
                    '362fcfb7-6de6-48d3-87ff-1c9767394a2e',
                    '362fcfb7-6de6-48d3-87ff-1c9767394a2e',
                ],
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const permError = errors.find((err) => err.property === 'permissionIds');
            expect(permError).toBeDefined();
            expect(permError?.constraints).toHaveProperty('arrayUnique');
            expect(permError?.constraints?.arrayUnique).toContain(
                'must not contain duplicate values',
            );
        });

        it('should fail validation when array element is not a string', async () => {
            const dto = plainToInstance(CreateGroupDto, {
                label: 'Management',
                permissionIds: [123, 456] as any,
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const permError = errors.find((err) => err.property === 'permissionIds');
            expect(permError).toBeDefined();
            expect(permError?.constraints).toHaveProperty('isUuid');
        });

        it('should fail validation when array element is empty string (minLength=1)', async () => {
            const dto = plainToInstance(CreateGroupDto, {
                label: 'Management',
                permissionIds: [''],
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const permError = errors.find((err) => err.property === 'permissionIds');
            expect(permError).toBeDefined();
            expect(permError?.constraints).toHaveProperty('minLength');
            expect(permError?.constraints?.minLength).toContain('at least 1 characters long');
        });

        it('should fail validation when array has elements shorter than minLength', async () => {
            const dto = plainToInstance(CreateGroupDto, {
                label: 'Management',
                permissionIds: ['', 'a'],
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const permError = errors.find((err) => err.property === 'permissionIds');
            expect(permError).toBeDefined();
            expect(permError?.constraints).toHaveProperty('minLength');
        });
    });

    describe('complete DTO validation', () => {
        it('should pass validation with all valid fields', async () => {
            const dto = plainToInstance(CreateGroupDto, {
                label: 'Admin Group',
                permissionIds: [
                    '362fcfb7-6de6-48d3-87ff-1c9767394a2e',
                    '924a4955-966e-4db2-90e5-384401c51a89',
                    'ca215698-e7b3-410a-a985-d072444a4981',
                ],
            });

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
            expect(dto.label).toBe('Admin Group');
            expect(dto.permissionIds).toHaveLength(3);
        });

        it('should fail validation with multiple errors', async () => {
            const dto = plainToInstance(CreateGroupDto, {
                label: 'A',
                permissionIds: ['invalid', 123] as any,
            });

            const error = await validate(dto);

            expect(error.length).toBeGreaterThan(0);

            const labelError = error.find((err) => err.property === 'label');
            expect(labelError).toBeDefined();

            const permError = error.find((err) => err.property === 'permissionIds');
            expect(permError).toBeDefined();
        });

        it('should fail validation when both fields are missing', async () => {
            const dto = plainToInstance(CreateGroupDto, {});

            const newErrors = await validate(dto);

            expect(newErrors.length).toBeGreaterThan(0);

            const labelError = newErrors.find((err) => err.property === 'label');
            expect(labelError).toBeDefined();

            const permError = newErrors.find((err) => err.property === 'permissionIds');
            expect(permError).toBeDefined();
        });

        it('should handle null values appropriately', async () => {
            const dto = plainToInstance(CreateGroupDto, {
                label: null,
                permissionIds: null,
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);

            const labelError = errors.find((err) => err.property === 'label');
            expect(labelError).toBeDefined();

            const permError = errors.find((err) => err.property === 'permissionIds');
            expect(permError).toBeDefined();
        });
    });

    describe('edge cases', () => {
        it('should handle special characters in label', async () => {
            const dto = plainToInstance(CreateGroupDto, {
                label: 'Group-Name_123!@#',
                permissionIds: ['362fcfb7-6de6-48d3-87ff-1c9767394a2e'],
            });

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should handle Unicode characters in label', async () => {
            const dto = plainToInstance(CreateGroupDto, {
                label: 'Группа Administração',
                permissionIds: ['362fcfb7-6de6-48d3-87ff-1c9767394a2e'],
            });

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should handle whitespace in label', async () => {
            const dto = plainToInstance(CreateGroupDto, {
                label: '  Management  ',
                permissionIds: ['362fcfb7-6de6-48d3-87ff-1c9767394a2e'],
            });

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should handle UUID v4 specifically', async () => {
            const dto = plainToInstance(CreateGroupDto, {
                label: 'Test',
                permissionIds: ['550e8400-e29b-41d4-a716-446655440000'],
            });

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should reject non-v4 UUID formats', async () => {
            const dto = plainToInstance(CreateGroupDto, {
                label: 'Test',
                permissionIds: [
                    '123e4567-e89b-12d3-a456-42661417400', // Too short
                ],
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const permError = errors.find((err) => err.property === 'permissionIds');
            expect(permError).toBeDefined();
        });
    });
});
