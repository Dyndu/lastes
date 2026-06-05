import { Inject, Injectable } from '@nestjs/common';
import { MAIL_PROVIDER } from '../mailer.constants';
import * as _interface from '../../../interface';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class MailerService {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        @Inject(MAIL_PROVIDER)
        private readonly provider: _interface.MailProviderInterface,
    ) {}

    /**
     * Sends a single email message using the configured mail provider.
     * Acts as a thin abstraction layer over the underlying email transport service.
     */
    async sendMail(to: string, subject: string, html: string) {
        return this.provider.sendMail(to, subject, html);
    }

    /**
     * Sends an email to a specified recipient with the given subject and HTML content.
     * Logs any errors that occur during the email sending process.
     */
    emailSend(email: string, subject: string, html: string): void {
        this.logger.info(`Sending email to ${email}`);
        this.sendMail(email.trim(), subject, html).catch((error) => {
            this.logger.info(`Email send failed: ${error}`);
        });
    }

    /**
     * Sends an email to multiple recipients in parallel.
     * Trims recipient addresses, logs the bulk operation, and ensures that
     * individual send failures are logged without interrupting the overall process.
     */
    async sendBulkMail(emails: string[], subject: string, html: string) {
        this.logger.info(`Sending bulk email to ${emails.length} users`);

        await Promise.all(
            emails.map((email) =>
                this.sendMail(email.trim(), subject, html).catch((err) => {
                    this.logger.error(`Failed to send email to ${email}: ${err}`);
                }),
            ),
        );
    }
}
