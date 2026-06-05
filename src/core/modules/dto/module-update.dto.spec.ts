import { validate } from 'class-validator';
import { ModuleUpdateDto } from './module-update.dto';
import { ModuleTypeEnum } from '../../../common/enum';

describe('ModuleUpdateDto', () => {
    let dto: ModuleUpdateDto;

    beforeEach(() => {
        dto = new ModuleUpdateDto();
    });

    describe('label', () => {
        it('should accept a valid label', async () => {
            dto.label = 'Fix and flip';
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should accept undefined label (optional field)', async () => {
            dto.label = undefined;
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should reject label shorter than 2 characters', async () => {
            dto.label = 'a';
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('minLength');
        });

        it('should reject non-string label', async () => {
            dto.label = 123 as any;
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isString');
        });
    });

    describe('icon', () => {
        it('should accept a valid icon', async () => {
            dto.icon = 'fix-and-flip';
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should accept undefined icon (optional field)', async () => {
            dto.icon = undefined;
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should reject icon shorter than 2 characters', async () => {
            dto.icon = 'a';
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('minLength');
        });

        it('should reject non-string icon', async () => {
            dto.icon = 123 as any;
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isString');
        });
    });

    describe('description', () => {
        it('should accept a valid description', async () => {
            dto.description = 'A big text';
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should accept undefined description (optional field)', async () => {
            dto.description = undefined;
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should reject description shorter than 2 characters', async () => {
            dto.description = 'a';
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('minLength');
        });

        it('should reject non-string description', async () => {
            dto.description = 123 as any;
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isString');
        });
    });

    describe('usageDescription', () => {
        it('should accept a valid usageDescription', async () => {
            dto.usageDescription = 'Come to me, all those who are laboured and burden';
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should accept undefined usageDescription (optional field)', async () => {
            dto.usageDescription = undefined;
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should reject usageDescription shorter than 2 characters', async () => {
            dto.usageDescription = 'a';
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('minLength');
        });

        it('should reject non-string usageDescription', async () => {
            dto.usageDescription = 123 as any;
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isString');
        });
    });

    describe('type', () => {
        it('should accept a valid enum type', async () => {
            dto.type = ModuleTypeEnum.MODULE;
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should accept undefined type (optional field)', async () => {
            dto.type = undefined;
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should reject invalid enum value', async () => {
            dto.type = 'INVALID_TYPE' as any;
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isEnum');
        });
    });

    describe('link', () => {
        it('should accept a valid UUID v4', async () => {
            dto.link = '550e8400-e29b-41d4-a716-446655440000';
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should accept undefined link (optional field)', async () => {
            dto.link = undefined;
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should reject invalid UUID', async () => {
            dto.link = 'not-a-valid-uuid';
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isUuid');
        });

        it('should reject link shorter than 2 characters', async () => {
            dto.link = 'a';
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('minLength');
        });

        it('should reject non-string link', async () => {
            dto.link = 123 as any;
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isString');
        });
    });

    describe('all fields together', () => {
        it('should accept a fully populated valid DTO', async () => {
            dto.label = 'Fix and flip';
            dto.icon = 'fix-and-flip';
            dto.description = 'A big text';
            dto.usageDescription = 'Come to me, all those who are laboured and burden';
            dto.type = ModuleTypeEnum.MODULE;
            dto.link = '550e8400-e29b-41d4-a716-446655440000';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should accept an empty DTO (all fields optional)', async () => {
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });
});
