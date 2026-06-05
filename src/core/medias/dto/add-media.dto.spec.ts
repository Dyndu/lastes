import { validate } from 'class-validator';
import { AddMediaDto } from './add-media.dto';

describe('AddMediaDto', () => {
    let dto: AddMediaDto;

    beforeEach(() => {
        dto = new AddMediaDto();
    });

    describe('fileId', () => {
        it('should accept a valid UUID v4', async () => {
            dto.fileId = '432715fa-b1dd-41b0-b895-bed6f3952588';
            const errors = await validate(dto);
            const fileIdErrors = errors.filter((e) => e.property === 'fileId');
            expect(fileIdErrors).toHaveLength(0);
        });

        it('should reject an invalid UUID', async () => {
            dto.fileId = 'invalid-uuid';
            const errors = await validate(dto);
            const fileIdErrors = errors.filter((e) => e.property === 'fileId');
            expect(fileIdErrors.length).toBeGreaterThan(0);
        });

        it('should reject a string shorter than 2 characters', async () => {
            dto.fileId = 'a';
            const errors = await validate(dto);
            const fileIdErrors = errors.filter((e) => e.property === 'fileId');
            expect(fileIdErrors.length).toBeGreaterThan(0);
        });

        it('should accept null', async () => {
            dto.fileId = null!;
            const errors = await validate(dto);
            const fileIdErrors = errors.filter((e) => e.property === 'fileId');
            expect(fileIdErrors).toHaveLength(0);
        });

        it('should accept undefined', async () => {
            dto.fileId = undefined;
            const errors = await validate(dto);
            const fileIdErrors = errors.filter((e) => e.property === 'fileId');
            expect(fileIdErrors).toHaveLength(0);
        });

        it('should reject a non-string value', async () => {
            (dto as any).fileId = 12345;
            const errors = await validate(dto);
            const fileIdErrors = errors.filter((e) => e.property === 'fileId');
            expect(fileIdErrors.length).toBeGreaterThan(0);
        });
    });

    describe('fileLink', () => {
        it('should accept a valid URL', async () => {
            dto.fileLink = 'https://s3.example.com/image.png';
            const errors = await validate(dto);
            const fileLinkErrors = errors.filter((e) => e.property === 'fileLink');
            expect(fileLinkErrors).toHaveLength(0);
        });

        it('should reject an invalid URL', async () => {
            dto.fileLink = 'not-a-url';
            const errors = await validate(dto);
            const fileLinkErrors = errors.filter((e) => e.property === 'fileLink');
            expect(fileLinkErrors.length).toBeGreaterThan(0);
        });

        it('should reject a string shorter than 2 characters', async () => {
            dto.fileLink = 'h';
            const errors = await validate(dto);
            const fileLinkErrors = errors.filter((e) => e.property === 'fileLink');
            expect(fileLinkErrors.length).toBeGreaterThan(0);
        });

        it('should accept null', async () => {
            dto.fileLink = null!;
            const errors = await validate(dto);
            const fileLinkErrors = errors.filter((e) => e.property === 'fileLink');
            expect(fileLinkErrors).toHaveLength(0);
        });

        it('should accept undefined', async () => {
            dto.fileLink = undefined;
            const errors = await validate(dto);
            const fileLinkErrors = errors.filter((e) => e.property === 'fileLink');
            expect(fileLinkErrors).toHaveLength(0);
        });

        it('should reject a non-string value', async () => {
            (dto as any).fileLink = 12345;
            const errors = await validate(dto);
            const fileLinkErrors = errors.filter((e) => e.property === 'fileLink');
            expect(fileLinkErrors.length).toBeGreaterThan(0);
        });
    });

    describe('thumbnailId', () => {
        it('should accept a valid UUID v4', async () => {
            dto.thumbnailId = '432715fa-b1dd-41b0-b895-bed6f3952588';
            const errors = await validate(dto);
            const thumbnailIdErrors = errors.filter((e) => e.property === 'thumbnailId');
            expect(thumbnailIdErrors).toHaveLength(0);
        });

        it('should reject an invalid UUID', async () => {
            dto.thumbnailId = 'invalid-uuid';
            const errors = await validate(dto);
            const thumbnailIdErrors = errors.filter((e) => e.property === 'thumbnailId');
            expect(thumbnailIdErrors.length).toBeGreaterThan(0);
        });

        it('should reject a string shorter than 2 characters', async () => {
            dto.thumbnailId = 'a';
            const errors = await validate(dto);
            const thumbnailIdErrors = errors.filter((e) => e.property === 'thumbnailId');
            expect(thumbnailIdErrors.length).toBeGreaterThan(0);
        });

        it('should accept null', async () => {
            dto.thumbnailId = null!;
            const errors = await validate(dto);
            const thumbnailIdErrors = errors.filter((e) => e.property === 'thumbnailId');
            expect(thumbnailIdErrors).toHaveLength(0);
        });

        it('should accept undefined', async () => {
            dto.thumbnailId = undefined;
            const errors = await validate(dto);
            const thumbnailIdErrors = errors.filter((e) => e.property === 'thumbnailId');
            expect(thumbnailIdErrors).toHaveLength(0);
        });

        it('should reject a non-string value', async () => {
            (dto as any).thumbnailId = 12345;
            const errors = await validate(dto);
            const thumbnailIdErrors = errors.filter((e) => e.property === 'thumbnailId');
            expect(thumbnailIdErrors.length).toBeGreaterThan(0);
        });
    });

    describe('thumbnailLink', () => {
        it('should accept a valid URL', async () => {
            dto.thumbnailLink = 'https://s3.example.com/image.png';
            const errors = await validate(dto);
            const thumbnailLinkErrors = errors.filter((e) => e.property === 'thumbnailLink');
            expect(thumbnailLinkErrors).toHaveLength(0);
        });

        it('should reject an invalid URL', async () => {
            dto.thumbnailLink = 'not-a-url';
            const errors = await validate(dto);
            const thumbnailLinkErrors = errors.filter((e) => e.property === 'thumbnailLink');
            expect(thumbnailLinkErrors.length).toBeGreaterThan(0);
        });

        it('should reject a string shorter than 2 characters', async () => {
            dto.thumbnailLink = 'h';
            const errors = await validate(dto);
            const thumbnailLinkErrors = errors.filter((e) => e.property === 'thumbnailLink');
            expect(thumbnailLinkErrors.length).toBeGreaterThan(0);
        });

        it('should accept null', async () => {
            dto.thumbnailLink = null!;
            const errors = await validate(dto);
            const thumbnailLinkErrors = errors.filter((e) => e.property === 'thumbnailLink');
            expect(thumbnailLinkErrors).toHaveLength(0);
        });

        it('should accept undefined', async () => {
            dto.thumbnailLink = undefined;
            const errors = await validate(dto);
            const thumbnailLinkErrors = errors.filter((e) => e.property === 'thumbnailLink');
            expect(thumbnailLinkErrors).toHaveLength(0);
        });

        it('should reject a non-string value', async () => {
            (dto as any).thumbnailLink = 12345;
            const errors = await validate(dto);
            const thumbnailLinkErrors = errors.filter((e) => e.property === 'thumbnailLink');
            expect(thumbnailLinkErrors.length).toBeGreaterThan(0);
        });
    });

    describe('valid combinations', () => {
        it('should accept all valid fields together', async () => {
            dto.fileId = '432715fa-b1dd-41b0-b895-bed6f3952588';
            dto.fileLink = 'https://s3.example.com/image.png';
            dto.thumbnailId = '532715fa-b1dd-41b0-b895-bed6f3952588';
            dto.thumbnailLink = 'https://s3.example.com/thumbnail.png';
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should accept empty DTO', async () => {
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });
});
