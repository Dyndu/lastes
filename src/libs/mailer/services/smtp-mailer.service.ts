import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { MailProviderInterface } from '../../../interface';
import { EnvConfigService } from '../../../utils/services/config';

@Injectable()
export class SmtpMailerService implements MailProviderInterface {
    private readonly transporter: nodemailer.Transporter;

    constructor(private readonly envConfigService: EnvConfigService) {
        this.transporter = nodemailer.createTransport({
            host: envConfigService.mailHost,
            port: Number(envConfigService.mailPort),
            secure: envConfigService.mailSecure === 'true',
            auth: {
                user: envConfigService.mailUser,
                pass: envConfigService.mailPassword,
            },
        });
    }

    /**
     * Sends an email using the configured mail transporter.
     * Uses the default sender email from environment configuration.
     * @returns Promise resolving to the result of the sendMail operation.
     */
    async sendMail(to: string, subject: string, html: string) {
        return this.transporter.sendMail({
            from: this.envConfigService.mailUser,
            to,
            subject,
            html,
        });
    }
}
