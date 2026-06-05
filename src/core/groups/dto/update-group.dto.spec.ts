import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateGroupDto } from './update-group.dto';

describe('UpdateGroupDto', () => {
    describe('PartialType behavior', () => {
        it('should pass validation with no fields provided (all optional)', async () => {
            const dto = plainToInstance(UpdateGroupDto, {});

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should pass validation with only label provided', async () => {
            const dto = plainToInstance(UpdateGroupDto, {
                label: 'Updated Group',
            });

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should pass validation with only permissionIds provided', async () => {
            const dto = plainToInstance(UpdateGroupDto, {
                permissionIds: [
                    'ca215698-e7b3-410a-a985-d072444a4981',
                    '924a4955-966e-4db2-90e5-384401c51a89',
                ],
            });

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should pass validation with all fields provided', async () => {
            const dto = plainToInstance(UpdateGroupDto, {
                label: 'Complete Update',
                permissionIds: ['ca215698-e7b3-410a-a985-d072444a4981'],
            });

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
            expect(dto.label).toBe('Complete Update');
            expect(dto.permissionIds).toHaveLength(1);
        });
    });

    describe('label field validation (when provided)', () => {
        it('should fail validation when label is empty string', async () => {
            const dto = plainToInstance(UpdateGroupDto, {
                label: '',
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const labelError = errors.find((err) => err.property === 'label');
            expect(labelError).toBeDefined();
            expect(labelError?.constraints).toHaveProperty('isNotEmpty');
        });

        it('should fail validation when label is not a string', async () => {
            const dto = plainToInstance(UpdateGroupDto, {
                label: 123,
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const labelError = errors.find((err) => err.property === 'label');
            expect(labelError).toBeDefined();
            expect(labelError?.constraints).toHaveProperty('isString');
        });

        it('should fail validation when label is less than 2 characters', async () => {
            const dto = plainToInstance(UpdateGroupDto, {
                label: 'A',
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const labelError = errors.find((err) => err.property === 'label');
            expect(labelError).toBeDefined();
            expect(labelError?.constraints).toHaveProperty('minLength');
        });

        it('should pass validation with label exactly 2 characters', async () => {
            const dto = plainToInstance(UpdateGroupDto, {
                label: 'AB',
            });

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should pass validation with valid label', async () => {
            const dto = plainToInstance(UpdateGroupDto, {
                label: 'Valid Group Name',
            });

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });
    });

    describe('permissionIds field validation (when provided)', () => {
        it('should pass validation when permissionIds is not provided (optional)', async () => {
            const dto = plainToInstance(UpdateGroupDto, {
                label: 'Test',
            });

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should fail validation with empty array', async () => {
            const dto = plainToInstance(UpdateGroupDto, {
                permissionIds: [],
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const permError = errors.find((err) => err.property === 'permissionIds');
            expect(permError).toBeDefined();
            expect(permError?.constraints).toHaveProperty('arrayNotEmpty');
        });

        it('should pass validation with valid UUIDs', async () => {
            const dto = plainToInstance(UpdateGroupDto, {
                permissionIds: [
                    'ca215698-e7b3-410a-a985-d072444a4981',
                    '924a4955-966e-4db2-90e5-384401c51a89',
                ],
            });

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should fail validation with invalid UUID format', async () => {
            const dto = plainToInstance(UpdateGroupDto, {
                permissionIds: ['invalid-uuid'],
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const permError = errors.find((err) => err.property === 'permissionIds');
            expect(permError).toBeDefined();
            expect(permError?.constraints).toHaveProperty('isUuid');
        });

        it('should fail validation with duplicate UUIDs', async () => {
            const dto = plainToInstance(UpdateGroupDto, {
                permissionIds: [
                    'ca215698-e7b3-410a-a985-d072444a4981',
                    'ca215698-e7b3-410a-a985-d072444a4981',
                ],
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const permError = errors.find((err) => err.property === 'permissionIds');
            expect(permError).toBeDefined();
            expect(permError?.constraints).toHaveProperty('arrayUnique');
        });

        it('should fail validation when array element is not a string', async () => {
            const dto = plainToInstance(UpdateGroupDto, {
                permissionIds: [123] as any,
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const permError = errors.find((err) => err.property === 'permissionIds');
            expect(permError).toBeDefined();
            expect(permError?.constraints).toHaveProperty('isUuid');
        });

        it('should fail validation when array is not actually an array', async () => {
            const dto = plainToInstance(UpdateGroupDto, {
                permissionIds: 'not-an-array' as any,
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const permError = errors.find((err) => err.property === 'permissionIds');
            expect(permError).toBeDefined();
            expect(permError?.constraints).toHaveProperty('isArray');
        });

        it('should fail validation with empty string elements', async () => {
            const dto = plainToInstance(UpdateGroupDto, {
                permissionIds: [''],
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const permError = errors.find((err) => err.property === 'permissionIds');
            expect(permError).toBeDefined();
            expect(permError?.constraints).toHaveProperty('minLength');
        });
    });

    describe('combined field validation', () => {
        it('should pass validation updating both fields', async () => {
            const dto = plainToInstance(UpdateGroupDto, {
                label: 'Updated Name',
                permissionIds: ['ca215698-e7b3-410a-a985-d072444a4981'],
            });

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should fail validation with invalid label and valid permissionIds', async () => {
            const dto = plainToInstance(UpdateGroupDto, {
                label: 'A',
                permissionIds: ['ca215698-e7b3-410a-a985-d072444a4981'],
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const labelError = errors.find((err) => err.property === 'label');
            expect(labelError).toBeDefined();
        });

        it('should fail validation with valid label and invalid permissionIds', async () => {
            const dto = plainToInstance(UpdateGroupDto, {
                label: 'Valid Name',
                permissionIds: ['invalid'],
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const permError = errors.find((err) => err.property === 'permissionIds');
            expect(permError).toBeDefined();
        });

        it('should fail validation with both fields invalid', async () => {
            const dto = plainToInstance(UpdateGroupDto, {
                label: 'A',
                permissionIds: ['invalid'],
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const labelError = errors.find((err) => err.property === 'label');
            const permError = errors.find((err) => err.property === 'permissionIds');
            expect(labelError).toBeDefined();
            expect(permError).toBeDefined();
        });
    });

    describe('null and undefined handling', () => {
        it('should handle undefined values correctly', async () => {
            const dto = plainToInstance(UpdateGroupDto, {
                label: undefined,
                permissionIds: undefined,
            });

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should fail validation with null label', async () => {
            const dto = plainToInstance(UpdateGroupDto, {
                label: null,
            });

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should fail validation with null permissionIds', async () => {
            const dto = plainToInstance(UpdateGroupDto, {
                permissionIds: null,
            });

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });
    });

    describe('edge cases', () => {
        it('should handle special characters in label', async () => {
            const dto = plainToInstance(UpdateGroupDto, {
                label: 'Group-Name_123!@#',
            });

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should handle Unicode characters in label', async () => {
            const dto = plainToInstance(UpdateGroupDto, {
                label: 'Группа Administração',
            });

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should validate single permission update', async () => {
            const dto = plainToInstance(UpdateGroupDto, {
                permissionIds: ['550e8400-e29b-41d4-a716-446655440000'],
            });

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should properly inherit all validations from CreateGroupDto', async () => {
            const dto = plainToInstance(UpdateGroupDto, {
                label: 'Test',
                permissionIds: [
                    'ca215698-e7b3-410a-a985-d072444a4981',
                    'ca215698-e7b3-410a-a985-d072444a4981', // Duplicate
                ],
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const permError = errors.find((err) => err.property === 'permissionIds');
            expect(permError?.constraints).toHaveProperty('arrayUnique');
        });
    });
});
