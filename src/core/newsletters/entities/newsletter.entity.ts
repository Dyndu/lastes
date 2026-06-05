import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { Column, Entity } from 'typeorm';
import {
    NewsletterStatusEnum,
    NewsletterChannelEnum,
    NewsletterSendModeEnum,
    NewsletterAudienceEnum,
} from '../../../common/enum';

@Entity('newsletter')
export class NewsletterEntity extends AbstractEntity<NewsletterEntity> {
    @Column({ type: 'text', nullable: false })
    label: string;

    @Column({ type: 'text', nullable: false })
    content: string;

    @Column({
        type: 'enum',
        nullable: false,
        default: NewsletterStatusEnum.PENDING,
        enum: NewsletterStatusEnum,
    })
    status: NewsletterStatusEnum;

    @Column({
        type: 'enum',
        nullable: false,
        default: NewsletterChannelEnum.NOTIFICATION,
        enum: NewsletterChannelEnum,
    })
    channel: NewsletterChannelEnum;

    @Column({
        type: 'enum',
        nullable: false,
        default: NewsletterSendModeEnum.IMMEDIATE,
        enum: NewsletterSendModeEnum,
    })
    sendMode: NewsletterSendModeEnum;

    @Column({
        type: 'enum',
        nullable: false,
        default: NewsletterAudienceEnum.ALL_USERS,
        enum: NewsletterAudienceEnum,
    })
    audience: NewsletterAudienceEnum;

    @Column({ type: 'timestamptz', nullable: true })
    scheduledAt: Date;
}
