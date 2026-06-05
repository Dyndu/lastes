import { validate } from 'class-validator';
import { UserStatusEnum } from '../../../common/enum';
import { AdminUserUpdateBySDto } from './admin-user-update-by-s.dto';

describe('AdminUserUpdateBySDto', () => {
    let dto: AdminUserUpdateBySDto;

    beforeEach(() => {
        dto = new AdminUserUpdateBySDto();
    });

    describe('groupId field validation', () => {
        it('should pass validation with valid UUID', async () => {
            dto.groupId = '5a1a6428-8f18-4f79-abf2-1e374a5ffca2';

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should pass validation when groupId is undefined (optional)', async () => {
            dto.groupId = undefined;

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should pass validation when groupId is not provided', async () => {
            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should fail validation when groupId is invalid UUID', async () => {
            dto.groupId = 'invalid-uuid';

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const groupIdError = errors.find((e) => e.property === 'groupId');
            expect(groupIdError).toBeDefined();
            expect(groupIdError?.constraints).toHaveProperty('isUuid');
        });

        it('should fail validation when groupId is too short', async () => {
            dto.groupId = 'ab';

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const groupIdError = errors.find((e) => e.property === 'groupId');
            expect(groupIdError).toBeDefined();
            expect(groupIdError?.constraints).toHaveProperty('isUuid');
        });

        it('should fail validation when groupId is empty string', async () => {
            dto.groupId = '';

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const groupIdError = errors.find((e) => e.property === 'groupId');
            expect(groupIdError).toBeDefined();
        });

        it('should fail validation when groupId is not a string', async () => {
            dto.groupId = 12345 as any;

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const groupIdError = errors.find((e) => e.property === 'groupId');
            expect(groupIdError).toBeDefined();
            expect(groupIdError?.constraints).toHaveProperty('isString');
            expect(groupIdError?.constraints?.isString).toBe('Id of the group must be a string');
        });

        it('should fail validation when groupId is UUID v3 instead of v4', async () => {
            dto.groupId = 'a987fbc9-4bed-3078-cf07-9141ba07c9f3';

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const groupIdError = errors.find((e) => e.property === 'groupId');
            expect(groupIdError).toBeDefined();
            expect(groupIdError?.constraints).toHaveProperty('isUuid');
        });
    });

    describe('roleId field validation', () => {
        it('should pass validation with valid string', async () => {
            dto.roleId = 'support';

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should pass validation with different valid string', async () => {
            dto.roleId = 'admin';

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should pass validation with multi-word role', async () => {
            dto.roleId = 'super-admin';

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should pass validation when roleId is undefined (optional)', async () => {
            dto.roleId = undefined;

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should pass validation when roleId is not provided', async () => {
            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should pass validation with minimum length string', async () => {
            dto.roleId = 'ab';

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should pass validation with long role name', async () => {
            dto.roleId = 'super-administrator-with-full-access';

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should fail validation when roleId is too short (less than 2 chars)', async () => {
            dto.roleId = 'a';

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const roleIdError = errors.find((e) => e.property === 'roleId');
            expect(roleIdError).toBeDefined();
            expect(roleIdError?.constraints).toHaveProperty('minLength');
        });

        it('should fail validation when roleId is empty string', async () => {
            dto.roleId = '';

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const roleIdError = errors.find((e) => e.property === 'roleId');
            expect(roleIdError).toBeDefined();
        });

        it('should fail validation when roleId is not a string', async () => {
            dto.roleId = 12345 as any;

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const roleIdError = errors.find((e) => e.property === 'roleId');
            expect(roleIdError).toBeDefined();
            expect(roleIdError?.constraints).toHaveProperty('isString');
            expect(roleIdError?.constraints?.isString).toBe('Label of the role must be a string');
        });

        it('should fail validation when roleId is an object', async () => {
            dto.roleId = { role: 'admin' } as any;

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const roleIdError = errors.find((e) => e.property === 'roleId');
            expect(roleIdError).toBeDefined();
            expect(roleIdError?.constraints).toHaveProperty('isString');
        });

        it('should fail validation when roleId is an array', async () => {
            dto.roleId = ['admin'] as any;

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const roleIdError = errors.find((e) => e.property === 'roleId');
            expect(roleIdError).toBeDefined();
            expect(roleIdError?.constraints).toHaveProperty('isString');
        });

        it('should pass validation with numeric string', async () => {
            dto.roleId = '123';

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should pass validation with special characters', async () => {
            dto.roleId = 'role_admin-123';

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });
    });

    describe('status field validation', () => {
        it('should pass validation with ACTIVE status', async () => {
            dto.status = UserStatusEnum.ACTIVE;

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should pass validation with SUSPENDED status', async () => {
            dto.status = UserStatusEnum.SUSPENDED;

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should pass validation with INACTIVE status', async () => {
            dto.status = UserStatusEnum.SUSPENDED;

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should pass validation when status is undefined (optional)', async () => {
            dto.status = undefined;

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should pass validation when status is not provided', async () => {
            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should fail validation when status is invalid enum value', async () => {
            dto.status = 'INVALID_STATUS' as any;

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const statusError = errors.find((e) => e.property === 'status');
            expect(statusError).toBeDefined();
            expect(statusError?.constraints).toHaveProperty('isEnum');
            expect(statusError?.constraints?.isEnum).toBe(
                'Status of the user must be a valid enum value',
            );
        });

        it('should fail validation when status is a number', async () => {
            dto.status = 123 as any;

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const statusError = errors.find((e) => e.property === 'status');
            expect(statusError).toBeDefined();
            expect(statusError?.constraints).toHaveProperty('isEnum');
        });

        it('should fail validation when status is an object', async () => {
            dto.status = { status: 'ACTIVE' } as any;

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const statusError = errors.find((e) => e.property === 'status');
            expect(statusError).toBeDefined();
            expect(statusError?.constraints).toHaveProperty('isEnum');
        });

        it('should fail validation when status is an array', async () => {
            dto.status = [UserStatusEnum.ACTIVE] as any;

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const statusError = errors.find((e) => e.property === 'status');
            expect(statusError).toBeDefined();
            expect(statusError?.constraints).toHaveProperty('isEnum');
        });

        it('should fail validation when status is empty string', async () => {
            dto.status = '' as any;

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const statusError = errors.find((e) => e.property === 'status');
            expect(statusError).toBeDefined();
            expect(statusError?.constraints).toHaveProperty('isEnum');
        });

        it('should pass validation when status is null', async () => {
            dto.status = null as any;

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });
    });

    describe('Combined field validation', () => {
        it('should pass validation with all fields valid', async () => {
            dto.groupId = '5a1a6428-8f18-4f79-abf2-1e374a5ffca2';
            dto.roleId = 'support';
            dto.status = UserStatusEnum.ACTIVE;

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should pass validation with only groupId', async () => {
            dto.groupId = '5a1a6428-8f18-4f79-abf2-1e374a5ffca2';

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should pass validation with only roleId', async () => {
            dto.roleId = 'admin';

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should pass validation with only status', async () => {
            dto.status = UserStatusEnum.SUSPENDED;

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should pass validation with no fields provided', async () => {
            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should fail validation when all fields are invalid', async () => {
            dto.groupId = 'invalid-uuid';
            dto.roleId = 'a';
            dto.status = 'INVALID' as any;

            const errors = await validate(dto);

            expect(errors.length).toBe(3);
            expect(errors.some((e) => e.property === 'groupId')).toBe(true);
            expect(errors.some((e) => e.property === 'roleId')).toBe(true);
            expect(errors.some((e) => e.property === 'status')).toBe(true);
        });

        it('should fail validation when groupId is invalid but others are valid', async () => {
            dto.groupId = 'invalid';
            dto.roleId = 'admin';
            dto.status = UserStatusEnum.ACTIVE;

            const errors = await validate(dto);

            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('groupId');
        });

        it('should fail validation when roleId is invalid but others are valid', async () => {
            dto.groupId = '5a1a6428-8f18-4f79-abf2-1e374a5ffca2';
            dto.roleId = 'x';
            dto.status = UserStatusEnum.ACTIVE;

            const errors = await validate(dto);

            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('roleId');
        });

        it('should fail validation when status is invalid but others are valid', async () => {
            dto.groupId = '5a1a6428-8f18-4f79-abf2-1e374a5ffca2';
            dto.roleId = 'support';
            dto.status = 'INVALID_STATUS' as any;

            const errors = await validate(dto);

            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('status');
        });

        it('should pass validation with groupId and status only', async () => {
            dto.groupId = '5a1a6428-8f18-4f79-abf2-1e374a5ffca2';
            dto.status = UserStatusEnum.SUSPENDED;

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should pass validation with roleId and status only', async () => {
            dto.roleId = 'moderator';
            dto.status = UserStatusEnum.SUSPENDED;

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should fail validation when groupId and roleId are invalid', async () => {
            dto.groupId = 'bad-uuid';
            dto.roleId = 'a';
            dto.status = UserStatusEnum.ACTIVE;

            const errors = await validate(dto);

            expect(errors).toHaveLength(2);
            expect(errors.some((e) => e.property === 'groupId')).toBe(true);
            expect(errors.some((e) => e.property === 'roleId')).toBe(true);
        });

        it('should pass validation with groupId and roleId only', async () => {
            dto.groupId = '5a1a6428-8f18-4f79-abf2-1e374a5ffca2';
            dto.roleId = 'editor';

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should fail validation when groupId and status are invalid', async () => {
            dto.groupId = 'not-uuid';
            dto.roleId = 'admin';
            dto.status = 'BAD_STATUS' as any;

            const errors = await validate(dto);

            expect(errors).toHaveLength(2);
            expect(errors.some((e) => e.property === 'groupId')).toBe(true);
            expect(errors.some((e) => e.property === 'status')).toBe(true);
        });

        it('should fail validation when roleId and status are invalid', async () => {
            dto.groupId = '5a1a6428-8f18-4f79-abf2-1e374a5ffca2';
            dto.roleId = '';
            dto.status = 999 as any;

            const errors = await validate(dto);

            expect(errors).toHaveLength(2);
            expect(errors.some((e) => e.property === 'roleId')).toBe(true);
            expect(errors.some((e) => e.property === 'status')).toBe(true);
        });
    });

    describe('DTO instantiation', () => {
        it('should create instance with default values', () => {
            const newDto = new AdminUserUpdateBySDto();

            expect(newDto).toBeInstanceOf(AdminUserUpdateBySDto);
            expect(newDto.groupId).toBeUndefined();
            expect(newDto.roleId).toBeUndefined();
            expect(newDto.status).toBeUndefined();
        });

        it('should allow setting all fields after instantiation', () => {
            const newDto = new AdminUserUpdateBySDto();
            newDto.groupId = '5a1a6428-8f18-4f79-abf2-1e374a5ffca2';
            newDto.roleId = 'support';
            newDto.status = UserStatusEnum.ACTIVE;

            expect(newDto.groupId).toBe('5a1a6428-8f18-4f79-abf2-1e374a5ffca2');
            expect(newDto.roleId).toBe('support');
            expect(newDto.status).toBe(UserStatusEnum.ACTIVE);
        });

        it('should allow partial field updates', () => {
            const newDto = new AdminUserUpdateBySDto();
            newDto.roleId = 'admin';

            expect(newDto.groupId).toBeUndefined();
            expect(newDto.roleId).toBe('admin');
            expect(newDto.status).toBeUndefined();
        });
    });

    describe('Edge cases and special scenarios', () => {
        it('should handle whitespace in roleId', async () => {
            dto.roleId = '  support  ';

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should handle uppercase roleId', async () => {
            dto.roleId = 'ADMIN';

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should handle mixed case roleId', async () => {
            dto.roleId = 'SuperAdmin';

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should handle roleId with numbers', async () => {
            dto.roleId = 'admin123';

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should handle all valid enum values for status', async () => {
            const statuses = Object.values(UserStatusEnum);

            for (const status of statuses) {
                dto.status = status as UserStatusEnum;
                const errors = await validate(dto);
                expect(errors).toHaveLength(0);
            }
        });

        it('should validate that roleId minimum length is enforced', async () => {
            dto.roleId = 'x';

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const roleIdError = errors.find((e) => e.property === 'roleId');
            expect(roleIdError?.constraints).toHaveProperty('minLength');
        });

        it('should handle boolean values for roleId', async () => {
            dto.roleId = true as any;

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const roleIdError = errors.find((e) => e.property === 'roleId');
            expect(roleIdError).toBeDefined();
        });

        it('should handle null for all optional fields', async () => {
            dto.groupId = null as any;
            dto.roleId = null as any;
            dto.status = null as any;

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });
    });
});
