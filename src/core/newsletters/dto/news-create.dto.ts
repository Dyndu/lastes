import {
    DateFieldDecorator,
    EnumFieldDecorator,
    StringArrayFieldDecorator,
    StringFieldDecorator,
} from '../../../common/decorators';
import {
    NewsletterAudienceEnum,
    NewsletterChannelEnum,
    NewsletterSendModeEnum,
    NewsletterStatusEnum,
} from '../../../common/enum';
import { IsUUID } from 'class-validator';

export class NewsCreateDto {
    @StringFieldDecorator('Label of the newsletters', 'Subscription expired')
    label: string;

    @StringFieldDecorator('Content of the newsletters', 'Your subscriptions expired')
    content: string;

    @EnumFieldDecorator(NewsletterStatusEnum, 'Status of the news letters', {
        example: NewsletterStatusEnum.PENDING,
    })
    status: NewsletterStatusEnum;

    @EnumFieldDecorator(NewsletterSendModeEnum, 'The send mode of the news letters', {
        example: NewsletterSendModeEnum.IMMEDIATE,
    })
    sendMode: NewsletterSendModeEnum;

    @EnumFieldDecorator(NewsletterChannelEnum, 'The channel of the news letters', {
        example: NewsletterChannelEnum.EMAIL,
    })
    channel: NewsletterChannelEnum;

    @EnumFieldDecorator(NewsletterAudienceEnum, 'Receiver of the news letters', {
        example: NewsletterAudienceEnum.ALL_USERS,
    })
    audience: NewsletterAudienceEnum;

    @DateFieldDecorator(
        'The date where the news letter is scheduled at',
        '2024-12-01T00:00:00.000Z',
        { required: false },
    )
    scheduledAt?: Date;

    @StringArrayFieldDecorator(
        'Custom users ids',
        ['20e40a0b-1147-4ed7-b475-f120bc220f0d', '36af392b-dc5c-43a6-b19b-391e1a719e48'],
        2,
        false,
    )
    @IsUUID('4', { each: true })
    usersIds?: string[];
}
