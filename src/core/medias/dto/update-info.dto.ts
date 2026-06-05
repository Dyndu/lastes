import { IsValidUrl, StringFieldDecorator } from '../../../common/decorators';

export class UpdateInfoDto {
    @StringFieldDecorator('Footer phone number', '+22951227041', 2, false)
    phoneNumber?: string;

    @StringFieldDecorator('Footer email', 'lunindakayao11@gmail.com', 2, false, true)
    email?: string;

    @IsValidUrl('facebook')
    @StringFieldDecorator('Footer facebook link', 'https://www.facebook.com/', 2, false)
    facebook?: string;

    @IsValidUrl('Instagram')
    @StringFieldDecorator('Footer Instagram', 'https://www.instagram.com/', 2, false)
    instagram?: string;

    @IsValidUrl('LinkedIn')
    @StringFieldDecorator('Footer linkedIn', 'https://www.linkedin.com/', 2, false)
    linkedIn?: string;

    @IsValidUrl('x')
    @StringFieldDecorator('Footer twitter', 'https://x.com/', 2, false)
    twitter?: string;

    @IsValidUrl('discord')
    @StringFieldDecorator('Footer discord', 'https://discord.com/', 2, false)
    discord?: string;
}
