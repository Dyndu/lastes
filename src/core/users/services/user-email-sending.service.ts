import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UserEmailSendingService {
    /**
     * Service responsible for sending user email
     */

    constructor(
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,
    ) {}

    /**
     * Sends a welcome email to the given user,
     * including their full name and an activation link.
     */
    sendWelcomeEmail(user: UserEntity) {
        this.usersService.logger.info(`Sending welcome email to ${user.email}`);
        this.usersService.mailerService.emailSend(
            user.email,
            'Welcome Email',
            this.usersService.otherUtils.buildEmailTemplate(
                '../../../src/utils/templates/register-email.hbs',
                {
                    currentYear: new Date().getFullYear(),
                },
            ),
        );
    }

    /**
     * Sends a welcome email to an admin user with a password setup link.
     * Logs the action and uses a pre-defined email template for the message.
     */
    sendWelcomeEmailToAdmin(user: UserEntity, id: string) {
        this.usersService.logger.info(`Sending welcome email to ${user.email}`);
        this.usersService.mailerService.emailSend(
            user.email,
            'Welcome and set your password',
            this.usersService.otherUtils.buildEmailTemplate(
                '../../../src/utils/templates/admin-register.hbs',
                {
                    link: `${this.usersService.envConfigService.adminResetPasswordLink}${id}`,
                    currentYear: new Date().getFullYear(),
                },
            ),
        );
    }

    /**
     * Sends a login code to the user with the provided user code.
     * Constructs an email template using the provided data and sends it to the user's email address.
     * Does not return any value.
     */
    sendUserOTP(user: UserEntity, userCode: string) {
        this.usersService.mailerService.emailSend(
            user.email,
            'Login code',
            this.usersService.otherUtils.buildEmailTemplate(
                '../../../src/utils/templates/verify-code-email.hbs',
                {
                    number1: userCode[0],
                    number2: userCode[1],
                    number3: userCode[2],
                    number4: userCode[3],
                    number5: userCode[4],
                    number6: userCode[5],
                    currentYear: new Date().getFullYear(),
                },
            ),
        );
    }

    /**
     * Sends a reset password email to the specified user.
     * Constructs a reset password email template using the user's full name and a reset link containing the provided ID.
     * Send the email to the user's email address.
     * Does not return any value.
     */
    sendResetPasswordMail(user: UserEntity, id: string): void {
        this.usersService.logger.info(`Sending reset password email to ${user.email}`);

        const link =
            user.role.label === this.usersService.envConfigService.userRole
                ? this.usersService.envConfigService.userResetPasswordLink
                : this.usersService.envConfigService.adminResetPasswordLink;

        this.usersService.mailerService.emailSend(
            user.email,
            'Reset password',
            this.usersService.otherUtils.buildEmailTemplate(
                '../../../src/utils/templates/reset-password.hbs',
                {
                    link: `${link}${id}`,
                    currentYear: new Date().getFullYear(),
                },
            ),
        );
    }
}
