import { validate } from 'class-validator';
import { AdminSendMessageDto } from './admin-send-message.dto';

describe('AdminSendMessageDto', () => {
    const validUUID = '7f3f5860-a780-41a0-8484-4990a811ddd9';

    function buildDto(overrides: Partial<AdminSendMessageDto> = {}): AdminSendMessageDto {
        const dto = new AdminSendMessageDto();
        dto.conId = validUUID;
        Object.assign(dto, overrides);
        return dto;
    }

    async function getErrors(dto: AdminSendMessageDto) {
        return validate(dto);
    }

    describe('conId', () => {
        it('should pass with a valid UUID v4', async () => {
            const errors = await getErrors(buildDto());
            const conIdErrors = errors.filter((e) => e.property === 'conId');
            expect(conIdErrors).toHaveLength(0);
        });

        it('should fail when conId is missing', async () => {
            const dto = buildDto();
            delete (dto as any).conId;
            const errors = await getErrors(dto);
            expect(errors.some((e) => e.property === 'conId')).toBe(true);
        });

        it('should fail when conId is an empty string', async () => {
            const errors = await getErrors(buildDto({ conId: '' }));
            expect(errors.some((e) => e.property === 'conId')).toBe(true);
        });

        it('should fail when conId is not a valid UUID', async () => {
            const errors = await getErrors(buildDto({ conId: 'not-a-uuid' }));
            expect(errors.some((e) => e.property === 'conId')).toBe(true);
        });

        it('should fail when conId is a UUID v1 (not v4)', async () => {
            const errors = await getErrors(
                buildDto({ conId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' }),
            );
            expect(errors.some((e) => e.property === 'conId')).toBe(true);
        });
    });

    describe('content (inherited from BaseSendMessageDto)', () => {
        it('should pass when content is omitted', async () => {
            const errors = await getErrors(buildDto());
            expect(errors.some((e) => e.property === 'content')).toBe(false);
        });

        it('should pass with a valid content string', async () => {
            const errors = await getErrors(buildDto({ content: 'Hello World!' }));
            expect(errors.some((e) => e.property === 'content')).toBe(false);
        });

        it('should fail when content is an empty string (minLength 1)', async () => {
            const errors = await getErrors(buildDto({ content: '' }));
            expect(errors.some((e) => e.property === 'content')).toBe(true);
        });

        it('should fail when content is not a string', async () => {
            const errors = await getErrors(buildDto({ content: 123 as any }));
            expect(errors.some((e) => e.property === 'content')).toBe(true);
        });
    });

    describe('messagesId (inherited from BaseSendMessageDto)', () => {
        it('should pass when messagesId is omitted', async () => {
            const errors = await getErrors(buildDto());
            expect(errors.some((e) => e.property === 'messagesId')).toBe(false);
        });

        it('should pass with a valid messagesId string', async () => {
            const errors = await getErrors(buildDto({ messagesId: validUUID }));
            expect(errors.some((e) => e.property === 'messagesId')).toBe(false);
        });

        it('should fail when messagesId is an empty string', async () => {
            const errors = await getErrors(buildDto({ messagesId: '' }));
            expect(errors.some((e) => e.property === 'messagesId')).toBe(true);
        });

        it('should fail when messagesId is not a string', async () => {
            const errors = await getErrors(buildDto({ messagesId: 42 as any }));
            expect(errors.some((e) => e.property === 'messagesId')).toBe(true);
        });
    });

    describe('files (inherited from BaseSendMessageDto)', () => {
        it('should pass when files is omitted', async () => {
            const errors = await getErrors(buildDto());
            expect(errors.some((e) => e.property === 'files')).toBe(false);
        });

        it('should pass with a valid array of UUID v4 strings', async () => {
            const errors = await getErrors(buildDto({ files: [validUUID] }));
            expect(errors.some((e) => e.property === 'files')).toBe(false);
        });

        it('should fail when files contains a non-UUID string', async () => {
            const errors = await getErrors(buildDto({ files: ['not-a-uuid'] }));
            expect(errors.some((e) => e.property === 'files')).toBe(true);
        });

        it('should fail when files contains duplicate values', async () => {
            const errors = await getErrors(buildDto({ files: [validUUID, validUUID] }));
            expect(errors.some((e) => e.property === 'files')).toBe(true);
        });

        it('should fail when files is not an array', async () => {
            const errors = await getErrors(buildDto({ files: 'not-an-array' as any }));
            expect(errors.some((e) => e.property === 'files')).toBe(true);
        });

        it('should fail when files contains empty strings (minLength 1)', async () => {
            const errors = await getErrors(buildDto({ files: [''] }));
            expect(errors.some((e) => e.property === 'files')).toBe(true);
        });
    });

    describe('full valid payload', () => {
        it('should pass with all fields valid', async () => {
            const dto = buildDto({
                content: 'Hello World!',
                messagesId: validUUID,
                files: [validUUID],
            });
            dto.files = [validUUID, '1a2b3c4d-1234-4abc-8def-1234567890ab'];
            const errors = await getErrors(dto);
            expect(errors).toHaveLength(0);
        });
    });
});
