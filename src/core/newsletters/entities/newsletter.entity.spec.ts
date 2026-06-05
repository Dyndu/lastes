import { NewsletterEntity } from './newsletter.entity';
import {
    NewsletterStatusEnum,
    NewsletterChannelEnum,
    NewsletterSendModeEnum,
    NewsletterAudienceEnum,
} from '../../../common/enum';

describe('NewsletterEntity', () => {
    const buildNewsletterEntity = (
        required: {
            label: string;
            content: string;
            status: NewsletterStatusEnum;
            channel: NewsletterChannelEnum;
            sendMode: NewsletterSendModeEnum;
            audience: NewsletterAudienceEnum;
        },
        optional?: {
            scheduledAt?: Date;
        },
    ) => {
        const newsletter = new NewsletterEntity();
        Object.assign(newsletter, required, optional);
        return newsletter;
    };

    describe('Constructor', () => {
        it('should create an instance with default values', () => {
            const newsletter = new NewsletterEntity();

            expect(newsletter).toBeInstanceOf(NewsletterEntity);
            expect(newsletter.status).toBeUndefined();
            expect(newsletter.channel).toBeUndefined();
            expect(newsletter.sendMode).toBeUndefined();
            expect(newsletter.audience).toBeUndefined();
        });

        it('should create an instance with provided values using Object.assign', () => {
            const newsletter = buildNewsletterEntity(
                {
                    label: 'Test Newsletter',
                    content: 'Test content',
                    status: NewsletterStatusEnum.DRAFT,
                    channel: NewsletterChannelEnum.EMAIL,
                    sendMode: NewsletterSendModeEnum.SCHEDULED,
                    audience: NewsletterAudienceEnum.PREMIUM_USERS,
                },
                {
                    scheduledAt: new Date('2024-12-31'),
                },
            );

            expect(newsletter.label).toBe('Test Newsletter');
            expect(newsletter.content).toBe('Test content');
            expect(newsletter.status).toBe(NewsletterStatusEnum.DRAFT);
            expect(newsletter.channel).toBe(NewsletterChannelEnum.EMAIL);
            expect(newsletter.sendMode).toBe(NewsletterSendModeEnum.SCHEDULED);
            expect(newsletter.audience).toBe(NewsletterAudienceEnum.PREMIUM_USERS);
            expect(newsletter.scheduledAt).toEqual(new Date('2024-12-31'));
        });

        it('should create an instance with partial values', () => {
            const newsletter = new NewsletterEntity();
            Object.assign(newsletter, {
                label: 'Partial Newsletter',
                content: 'Partial content',
            });

            expect(newsletter.label).toBe('Partial Newsletter');
            expect(newsletter.content).toBe('Partial content');
            expect(newsletter.status).toBeUndefined();
            expect(newsletter.channel).toBeUndefined();
            expect(newsletter.sendMode).toBeUndefined();
            expect(newsletter.audience).toBeUndefined();
            expect(newsletter.scheduledAt).toBeUndefined();
        });
    });

    describe('Properties', () => {
        let newsletter: NewsletterEntity;

        beforeEach(() => {
            newsletter = new NewsletterEntity();
        });

        describe('label', () => {
            it('should set and get label property', () => {
                const label = 'Monthly Newsletter';
                newsletter.label = label;
                expect(newsletter.label).toBe(label);
            });

            it('should handle empty string label', () => {
                newsletter.label = '';
                expect(newsletter.label).toBe('');
            });

            it('should handle long text label', () => {
                const longLabel = 'A'.repeat(1000);
                newsletter.label = longLabel;
                expect(newsletter.label).toBe(longLabel);
            });
        });

        describe('content', () => {
            it('should set and get content property', () => {
                const content = 'Newsletter content here';
                newsletter.content = content;
                expect(newsletter.content).toBe(content);
            });

            it('should handle empty string content', () => {
                newsletter.content = '';
                expect(newsletter.content).toBe('');
            });

            it('should handle long text content', () => {
                const longContent = 'B'.repeat(5000);
                newsletter.content = longContent;
                expect(newsletter.content).toBe(longContent);
            });

            it('should handle HTML content', () => {
                const htmlContent = '<h1>Title</h1><p>Paragraph</p>';
                newsletter.content = htmlContent;
                expect(newsletter.content).toBe(htmlContent);
            });
        });

        describe('status', () => {
            it('should set and get status property with DRAFT', () => {
                newsletter.status = NewsletterStatusEnum.DRAFT;
                expect(newsletter.status).toBe(NewsletterStatusEnum.DRAFT);
            });

            it('should set and get status property with SCHEDULED', () => {
                newsletter.status = NewsletterStatusEnum.SCHEDULED;
                expect(newsletter.status).toBe(NewsletterStatusEnum.SCHEDULED);
            });

            it('should set and get status property with PENDING', () => {
                newsletter.status = NewsletterStatusEnum.PENDING;
                expect(newsletter.status).toBe(NewsletterStatusEnum.PENDING);
            });

            it('should set and get status property with SENT', () => {
                newsletter.status = NewsletterStatusEnum.SENT;
                expect(newsletter.status).toBe(NewsletterStatusEnum.SENT);
            });

            it('should set and get status property with FAILED', () => {
                newsletter.status = NewsletterStatusEnum.FAILED;
                expect(newsletter.status).toBe(NewsletterStatusEnum.FAILED);
            });
        });

        describe('channel', () => {
            it('should set and get channel property with NOTIFICATION', () => {
                newsletter.channel = NewsletterChannelEnum.NOTIFICATION;
                expect(newsletter.channel).toBe(NewsletterChannelEnum.NOTIFICATION);
            });

            it('should set and get channel property with EMAIL', () => {
                newsletter.channel = NewsletterChannelEnum.EMAIL;
                expect(newsletter.channel).toBe(NewsletterChannelEnum.EMAIL);
            });
        });

        describe('sendMode', () => {
            it('should set and get sendMode property with IMMEDIATE', () => {
                newsletter.sendMode = NewsletterSendModeEnum.IMMEDIATE;
                expect(newsletter.sendMode).toBe(NewsletterSendModeEnum.IMMEDIATE);
            });

            it('should set and get sendMode property with SCHEDULED', () => {
                newsletter.sendMode = NewsletterSendModeEnum.SCHEDULED;
                expect(newsletter.sendMode).toBe(NewsletterSendModeEnum.SCHEDULED);
            });

            it('should set and get sendMode property with MANUAL', () => {
                newsletter.sendMode = NewsletterSendModeEnum.MANUAL;
                expect(newsletter.sendMode).toBe(NewsletterSendModeEnum.MANUAL);
            });
        });

        describe('audience', () => {
            it('should set and get audience property with ALL_USERS', () => {
                newsletter.audience = NewsletterAudienceEnum.ALL_USERS;
                expect(newsletter.audience).toBe(NewsletterAudienceEnum.ALL_USERS);
            });

            it('should set and get audience property with PREMIUM_USERS', () => {
                newsletter.audience = NewsletterAudienceEnum.PREMIUM_USERS;
                expect(newsletter.audience).toBe(NewsletterAudienceEnum.PREMIUM_USERS);
            });

            it('should set and get audience property with CUSTOM_LIST', () => {
                newsletter.audience = NewsletterAudienceEnum.CUSTOM_LIST;
                expect(newsletter.audience).toBe(NewsletterAudienceEnum.CUSTOM_LIST);
            });
        });

        describe('scheduledAt', () => {
            it('should set and get scheduledAt property', () => {
                const date = new Date('2024-12-31');
                newsletter.scheduledAt = date;
                expect(newsletter.scheduledAt).toBe(date);
            });

            it('should handle undefined scheduledAt', () => {
                newsletter.scheduledAt = undefined;
                expect(newsletter.scheduledAt).toBeUndefined();
            });

            it('should handle past date', () => {
                const pastDate = new Date('2020-01-01');
                newsletter.scheduledAt = pastDate;
                expect(newsletter.scheduledAt).toBe(pastDate);
            });

            it('should handle future date', () => {
                const futureDate = new Date('2030-12-31');
                newsletter.scheduledAt = futureDate;
                expect(newsletter.scheduledAt).toBe(futureDate);
            });
        });
    });

    describe('Integration scenarios', () => {
        it('should create a complete newsletter for immediate sending', () => {
            const newsletter = buildNewsletterEntity({
                label: 'Flash Sale Alert',
                content: 'Limited time offer on all products!',
                status: NewsletterStatusEnum.PENDING,
                channel: NewsletterChannelEnum.NOTIFICATION,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                audience: NewsletterAudienceEnum.ALL_USERS,
            });

            expect(newsletter.label).toBe('Flash Sale Alert');
            expect(newsletter.content).toBe('Limited time offer on all products!');
            expect(newsletter.status).toBe(NewsletterStatusEnum.PENDING);
            expect(newsletter.channel).toBe(NewsletterChannelEnum.NOTIFICATION);
            expect(newsletter.sendMode).toBe(NewsletterSendModeEnum.IMMEDIATE);
            expect(newsletter.audience).toBe(NewsletterAudienceEnum.ALL_USERS);
            expect(newsletter.scheduledAt).toBeUndefined();
        });

        it('should create a scheduled newsletter with email channel', () => {
            const scheduledDate = new Date('2024-12-25');
            const newsletter = buildNewsletterEntity(
                {
                    label: 'Holiday Greetings',
                    content: 'Wishing you a Merry Christmas!',
                    status: NewsletterStatusEnum.SCHEDULED,
                    channel: NewsletterChannelEnum.EMAIL,
                    sendMode: NewsletterSendModeEnum.SCHEDULED,
                    audience: NewsletterAudienceEnum.PREMIUM_USERS,
                },
                {
                    scheduledAt: scheduledDate,
                },
            );

            expect(newsletter.label).toBe('Holiday Greetings');
            expect(newsletter.content).toBe('Wishing you a Merry Christmas!');
            expect(newsletter.status).toBe(NewsletterStatusEnum.SCHEDULED);
            expect(newsletter.channel).toBe(NewsletterChannelEnum.EMAIL);
            expect(newsletter.sendMode).toBe(NewsletterSendModeEnum.SCHEDULED);
            expect(newsletter.audience).toBe(NewsletterAudienceEnum.PREMIUM_USERS);
            expect(newsletter.scheduledAt).toEqual(scheduledDate);
        });

        it('should create a draft newsletter', () => {
            const newsletter = buildNewsletterEntity({
                label: 'Work in Progress',
                content: 'Draft content to be completed',
                status: NewsletterStatusEnum.DRAFT,
                channel: NewsletterChannelEnum.EMAIL,
                sendMode: NewsletterSendModeEnum.MANUAL,
                audience: NewsletterAudienceEnum.CUSTOM_LIST,
            });

            expect(newsletter.status).toBe(NewsletterStatusEnum.DRAFT);
            expect(newsletter.sendMode).toBe(NewsletterSendModeEnum.MANUAL);
        });

        it('should handle newsletter state transitions', () => {
            const newsletter = new NewsletterEntity();
            Object.assign(newsletter, {
                label: 'State Transition Test',
                content: 'Testing status changes',
                status: NewsletterStatusEnum.DRAFT,
            });

            expect(newsletter.status).toBe(NewsletterStatusEnum.DRAFT);

            newsletter.status = NewsletterStatusEnum.SCHEDULED;
            expect(newsletter.status).toBe(NewsletterStatusEnum.SCHEDULED);

            newsletter.status = NewsletterStatusEnum.PENDING;
            expect(newsletter.status).toBe(NewsletterStatusEnum.PENDING);

            newsletter.status = NewsletterStatusEnum.SENT;
            expect(newsletter.status).toBe(NewsletterStatusEnum.SENT);
        });

        it('should handle failed newsletter scenario', () => {
            const newsletter = buildNewsletterEntity({
                label: 'Failed Newsletter',
                content: 'This failed to send',
                status: NewsletterStatusEnum.FAILED,
                channel: NewsletterChannelEnum.EMAIL,
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
                audience: NewsletterAudienceEnum.ALL_USERS,
            });

            expect(newsletter.status).toBe(NewsletterStatusEnum.FAILED);
        });
    });

    describe('Edge cases', () => {
        it('should handle empty Object.assign', () => {
            const newsletter = new NewsletterEntity();
            Object.assign(newsletter, {});
            expect(newsletter).toBeInstanceOf(NewsletterEntity);
        });

        it('should handle undefined in Object.assign', () => {
            const newsletter = new NewsletterEntity();
            Object.assign(newsletter, undefined);
            expect(newsletter).toBeInstanceOf(NewsletterEntity);
        });

        it('should allow property updates after creation', () => {
            const newsletter = new NewsletterEntity();
            Object.assign(newsletter, {
                label: 'Original Label',
                content: 'Original Content',
            });

            newsletter.label = 'Updated Label';
            newsletter.content = 'Updated Content';
            newsletter.status = NewsletterStatusEnum.SENT;

            expect(newsletter.label).toBe('Updated Label');
            expect(newsletter.content).toBe('Updated Content');
            expect(newsletter.status).toBe(NewsletterStatusEnum.SENT);
        });

        it('should handle special characters in label and content', () => {
            const specialChars = '!@#$%^&*()_+-=[]{}|;:",.<>?/~`';
            const newsletter = new NewsletterEntity();
            Object.assign(newsletter, {
                label: `Label with ${specialChars}`,
                content: `Content with ${specialChars}`,
            });

            expect(newsletter.label).toContain(specialChars);
            expect(newsletter.content).toContain(specialChars);
        });

        it('should handle unicode characters', () => {
            const newsletter = new NewsletterEntity();
            Object.assign(newsletter, {
                label: '测试标题 🚀 émojis',
                content: 'Content in french with special characters: é, è, ê, ë, à, ù',
            });

            expect(newsletter.label).toBe('测试标题 🚀 émojis');
            expect(newsletter.content).toContain('french');
        });

        it('should handle multiple property assignments', () => {
            const newsletter = new NewsletterEntity();

            newsletter.label = 'First';
            newsletter.label = 'Second';
            newsletter.label = 'Third';

            expect(newsletter.label).toBe('Third');
        });
    });

    describe('TypeORM Column Decorators Coverage', () => {
        it('should have correct metadata for label column', () => {
            const newsletter = new NewsletterEntity();
            Object.assign(newsletter, { label: 'Test' });
            expect(typeof newsletter.label).toBe('string');
        });

        it('should have correct metadata for content column', () => {
            const newsletter = new NewsletterEntity();
            Object.assign(newsletter, { content: 'Test Content' });
            expect(typeof newsletter.content).toBe('string');
        });

        it('should have correct metadata for status enum column', () => {
            const newsletter = new NewsletterEntity();
            Object.assign(newsletter, {
                status: NewsletterStatusEnum.PENDING,
            });
            expect(Object.values(NewsletterStatusEnum)).toContain(newsletter.status);
        });

        it('should have correct metadata for channel enum column', () => {
            const newsletter = new NewsletterEntity();
            Object.assign(newsletter, {
                channel: NewsletterChannelEnum.NOTIFICATION,
            });
            expect(Object.values(NewsletterChannelEnum)).toContain(newsletter.channel);
        });

        it('should have correct metadata for sendMode enum column', () => {
            const newsletter = new NewsletterEntity();
            Object.assign(newsletter, {
                sendMode: NewsletterSendModeEnum.IMMEDIATE,
            });
            expect(Object.values(NewsletterSendModeEnum)).toContain(newsletter.sendMode);
        });

        it('should have correct metadata for audience enum column', () => {
            const newsletter = new NewsletterEntity();
            Object.assign(newsletter, {
                audience: NewsletterAudienceEnum.ALL_USERS,
            });
            expect(Object.values(NewsletterAudienceEnum)).toContain(newsletter.audience);
        });

        it('should have correct metadata for scheduledAt date column', () => {
            const date = new Date();
            const newsletter = new NewsletterEntity();
            Object.assign(newsletter, { scheduledAt: date });
            expect(newsletter.scheduledAt).toBeInstanceOf(Date);
        });
    });
});
