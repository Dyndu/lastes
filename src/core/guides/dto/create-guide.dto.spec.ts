import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateGuideDto } from './create-guide.dto';
import { GuideStatusEnum } from '../../../common/enum';

describe('CreateGuideDto', () => {
    describe('Validation', () => {
        describe('label', () => {
            it('should pass validation with valid label', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'Valid Guide Title',
                    fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: GuideStatusEnum.DRAFT,
                    isVideo: true,
                });

                const errors = await validate(dto);
                const labelErrors = errors.filter((e) => e.property === 'label');

                expect(labelErrors).toHaveLength(0);
            });

            it('should fail when label is missing', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: GuideStatusEnum.DRAFT,
                    isVideo: true,
                });

                const errors = await validate(dto);
                const labelErrors = errors.filter((e) => e.property === 'label');

                expect(labelErrors.length).toBeGreaterThan(0);
                expect(labelErrors[0].constraints).toHaveProperty('isNotEmpty');
                expect(labelErrors[0].constraints?.isNotEmpty).toContain(
                    'Title of the guide is required',
                );
            });

            it('should fail when label is not a string', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 123,
                    fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: GuideStatusEnum.DRAFT,
                    isVideo: true,
                });

                const errors = await validate(dto);
                const labelErrors = errors.filter((e) => e.property === 'label');

                expect(labelErrors.length).toBeGreaterThan(0);
                expect(labelErrors[0].constraints).toHaveProperty('isString');
                expect(labelErrors[0].constraints?.isString).toContain(
                    'Title of the guide must be a string',
                );
            });

            it('should fail when label is too short', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'A',
                    fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: GuideStatusEnum.DRAFT,
                    isVideo: true,
                });

                const errors = await validate(dto);
                const labelErrors = errors.filter((e) => e.property === 'label');

                expect(labelErrors.length).toBeGreaterThan(0);
                expect(labelErrors[0].constraints).toHaveProperty('minLength');
                expect(labelErrors[0].constraints?.minLength).toContain(
                    'Title of the guide must be at least 2 characters long',
                );
            });

            it('should pass when label has exactly minimum length', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'AB',
                    fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: GuideStatusEnum.DRAFT,
                    isVideo: true,
                });

                const errors = await validate(dto);
                const labelErrors = errors.filter((e) => e.property === 'label');

                expect(labelErrors).toHaveLength(0);
            });
        });

        describe('fileId', () => {
            it('should pass validation with valid fileId', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'Valid Guide Title',
                    fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: GuideStatusEnum.DRAFT,
                    isVideo: true,
                });

                const errors = await validate(dto);
                const fileIdErrors = errors.filter((e) => e.property === 'fileId');

                expect(fileIdErrors).toHaveLength(0);
            });

            it('should fail when fileId is missing', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'Valid Guide Title',
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: GuideStatusEnum.DRAFT,
                    isVideo: true,
                });

                const errors = await validate(dto);
                const fileIdErrors = errors.filter((e) => e.property === 'fileId');

                expect(fileIdErrors.length).toBeGreaterThan(0);
                expect(fileIdErrors[0].constraints).toHaveProperty('isNotEmpty');
            });

            it('should fail when fileId is not a string', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'Valid Guide Title',
                    fileId: 123,
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: GuideStatusEnum.DRAFT,
                    isVideo: true,
                });

                const errors = await validate(dto);
                const fileIdErrors = errors.filter((e) => e.property === 'fileId');

                expect(fileIdErrors.length).toBeGreaterThan(0);
                expect(fileIdErrors[0].constraints).toHaveProperty('isString');
            });

            it('should fail when fileId is too short', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'Valid Guide Title',
                    fileId: 'A',
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: GuideStatusEnum.DRAFT,
                    isVideo: true,
                });

                const errors = await validate(dto);
                const fileIdErrors = errors.filter((e) => e.property === 'fileId');

                expect(fileIdErrors.length).toBeGreaterThan(0);
                expect(fileIdErrors[0].constraints).toHaveProperty('minLength');
            });

            it('should fail when fileId is not a valid UUID', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'Valid Guide Title',
                    fileId: 'not-a-valid-uuid-string',
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: GuideStatusEnum.DRAFT,
                    isVideo: true,
                });

                const errors = await validate(dto);
                const fileIdErrors = errors.filter((e) => e.property === 'fileId');

                expect(fileIdErrors.length).toBeGreaterThan(0);
                expect(fileIdErrors[0].constraints).toHaveProperty('isUuid');
            });
        });

        describe('categoryId', () => {
            it('should pass validation with valid categoryId', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'Valid Guide Title',
                    fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: GuideStatusEnum.DRAFT,
                    isVideo: true,
                });

                const errors = await validate(dto);
                const categoryIdErrors = errors.filter((e) => e.property === 'categoryId');

                expect(categoryIdErrors).toHaveLength(0);
            });

            it('should fail when categoryId is missing', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'Valid Guide Title',
                    fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: GuideStatusEnum.DRAFT,
                    isVideo: true,
                });

                const errors = await validate(dto);
                const categoryIdErrors = errors.filter((e) => e.property === 'categoryId');

                expect(categoryIdErrors.length).toBeGreaterThan(0);
                expect(categoryIdErrors[0].constraints).toHaveProperty('isNotEmpty');
            });

            it('should fail when categoryId is not a string', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'Valid Guide Title',
                    fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    categoryId: 123,
                    status: GuideStatusEnum.DRAFT,
                    isVideo: true,
                });

                const errors = await validate(dto);
                const categoryIdErrors = errors.filter((e) => e.property === 'categoryId');

                expect(categoryIdErrors.length).toBeGreaterThan(0);
                expect(categoryIdErrors[0].constraints).toHaveProperty('isString');
            });

            it('should fail when categoryId is not a valid UUID', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'Valid Guide Title',
                    fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    categoryId: 'not-a-valid-uuid-string',
                    status: GuideStatusEnum.DRAFT,
                    isVideo: true,
                });

                const errors = await validate(dto);
                const categoryIdErrors = errors.filter((e) => e.property === 'categoryId');

                expect(categoryIdErrors.length).toBeGreaterThan(0);
                expect(categoryIdErrors[0].constraints).toHaveProperty('isUuid');
            });
        });

        describe('status', () => {
            it('should pass validation with DRAFT status', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'Valid Guide Title',
                    fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: GuideStatusEnum.DRAFT,
                    isVideo: true,
                });

                const errors = await validate(dto);
                const statusErrors = errors.filter((e) => e.property === 'status');

                expect(statusErrors).toHaveLength(0);
            });

            it('should pass validation with PUBLISHED status', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'Valid Guide Title',
                    fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: GuideStatusEnum.PUBLISHED,
                    isVideo: true,
                });

                const errors = await validate(dto);
                const statusErrors = errors.filter((e) => e.property === 'status');

                expect(statusErrors).toHaveLength(0);
            });

            it('should fail when status is missing', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'Valid Guide Title',
                    fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    isVideo: true,
                });

                const errors = await validate(dto);
                const statusErrors = errors.filter((e) => e.property === 'status');

                expect(statusErrors.length).toBeGreaterThan(0);
            });

            it('should fail when status is invalid enum value', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'Valid Guide Title',
                    fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: 'INVALID_STATUS' as any,
                    isVideo: true,
                });

                const errors = await validate(dto);
                const statusErrors = errors.filter((e) => e.property === 'status');

                expect(statusErrors.length).toBeGreaterThan(0);
                expect(statusErrors[0].constraints).toHaveProperty('isEnum');
            });
        });

        describe('description', () => {
            it('should pass validation with valid description', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'Valid Guide Title',
                    fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: GuideStatusEnum.DRAFT,
                    description: 'This is a valid description',
                    isVideo: true,
                });

                const errors = await validate(dto);
                const descriptionErrors = errors.filter((e) => e.property === 'description');

                expect(descriptionErrors).toHaveLength(0);
            });

            it('should pass validation when description is missing (optional field)', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'Valid Guide Title',
                    fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: GuideStatusEnum.DRAFT,
                    isVideo: true,
                });

                const errors = await validate(dto);
                const descriptionErrors = errors.filter((e) => e.property === 'description');

                expect(descriptionErrors).toHaveLength(0);
            });

            it('should fail when description is not a string', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'Valid Guide Title',
                    fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: GuideStatusEnum.DRAFT,
                    description: 123,
                    isVideo: true,
                });

                const errors = await validate(dto);
                const descriptionErrors = errors.filter((e) => e.property === 'description');

                expect(descriptionErrors.length).toBeGreaterThan(0);
                expect(descriptionErrors[0].constraints).toHaveProperty('isString');
            });

            it('should fail when description is too short', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'Valid Guide Title',
                    fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: GuideStatusEnum.DRAFT,
                    description: 'ABC',
                    isVideo: true,
                });

                const errors = await validate(dto);
                const descriptionErrors = errors.filter((e) => e.property === 'description');

                expect(descriptionErrors.length).toBeGreaterThan(0);
                expect(descriptionErrors[0].constraints).toHaveProperty('minLength');
                expect(descriptionErrors[0].constraints?.minLength).toContain(
                    'Description of the guide must be at least 4 characters long',
                );
            });

            it('should pass when description has exactly minimum length', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'Valid Guide Title',
                    fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: GuideStatusEnum.DRAFT,
                    description: 'ABCD',
                    isVideo: true,
                });

                const errors = await validate(dto);
                const descriptionErrors = errors.filter((e) => e.property === 'description');

                expect(descriptionErrors).toHaveLength(0);
            });
        });

        describe('content', () => {
            it('should pass validation with valid content', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'Valid Guide Title',
                    fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: GuideStatusEnum.DRAFT,
                    content: 'This is a valid content',
                    isVideo: true,
                });

                const errors = await validate(dto);
                const contentErrors = errors.filter((e) => e.property === 'content');

                expect(contentErrors).toHaveLength(0);
            });

            it('should pass validation when content is missing (optional field)', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'Valid Guide Title',
                    fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: GuideStatusEnum.DRAFT,
                    isVideo: true,
                });

                const errors = await validate(dto);
                const contentErrors = errors.filter((e) => e.property === 'content');

                expect(contentErrors).toHaveLength(0);
            });

            it('should fail when content is not a string', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'Valid Guide Title',
                    fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: GuideStatusEnum.DRAFT,
                    content: 123,
                    isVideo: true,
                });

                const errors = await validate(dto);
                const contentErrors = errors.filter((e) => e.property === 'content');

                expect(contentErrors.length).toBeGreaterThan(0);
                expect(contentErrors[0].constraints).toHaveProperty('isString');
            });

            it('should fail when content is too short', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'Valid Guide Title',
                    fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: GuideStatusEnum.DRAFT,
                    content: 'ABC',
                    isVideo: true,
                });

                const errors = await validate(dto);
                const contentErrors = errors.filter((e) => e.property === 'content');

                expect(contentErrors.length).toBeGreaterThan(0);
                expect(contentErrors[0].constraints).toHaveProperty('minLength');
                expect(contentErrors[0].constraints?.minLength).toContain(
                    'Content of the guide must be at least 4 characters long',
                );
            });

            it('should pass when content has exactly minimum length', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'Valid Guide Title',
                    fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: GuideStatusEnum.DRAFT,
                    content: 'ABCD',
                    isVideo: true,
                });

                const errors = await validate(dto);
                const contentErrors = errors.filter((e) => e.property === 'content');

                expect(contentErrors).toHaveLength(0);
            });
        });

        describe('isVideo', () => {
            it('should pass validation with valid isVideo as true', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'Valid Guide Title',
                    fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: GuideStatusEnum.DRAFT,
                    isVideo: true,
                });

                const errors = await validate(dto);
                const isVideoErrors = errors.filter((e) => e.property === 'isVideo');

                expect(isVideoErrors).toHaveLength(0);
            });

            it('should pass validation with valid isVideo as false', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'Valid Guide Title',
                    fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: GuideStatusEnum.DRAFT,
                    isVideo: false,
                });

                const errors = await validate(dto);
                const isVideoErrors = errors.filter((e) => e.property === 'isVideo');

                expect(isVideoErrors).toHaveLength(0);
            });

            it('should fail when isVideo is missing', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'Valid Guide Title',
                    fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: GuideStatusEnum.DRAFT,
                });

                const errors = await validate(dto);
                const isVideoErrors = errors.filter((e) => e.property === 'isVideo');

                expect(isVideoErrors.length).toBeGreaterThan(0);
                expect(isVideoErrors[0].constraints).toHaveProperty('isNotEmpty');
                expect(isVideoErrors[0].constraints?.isNotEmpty).toContain(
                    'Specify if the guide is a video or not is required',
                );
            });

            it('should fail when isVideo is not a boolean', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'Valid Guide Title',
                    fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: GuideStatusEnum.DRAFT,
                    isVideo: 'true' as any,
                });

                const errors = await validate(dto);
                const isVideoErrors = errors.filter((e) => e.property === 'isVideo');

                expect(isVideoErrors.length).toBeGreaterThan(0);
                expect(isVideoErrors[0].constraints).toHaveProperty('isBoolean');
                expect(isVideoErrors[0].constraints?.isBoolean).toContain(
                    'Specify if the guide is a video or not must be a boolean',
                );
            });
        });

        describe('Complete DTO validation', () => {
            it('should pass with all valid required fields', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'Complete Guide Title',
                    fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: GuideStatusEnum.DRAFT,
                    isVideo: true,
                });

                const errors = await validate(dto);

                expect(errors).toHaveLength(0);
            });

            it('should pass with all fields including optional fields', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'Complete Guide Title',
                    fileId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    categoryId: '759669c6-d2d0-42fa-860c-93cba1838ea6',
                    status: GuideStatusEnum.DRAFT,
                    description: 'Complete description of the guide',
                    content: 'Complete content of the guide',
                    isVideo: false,
                });

                const errors = await validate(dto);

                expect(errors).toHaveLength(0);
            });

            it('should fail with multiple validation errors', async () => {
                const dto = plainToClass(CreateGuideDto, {
                    label: 'A',
                    fileId: 'B',
                    categoryId: 123,
                    status: 'INVALID',
                    description: 'ABC',
                    content: 'AB',
                    isVideo: 'not-a-boolean' as any,
                });

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
        });
    });
});
