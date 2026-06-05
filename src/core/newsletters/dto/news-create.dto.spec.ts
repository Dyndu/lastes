import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { NewsCreateDto } from './news-create.dto';
import {
    NewsletterAudienceEnum,
    NewsletterChannelEnum,
    NewsletterSendModeEnum,
    NewsletterStatusEnum,
} from '../../../common/enum';

describe('NewsCreateDto', () => {
    describe('Valid scenarios', () => {
        it('should pass validation with all required fields and valid data', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                content: 'Your subscriptions expired',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with all fields including optional scheduledAt', async () => {
            const scheduledDate = '2025-12-31';
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                content: 'Your subscriptions expired',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
                scheduledAt: scheduledDate,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
            expect(dto.scheduledAt).toEqual(scheduledDate);
        });

        it('should pass validation with all fields including optional usersIds', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                content: 'Your subscriptions expired',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
                usersIds: [
                    '20e40a0b-1147-4ed7-b475-f120bc220f0d',
                    '36af392b-dc5c-43a6-b19b-391e1a719e48',
                ],
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with all optional fields (scheduledAt and usersIds)', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                content: 'Your subscriptions expired',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
                scheduledAt: '2025-12-31',
                usersIds: ['20e40a0b-1147-4ed7-b475-f120bc220f0d'],
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with different enum values', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'New feature announcement',
                content: 'We have exciting new features',
                status: NewsletterStatusEnum.SENT,
                sendMode: NewsletterSendModeEnum.SCHEDULED,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.PREMIUM_USERS,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with minimum string length (2 characters)', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'AB',
                content: 'CD',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Label field validation', () => {
        it('should fail when label is missing', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                content: 'Your subscriptions expired',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const labelError = errors.find((e) => e.property === 'label');
            expect(labelError).toBeDefined();
            expect(labelError?.constraints).toHaveProperty('isNotEmpty');
        });

        it('should fail when label is empty string', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: '',
                content: 'Your subscriptions expired',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const labelError = errors.find((e) => e.property === 'label');
            expect(labelError).toBeDefined();
        });

        it('should fail when label is not a string', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 12345,
                content: 'Your subscriptions expired',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const labelError = errors.find((e) => e.property === 'label');
            expect(labelError).toBeDefined();
            expect(labelError?.constraints).toHaveProperty('isString');
        });

        it('should fail when label is less than minimum length (2 characters)', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'A',
                content: 'Your subscriptions expired',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const labelError = errors.find((e) => e.property === 'label');
            expect(labelError).toBeDefined();
            expect(labelError?.constraints).toHaveProperty('minLength');
        });
    });

    describe('Content field validation', () => {
        it('should fail when content is missing', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const contentError = errors.find((e) => e.property === 'content');
            expect(contentError).toBeDefined();
            expect(contentError?.constraints).toHaveProperty('isNotEmpty');
        });

        it('should fail when content is empty string', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                content: '',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const contentError = errors.find((e) => e.property === 'content');
            expect(contentError).toBeDefined();
        });

        it('should fail when content is not a string', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                content: { text: 'Your subscriptions expired' },
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const contentError = errors.find((e) => e.property === 'content');
            expect(contentError).toBeDefined();
            expect(contentError?.constraints).toHaveProperty('isString');
        });

        it('should fail when content is less than minimum length', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                content: 'X',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const contentError = errors.find((e) => e.property === 'content');
            expect(contentError).toBeDefined();
            expect(contentError?.constraints).toHaveProperty('minLength');
        });
    });

    describe('Status enum field validation', () => {
        it('should fail when status is missing', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                content: 'Your subscriptions expired',
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const statusError = errors.find((e) => e.property === 'status');
            expect(statusError).toBeDefined();
            expect(statusError?.constraints).toHaveProperty('isNotEmpty');
        });

        it('should fail when status is invalid enum value', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                content: 'Your subscriptions expired',
                status: 'INVALID_STATUS' as any,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const statusError = errors.find((e) => e.property === 'status');
            expect(statusError).toBeDefined();
            expect(statusError?.constraints).toHaveProperty('isEnum');
        });
    });

    describe('SendMode enum field validation', () => {
        it('should fail when sendMode is missing', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                content: 'Your subscriptions expired',
                status: NewsletterStatusEnum.PENDING,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const sendModeError = errors.find((e) => e.property === 'sendMode');
            expect(sendModeError).toBeDefined();
            expect(sendModeError?.constraints).toHaveProperty('isNotEmpty');
        });

        it('should fail when sendMode is invalid enum value', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                content: 'Your subscriptions expired',
                status: NewsletterStatusEnum.PENDING,
                sendMode: 'INVALID_MODE' as any,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const sendModeError = errors.find((e) => e.property === 'sendMode');
            expect(sendModeError).toBeDefined();
            expect(sendModeError?.constraints).toHaveProperty('isEnum');
        });
    });

    describe('Channel enum field validation', () => {
        it('should fail when channel is missing', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                content: 'Your subscriptions expired',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                audience: NewsletterAudienceEnum.ALL_USERS,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const channelError = errors.find((e) => e.property === 'channel');
            expect(channelError).toBeDefined();
            expect(channelError?.constraints).toHaveProperty('isNotEmpty');
        });

        it('should fail when channel is invalid enum value', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                content: 'Your subscriptions expired',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: 'INVALID_CHANNEL' as any,
                audience: NewsletterAudienceEnum.ALL_USERS,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const channelError = errors.find((e) => e.property === 'channel');
            expect(channelError).toBeDefined();
            expect(channelError?.constraints).toHaveProperty('isEnum');
        });
    });

    describe('Audience enum field validation', () => {
        it('should fail when audience is missing', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                content: 'Your subscriptions expired',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const audienceError = errors.find((e) => e.property === 'audience');
            expect(audienceError).toBeDefined();
            expect(audienceError?.constraints).toHaveProperty('isNotEmpty');
        });

        it('should fail when audience is invalid enum value', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                content: 'Your subscriptions expired',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: 'INVALID_AUDIENCE' as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const audienceError = errors.find((e) => e.property === 'audience');
            expect(audienceError).toBeDefined();
            expect(audienceError?.constraints).toHaveProperty('isEnum');
        });
    });

    describe('ScheduledAt optional field validation', () => {
        it('should pass validation when scheduledAt is not provided (optional field)', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                content: 'Your subscriptions expired',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation when scheduledAt is a valid date', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                content: 'Your subscriptions expired',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.SCHEDULED,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
                scheduledAt: '2025-12-31',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail when scheduledAt is not a valid date', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                content: 'Your subscriptions expired',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.SCHEDULED,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
                scheduledAt: 'not-a-date' as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const scheduledAtError = errors.find((e) => e.property === 'scheduledAt');
            expect(scheduledAtError).toBeDefined();
        });
    });

    describe('UsersIds optional array field validation', () => {
        it('should pass validation when usersIds is not provided (optional field)', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                content: 'Your subscriptions expired',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with valid UUID array', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                content: 'Your subscriptions expired',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
                usersIds: [
                    '20e40a0b-1147-4ed7-b475-f120bc220f0d',
                    '36af392b-dc5c-43a6-b19b-391e1a719e48',
                ],
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with single valid UUID', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                content: 'Your subscriptions expired',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
                usersIds: ['20e40a0b-1147-4ed7-b475-f120bc220f0d'],
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail when usersIds is not an array', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                content: 'Your subscriptions expired',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
                usersIds: 'not-an-array' as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const usersIdsError = errors.find((e) => e.property === 'usersIds');
            expect(usersIdsError).toBeDefined();
            expect(usersIdsError?.constraints).toHaveProperty('isArray');
        });

        it('should fail when usersIds contains non-string elements', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                content: 'Your subscriptions expired',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
                usersIds: [123, 456] as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const usersIdsError = errors.find((e) => e.property === 'usersIds');
            expect(usersIdsError).toBeDefined();
            expect(usersIdsError?.constraints).toHaveProperty('isString');
        });

        it('should fail when usersIds contains invalid UUIDs', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                content: 'Your subscriptions expired',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
                usersIds: ['invalid-uuid', 'not-a-uuid'],
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const usersIdsError = errors.find((e) => e.property === 'usersIds');
            expect(usersIdsError).toBeDefined();
            expect(usersIdsError?.constraints).toHaveProperty('isUuid');
        });

        it('should fail when usersIds contains strings shorter than minLength', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                content: 'Your subscriptions expired',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
                usersIds: ['a'],
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const usersIdsError = errors.find((e) => e.property === 'usersIds');
            expect(usersIdsError).toBeDefined();
            expect(usersIdsError?.constraints).toHaveProperty('minLength');
        });

        it('should fail when usersIds contains duplicate UUIDs', async () => {
            const duplicateUuid = '20e40a0b-1147-4ed7-b475-f120bc220f0d';
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                content: 'Your subscriptions expired',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
                usersIds: [duplicateUuid, duplicateUuid],
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const usersIdsError = errors.find((e) => e.property === 'usersIds');
            expect(usersIdsError).toBeDefined();
            expect(usersIdsError?.constraints).toHaveProperty('arrayUnique');
        });

        it('should pass with empty array when field is optional', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                content: 'Your subscriptions expired',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
                usersIds: [],
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass with multiple valid UUIDs (v4)', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                content: 'Your subscriptions expired',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
                usersIds: [
                    'f80ed476-a64a-4840-944c-29cb515149a8',
                    '72f615c2-b734-41ae-b7f0-74856b1e1f91',
                    '62aa199a-8776-4d95-859e-15c57c917017',
                ],
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Multiple validation errors', () => {
        it('should return multiple errors when multiple fields are invalid', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: '',
                content: 'X',
                status: 'INVALID' as any,
                sendMode: 'INVALID' as any,
                channel: 123 as any,
                audience: null as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);

            // Check that we have errors for multiple fields
            const errorProperties = errors.map((e) => e.property);
            expect(errorProperties).toContain('label');
            expect(errorProperties).toContain('content');
            expect(errorProperties).toContain('status');
            expect(errorProperties).toContain('sendMode');
            expect(errorProperties).toContain('channel');
            expect(errorProperties).toContain('audience');
        });

        it('should return errors for both required and optional fields when invalid', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'A',
                content: 'Your subscriptions expired',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
                scheduledAt: 'invalid-date' as any,
                usersIds: ['invalid-uuid'],
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);

            const errorProperties = errors.map((e) => e.property);
            expect(errorProperties).toContain('label');
            expect(errorProperties).toContain('scheduledAt');
            expect(errorProperties).toContain('usersIds');
        });
    });

    describe('Edge cases', () => {
        it('should handle null values in required fields', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: null,
                content: null,
                status: null,
                sendMode: null,
                channel: null,
                audience: null,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should handle undefined values in required fields', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: undefined,
                content: undefined,
                status: undefined,
                sendMode: undefined,
                channel: undefined,
                audience: undefined,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should handle whitespace-only strings', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: '   ',
                content: '   ',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
            });

            await validate(dto);
            expect(dto.label).toBe('   ');
        });

        it('should handle null in optional usersIds field', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                content: 'Your subscriptions expired',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
                usersIds: null,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should handle undefined in optional usersIds field', async () => {
            const dto = plainToInstance(NewsCreateDto, {
                label: 'Subscription expired',
                content: 'Your subscriptions expired',
                status: NewsletterStatusEnum.PENDING,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                channel: NewsletterChannelEnum.EMAIL,
                audience: NewsletterAudienceEnum.ALL_USERS,
                usersIds: undefined,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });
});
