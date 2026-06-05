import { Global, Module } from '@nestjs/common';
import { MAIL_PROVIDER } from './mailer.constants';
import { MailerService, SendGridMailerService, SmtpMailerService } from './services';
import { EnvConfigService } from '../../utils/services/config';

@Global()
@Module({
    providers: [
        {
            provide: MAIL_PROVIDER,
            inject: [EnvConfigService],
            useFactory: (configService: EnvConfigService) => {
                const provider = configService.mailType;

                switch (provider) {
                    case 'SENDGRID':
                        return new SendGridMailerService(configService);
                    case 'NODEMAILER':
                    default:
                        return new SmtpMailerService(configService);
                }
            },
        },
        MailerService,
    ],
    exports: [MailerService],
})
export class MailerModule {}
