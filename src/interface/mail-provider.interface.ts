export interface MailProviderInterface {
    sendMail(to: string, subject: string, html: string): Promise<any>;
}
