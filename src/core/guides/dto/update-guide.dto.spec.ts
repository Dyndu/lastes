import { validate } from 'class-validator';
import { UpdateGuideDto } from './update-guide.dto';
import { GuideStatusEnum } from '../../../common/enum';
import { CreateGuideDto } from './create-guide.dto';

describe('UpdateGuideDto', () => {
    let dto: UpdateGuideDto;

    beforeEach(() => {
        dto = new UpdateGuideDto();
    });

    describe('Validation', () => {
        it('should pass validation with all valid fields', async () => {
            dto.label = 'Updated Guide Title';
            dto.fileId = '759669c6-d2d0-42fa-860c-93cba1838ea6';
            dto.categoryId = '859669c6-d2d0-42fa-860c-93cba1838ea7';
            dto.status = GuideStatusEnum.PUBLISHED;
            dto.description = 'Updated description of the guide';
            dto.content = 'Updated content of the guide';
            dto.isVideo = false;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with partial fields', async () => {
            dto.label = 'Updated Guide Title';

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with only status', async () => {
            dto.status = GuideStatusEnum.DRAFT;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with empty object (all fields optional)', async () => {
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('label field', () => {
        it('should accept valid label', async () => {
            dto.label = 'Valid Guide Title';

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should reject label shorter than minimum length', async () => {
            dto.label = 'A';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('label');
            expect(errors[0].constraints).toHaveProperty('minLength');
        });

        it('should reject empty label', async () => {
            dto.label = '';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('label');
        });

        it('should accept label with minimum length', async () => {
            dto.label = 'AB';

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should reject non-string label', async () => {
            dto.label = 123 as any;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('label');
            expect(errors[0].constraints).toHaveProperty('isString');
        });
    });

    describe('fileId field', () => {
        it('should accept valid UUID for fileId', async () => {
            dto.fileId = '759669c6-d2d0-42fa-860c-93cba1838ea6';

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should reject invalid UUID format for fileId', async () => {
            dto.fileId = 'invalid-uuid';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('fileId');
            expect(errors[0].constraints).toHaveProperty('isUuid');
        });

        it('should reject empty fileId', async () => {
            dto.fileId = '';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('fileId');
        });

        it('should reject non-string fileId', async () => {
            dto.fileId = 123 as any;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('fileId');
            expect(errors[0].constraints).toHaveProperty('isString');
        });

        it('should reject fileId shorter than minimum length', async () => {
            dto.fileId = 'A';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('fileId');
            expect(errors[0].constraints).toHaveProperty('minLength');
        });
    });

    describe('categoryId field', () => {
        it('should accept valid UUID for categoryId', async () => {
            dto.categoryId = '859669c6-d2d0-42fa-860c-93cba1838ea7';

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should reject invalid UUID format for categoryId', async () => {
            dto.categoryId = 'not-a-uuid';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('categoryId');
            expect(errors[0].constraints).toHaveProperty('isUuid');
        });

        it('should reject empty categoryId', async () => {
            dto.categoryId = '';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('categoryId');
        });

        it('should reject non-string categoryId', async () => {
            dto.categoryId = 123 as any;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('categoryId');
            expect(errors[0].constraints).toHaveProperty('isString');
        });
    });

    describe('status field', () => {
        it('should accept DRAFT status', async () => {
            dto.status = GuideStatusEnum.DRAFT;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should accept PUBLISHED status', async () => {
            dto.status = GuideStatusEnum.PUBLISHED;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should reject invalid status value', async () => {
            dto.status = 'INVALID_STATUS' as GuideStatusEnum;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('status');
            expect(errors[0].constraints).toHaveProperty('isEnum');
        });
    });

    describe('description field', () => {
        it('should accept valid description', async () => {
            dto.description = 'This is a valid description of the guide';

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should accept undefined description (optional field)', async () => {
            dto.description = undefined;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should reject description shorter than minimum length', async () => {
            dto.description = 'abc';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('description');
            expect(errors[0].constraints).toHaveProperty('minLength');
        });

        it('should accept description with minimum length', async () => {
            dto.description = 'abcd';

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should accept long description', async () => {
            dto.description = 'A'.repeat(500);

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should reject non-string description', async () => {
            dto.description = 123 as any;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('description');
            expect(errors[0].constraints).toHaveProperty('isString');
        });
    });

    describe('content field', () => {
        it('should accept valid content', async () => {
            dto.content = 'This is a valid content of the guide';

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should accept undefined content (optional field)', async () => {
            dto.content = undefined;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should reject content shorter than minimum length', async () => {
            dto.content = 'abc';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('content');
            expect(errors[0].constraints).toHaveProperty('minLength');
        });

        it('should accept content with minimum length', async () => {
            dto.content = 'abcd';

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should accept long content', async () => {
            dto.content = 'A'.repeat(500);

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should reject non-string content', async () => {
            dto.content = 123 as any;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('content');
            expect(errors[0].constraints).toHaveProperty('isString');
        });
    });

    describe('isVideo field', () => {
        it('should accept true for isVideo', async () => {
            dto.isVideo = true;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should accept false for isVideo', async () => {
            dto.isVideo = false;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should accept undefined isVideo (optional field)', async () => {
            dto.isVideo = undefined;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should reject non-boolean isVideo', async () => {
            dto.isVideo = 'true' as any;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('isVideo');
            expect(errors[0].constraints).toHaveProperty('isBoolean');
        });

        it('should reject number for isVideo', async () => {
            dto.isVideo = 1 as any;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('isVideo');
            expect(errors[0].constraints).toHaveProperty('isBoolean');
        });
    });

    describe('Partial updates', () => {
        it('should allow updating only label', async () => {
            dto.label = 'New Title Only';

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should allow updating only status', async () => {
            dto.status = GuideStatusEnum.PUBLISHED;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should allow updating only description', async () => {
            dto.description = 'New description only';

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should allow updating only content', async () => {
            dto.content = 'New content only';

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should allow updating only isVideo', async () => {
            dto.isVideo = true;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should allow updating multiple fields', async () => {
            dto.label = 'Updated Title';
            dto.status = GuideStatusEnum.PUBLISHED;
            dto.description = 'Updated description';
            dto.content = 'Updated content';
            dto.isVideo = false;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('PartialType inheritance', () => {
        it('should inherit all properties from CreateGuideDto', () => {
            const instance = new CreateGuideDto();
            expect(instance).toHaveProperty('label');
            expect(instance).toHaveProperty('fileId');
            expect(instance).toHaveProperty('categoryId');
            expect(instance).toHaveProperty('status');
            expect(instance).toHaveProperty('description');
            expect(instance).toHaveProperty('content');
            expect(instance).toHaveProperty('isVideo');
        });

        it('should make all fields optional', async () => {
            const emptyDto = new UpdateGuideDto();
            const errors = await validate(emptyDto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('Combined field validations', () => {
        it('should validate multiple fields with errors', async () => {
            dto.label = 'A';
            dto.fileId = 'invalid';
            dto.categoryId = 'invalid';
            dto.status = 'INVALID' as GuideStatusEnum;
            dto.description = 'abc';
            dto.content = 'ab';
            dto.isVideo = 'yes' as any;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);

            const errorProperties = errors.map((e) => e.property);
            expect(errorProperties).toContain('label');
            expect(errorProperties).toContain('fileId');
            expect(errorProperties).toContain('categoryId');
            expect(errorProperties).toContain('status');
            expect(errorProperties).toContain('description');
            expect(errorProperties).toContain('content');
            expect(errorProperties).toContain('isVideo');
        });

        it('should pass with all valid optional fields', async () => {
            dto.label = 'Valid Label';
            dto.fileId = '759669c6-d2d0-42fa-860c-93cba1838ea6';
            dto.categoryId = '859669c6-d2d0-42fa-860c-93cba1838ea7';
            dto.status = GuideStatusEnum.DRAFT;
            dto.description = 'Valid description';
            dto.content = 'Valid content';
            dto.isVideo = true;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with mix of valid and undefined fields', async () => {
            dto.label = 'Valid Label';
            dto.status = GuideStatusEnum.DRAFT;
            dto.isVideo = false;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });
});
