import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { NewsUpdateDto } from './news-update.dto';
import {
    NewsletterAudienceEnum,
    NewsletterChannelEnum,
    NewsletterSendModeEnum,
    NewsletterStatusEnum,
} from '../../../common/enum';

describe('NewsUpdateDto', () => {
    describe('PartialType behavior - All fields optional', () => {
        it('should pass validation with no fields provided (empty object)', async () => {
            const dto = plainToInstance(NewsUpdateDto, {});

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with only label field', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                label: 'Updated label',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
            expect(dto.label).toBe('Updated label');
        });

        it('should pass validation with only content field', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                content: 'Updated content',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
            expect(dto.content).toBe('Updated content');
        });

        it('should pass validation with only status field', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                status: NewsletterStatusEnum.SENT,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
            expect(dto.status).toBe(NewsletterStatusEnum.SENT);
        });

        it('should pass validation with only sendMode field', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                sendMode: NewsletterSendModeEnum.SCHEDULED,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
            expect(dto.sendMode).toBe(NewsletterSendModeEnum.SCHEDULED);
        });

        it('should pass validation with only channel field', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                channel: NewsletterChannelEnum.EMAIL,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
            expect(dto.channel).toBe(NewsletterChannelEnum.EMAIL);
        });

        it('should pass validation with only audience field', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                audience: NewsletterAudienceEnum.PREMIUM_USERS,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
            expect(dto.audience).toBe(NewsletterAudienceEnum.PREMIUM_USERS);
        });

        it('should pass validation with only scheduledAt field', async () => {
            const scheduledDate = '2025-12-31';
            const dto = plainToInstance(NewsUpdateDto, {
                scheduledAt: scheduledDate,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
            expect(dto.scheduledAt).toEqual(scheduledDate);
        });

        it('should pass validation with only usersIds field', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                usersIds: [
                    '20e40a0b-1147-4ed7-b475-f120bc220f0d',
                    '36af392b-dc5c-43a6-b19b-391e1a719e48',
                ],
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Partial updates - Multiple fields', () => {
        it('should pass validation with subset of fields (label and content)', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                label: 'Updated label',
                content: 'Updated content',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with subset of fields (status and sendMode)', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                status: NewsletterStatusEnum.DRAFT,
                sendMode: NewsletterSendModeEnum.SCHEDULED,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with all fields provided', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                label: 'Updated newsletter',
                content: 'Updated content here',
                status: NewsletterStatusEnum.SENT,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
                scheduledAt: '2025-12-31',
                usersIds: ['20e40a0b-1147-4ed7-b475-f120bc220f0d'],
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with usersIds and audience', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                audience: NewsletterAudienceEnum.PREMIUM_USERS,
                usersIds: [
                    '20e40a0b-1147-4ed7-b475-f120bc220f0d',
                    '36af392b-dc5c-43a6-b19b-391e1a719e48',
                ],
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Field validation still applies when provided', () => {
        it('should fail when label is provided but empty', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                label: '',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const labelError = errors.find((e) => e.property === 'label');
            expect(labelError).toBeDefined();
        });

        it('should fail when label is provided but too short', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                label: 'A',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const labelError = errors.find((e) => e.property === 'label');
            expect(labelError).toBeDefined();
            expect(labelError?.constraints).toHaveProperty('minLength');
        });

        it('should fail when label is provided but not a string', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                label: 12345,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const labelError = errors.find((e) => e.property === 'label');
            expect(labelError).toBeDefined();
            expect(labelError?.constraints).toHaveProperty('isString');
        });

        it('should fail when content is provided but empty', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                content: '',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const contentError = errors.find((e) => e.property === 'content');
            expect(contentError).toBeDefined();
        });

        it('should fail when content is provided but too short', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                content: 'X',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const contentError = errors.find((e) => e.property === 'content');
            expect(contentError).toBeDefined();
            expect(contentError?.constraints).toHaveProperty('minLength');
        });

        it('should fail when content is provided but not a string', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                content: { text: 'content' },
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const contentError = errors.find((e) => e.property === 'content');
            expect(contentError).toBeDefined();
            expect(contentError?.constraints).toHaveProperty('isString');
        });

        it('should fail when status is provided but invalid', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                status: 'INVALID_STATUS' as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const statusError = errors.find((e) => e.property === 'status');
            expect(statusError).toBeDefined();
            expect(statusError?.constraints).toHaveProperty('isEnum');
        });

        it('should fail when sendMode is provided but invalid', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                sendMode: 'INVALID_MODE' as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const sendModeError = errors.find((e) => e.property === 'sendMode');
            expect(sendModeError).toBeDefined();
            expect(sendModeError?.constraints).toHaveProperty('isEnum');
        });

        it('should fail when channel is provided but invalid', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                channel: 'INVALID_CHANNEL' as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const channelError = errors.find((e) => e.property === 'channel');
            expect(channelError).toBeDefined();
            expect(channelError?.constraints).toHaveProperty('isEnum');
        });

        it('should fail when audience is provided but invalid', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                audience: 'INVALID_AUDIENCE' as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const audienceError = errors.find((e) => e.property === 'audience');
            expect(audienceError).toBeDefined();
            expect(audienceError?.constraints).toHaveProperty('isEnum');
        });

        it('should fail when scheduledAt is provided but invalid', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                scheduledAt: 'not-a-date' as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const scheduledAtError = errors.find((e) => e.property === 'scheduledAt');
            expect(scheduledAtError).toBeDefined();
        });

        it('should fail when usersIds is provided but not an array', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                usersIds: 'not-an-array' as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const usersIdsError = errors.find((e) => e.property === 'usersIds');
            expect(usersIdsError).toBeDefined();
            expect(usersIdsError?.constraints).toHaveProperty('isArray');
        });

        it('should fail when usersIds contains invalid UUIDs', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                usersIds: ['invalid-uuid', 'not-a-uuid'],
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const usersIdsError = errors.find((e) => e.property === 'usersIds');
            expect(usersIdsError).toBeDefined();
            expect(usersIdsError?.constraints).toHaveProperty('isUuid');
        });

        it('should fail when usersIds contains duplicate UUIDs', async () => {
            const duplicateUuid = '20e40a0b-1147-4ed7-b475-f120bc220f0d';
            const dto = plainToInstance(NewsUpdateDto, {
                usersIds: [duplicateUuid, duplicateUuid],
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const usersIdsError = errors.find((e) => e.property === 'usersIds');
            expect(usersIdsError).toBeDefined();
            expect(usersIdsError?.constraints).toHaveProperty('arrayUnique');
        });

        it('should fail when usersIds contains non-string elements', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                usersIds: [123, 456] as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const usersIdsError = errors.find((e) => e.property === 'usersIds');
            expect(usersIdsError).toBeDefined();
            expect(usersIdsError?.constraints).toHaveProperty('isString');
        });

        it('should fail when usersIds contains strings shorter than minLength', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                usersIds: ['a'],
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const usersIdsError = errors.find((e) => e.property === 'usersIds');
            expect(usersIdsError).toBeDefined();
            expect(usersIdsError?.constraints).toHaveProperty('minLength');
        });
    });

    describe('Valid field updates', () => {
        it('should pass with valid label meeting minimum length', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                label: 'AB',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass with valid content meeting minimum length', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                content: 'XY',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass with all valid enum values', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                status: NewsletterStatusEnum.FAILED,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.NOTIFICATION,
                audience: NewsletterAudienceEnum.ALL_USERS,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass with valid usersIds array', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                usersIds: [
                    '72f615c2-b734-41ae-b7f0-74856b1e1f91',
                    '62aa199a-8776-4d95-859e-15c57c917017',
                ],
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass with empty usersIds array', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                usersIds: [],
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Edge cases and special scenarios', () => {
        it('should handle null values gracefully (fields not provided)', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                label: null,
                content: null,
            });

            const errors = await validate(dto);
            // PartialType makes fields optional, so null should be treated as not provided
            expect(errors.length).toBe(0);
        });

        it('should handle undefined values gracefully (fields not provided)', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                label: undefined,
                content: undefined,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail with multiple invalid fields', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                label: 'A',
                content: 'B',
                status: 'INVALID' as any,
                channel: 12345 as any,
                usersIds: ['invalid-uuid'],
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);

            const errorProperties = errors.map((e) => e.property);
            expect(errorProperties).toContain('label');
            expect(errorProperties).toContain('content');
            expect(errorProperties).toContain('status');
            expect(errorProperties).toContain('channel');
            expect(errorProperties).toContain('usersIds');
        });

        it('should pass with mix of valid and omitted fields', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                label: 'Valid label',
                // content omitted
                status: NewsletterStatusEnum.PENDING,
                // sendMode omitted
                channel: NewsletterChannelEnum.EMAIL,
                // audience omitted
                usersIds: ['20e40a0b-1147-4ed7-b475-f120bc220f0d'],
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should validate whitespace strings when provided', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                label: '   ',
                content: '\t\t',
            });

            await validate(dto);
            expect(dto.label).toBe('   ');
            expect(dto.content).toBe('\t\t');
        });

        it('should handle null in optional usersIds field', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                usersIds: null,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should handle undefined in optional usersIds field', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                usersIds: undefined,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Practical update scenarios', () => {
        it('should allow updating only the status (e.g., marking as sent)', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                status: NewsletterStatusEnum.SENT,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should allow rescheduling by updating only scheduledAt', async () => {
            const newDate = '2026-01-15';
            const dto = plainToInstance(NewsUpdateDto, {
                scheduledAt: newDate,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
            expect(dto.scheduledAt).toEqual(newDate);
        });

        it('should allow changing target audience without other changes', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                audience: NewsletterAudienceEnum.PREMIUM_USERS,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should allow updating content and status together', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                content: 'Updated newsletter content',
                status: NewsletterStatusEnum.DRAFT,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should allow switching from immediate to scheduled send', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                sendMode: NewsletterSendModeEnum.SCHEDULED,
                scheduledAt: '2025-12-31',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should allow updating only usersIds (changing target users)', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                usersIds: [
                    '20e40a0b-1147-4ed7-b475-f120bc220f0d',
                    '36af392b-dc5c-43a6-b19b-391e1a719e48',
                ],
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should allow clearing usersIds with empty array', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                usersIds: [],
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should allow updating audience and usersIds together', async () => {
            const dto = plainToInstance(NewsUpdateDto, {
                audience: NewsletterAudienceEnum.PREMIUM_USERS,
                usersIds: ['550e8400-e29b-41d4-a716-446655440000'],
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Type inheritance verification', () => {
        it('should be an instance of NewsUpdateDto', () => {
            const dto = plainToInstance(NewsUpdateDto, {
                label: 'Test',
            });

            expect(dto).toBeInstanceOf(NewsUpdateDto);
        });
    });
});
