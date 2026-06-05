import { validate } from 'class-validator';
import { BaseSendMessageDto } from './base-send-message.dto';

describe('BaseSendMessageDto', () => {
    const validUUID = '7f3f5860-a780-41a0-8484-4990a811ddd9';
    const anotherValidUUID = '1a2b3c4d-1234-4abc-8def-1234567890ab';

    function buildDto(overrides: Partial<BaseSendMessageDto> = {}): BaseSendMessageDto {
        const dto = new BaseSendMessageDto();
        Object.assign(dto, overrides);
        return dto;
    }

    async function getErrors(dto: BaseSendMessageDto) {
        return validate(dto);
    }

    describe('empty DTO', () => {
        it('should pass with no fields provided (all optional)', async () => {
            const errors = await getErrors(buildDto());
            expect(errors).toHaveLength(0);
        });
    });

    describe('content', () => {
        it('should pass when content is omitted', async () => {
            const errors = await getErrors(buildDto());
            expect(errors.some((e) => e.property === 'content')).toBe(false);
        });

        it('should pass with a valid string', async () => {
            const errors = await getErrors(buildDto({ content: 'Hello World!' }));
            expect(errors.some((e) => e.property === 'content')).toBe(false);
        });

        it('should pass with a single character string (minLength 1)', async () => {
            const errors = await getErrors(buildDto({ content: 'a' }));
            expect(errors.some((e) => e.property === 'content')).toBe(false);
        });

        it('should fail when content is an empty string (violates minLength 1)', async () => {
            const errors = await getErrors(buildDto({ content: '' }));
            expect(errors.some((e) => e.property === 'content')).toBe(true);
        });

        it('should fail when content is not a string', async () => {
            const errors = await getErrors(buildDto({ content: 123 as any }));
            expect(errors.some((e) => e.property === 'content')).toBe(true);
        });

        it('should pass when content is null', async () => {
            const errors = await getErrors(buildDto({ content: null as any }));
            expect(errors.some((e) => e.property === 'content')).toBe(false);
        });
    });

    describe('messagesId', () => {
        it('should pass when messagesId is omitted', async () => {
            const errors = await getErrors(buildDto());
            expect(errors.some((e) => e.property === 'messagesId')).toBe(false);
        });

        it('should pass with a valid string', async () => {
            const errors = await getErrors(buildDto({ messagesId: validUUID }));
            expect(errors.some((e) => e.property === 'messagesId')).toBe(false);
        });

        it('should pass with a single character string (minLength 1)', async () => {
            const errors = await getErrors(buildDto({ messagesId: 'x' }));
            expect(errors.some((e) => e.property === 'messagesId')).toBe(false);
        });

        it('should fail when messagesId is an empty string (violates minLength 1)', async () => {
            const errors = await getErrors(buildDto({ messagesId: '' }));
            expect(errors.some((e) => e.property === 'messagesId')).toBe(true);
        });

        it('should fail when messagesId is not a string', async () => {
            const errors = await getErrors(buildDto({ messagesId: 42 as any }));
            expect(errors.some((e) => e.property === 'messagesId')).toBe(true);
        });

        it('should pass when messagesId is null', async () => {
            const errors = await getErrors(buildDto({ messagesId: null as any }));
            expect(errors.some((e) => e.property === 'messagesId')).toBe(false);
        });
    });

    describe('files', () => {
        it('should pass when files is omitted', async () => {
            const errors = await getErrors(buildDto());
            expect(errors.some((e) => e.property === 'files')).toBe(false);
        });

        it('should pass with a valid array of unique UUID v4 strings', async () => {
            const errors = await getErrors(buildDto({ files: [validUUID, anotherValidUUID] }));
            expect(errors.some((e) => e.property === 'files')).toBe(false);
        });

        it('should pass with a single UUID v4 in the array', async () => {
            const errors = await getErrors(buildDto({ files: [validUUID] }));
            expect(errors.some((e) => e.property === 'files')).toBe(false);
        });

        it('should fail when files contains a non-UUID string', async () => {
            const errors = await getErrors(buildDto({ files: ['not-a-uuid'] }));
            expect(errors.some((e) => e.property === 'files')).toBe(true);
        });

        it('should fail when files contains a UUID v1 (not v4)', async () => {
            const errors = await getErrors(
                buildDto({ files: ['6ba7b810-9dad-11d1-80b4-00c04fd430c8'] }),
            );
            expect(errors.some((e) => e.property === 'files')).toBe(true);
        });

        it('should fail when files contains duplicate values (ArrayUnique)', async () => {
            const errors = await getErrors(buildDto({ files: [validUUID, validUUID] }));
            expect(errors.some((e) => e.property === 'files')).toBe(true);
        });

        it('should fail when files is not an array', async () => {
            const errors = await getErrors(buildDto({ files: 'not-an-array' as any }));
            expect(errors.some((e) => e.property === 'files')).toBe(true);
        });

        it('should fail when files contains empty strings (violates minLength 1)', async () => {
            const errors = await getErrors(buildDto({ files: [''] }));
            expect(errors.some((e) => e.property === 'files')).toBe(true);
        });

        it('should fail when files contains non-string elements', async () => {
            const errors = await getErrors(buildDto({ files: [123 as any] }));
            expect(errors.some((e) => e.property === 'files')).toBe(true);
        });

        it('should pass when files is null', async () => {
            const errors = await getErrors(buildDto({ files: null as any }));
            expect(errors.some((e) => e.property === 'files')).toBe(false);
        });
    });

    describe('full valid payload', () => {
        it('should pass with all fields provided and valid', async () => {
            const errors = await getErrors(
                buildDto({
                    content: 'Hello World!',
                    messagesId: validUUID,
                    files: [validUUID, anotherValidUUID],
                }),
            );
            expect(errors).toHaveLength(0);
        });
    });
});
