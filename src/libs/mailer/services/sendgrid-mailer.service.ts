import { Injectable } from '@nestjs/common';
import * as sendgrid from '@sendgrid/mail';
import { MailProviderInterface } from '../../../interface';
import { EnvConfigService } from '../../../utils/services/config';

@Injectable()
export class SendGridMailerService implements MailProviderInterface {
    constructor(private readonly envConfigService: EnvConfigService) {
        sendgrid.setApiKey(this.envConfigService.sendgridApiKey);
    }

    /**
     * Sends an email using SendGrid with the specified recipient, subject, and HTML content.
     * Disables click tracking for privacy.
     * @returns Promise resolving to the result of the SendGrid send operation.
     */
    async sendMail(to: string, subject: string, html: string) {
        return sendgrid.send({
            to,
            from: this.envConfigService.sendgridFrom,
            subject,
            html,
            trackingSettings: {
                clickTracking: {
                    enable: false,
                },
            },
        });
    }
}
