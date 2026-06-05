import { validate } from 'class-validator';
import { UpdateInfoDto } from './update-info.dto';

describe('UpdateInfoDto', () => {
    let dto: UpdateInfoDto;

    beforeEach(() => {
        dto = new UpdateInfoDto();
    });

    describe('phoneNumber', () => {
        it('should pass validation with valid phone number', async () => {
            dto.phoneNumber = '+22951227041';

            const errors = await validate(dto);
            const phoneErrors = errors.filter((e) => e.property === 'phoneNumber');

            expect(phoneErrors.length).toBe(0);
        });

        it('should pass validation when phoneNumber is undefined (optional)', async () => {
            dto.phoneNumber = undefined;

            const errors = await validate(dto);
            const phoneErrors = errors.filter((e) => e.property === 'phoneNumber');

            expect(phoneErrors.length).toBe(0);
        });

        it('should fail validation when phoneNumber is too short', async () => {
            dto.phoneNumber = '+';

            const errors = await validate(dto);
            const phoneErrors = errors.filter((e) => e.property === 'phoneNumber');

            expect(phoneErrors.length).toBe(1);
            expect(phoneErrors[0].constraints?.minLength).toBe(
                'Footer phone number must be at least 2 characters long',
            );
        });

        it('should fail validation when phoneNumber is not a string', async () => {
            dto.phoneNumber = 12345 as any;

            const errors = await validate(dto);
            const phoneErrors = errors.filter((e) => e.property === 'phoneNumber');

            expect(phoneErrors.length).toBeGreaterThan(0);
            expect(phoneErrors[0].constraints?.isString).toBe(
                'Footer phone number must be a string',
            );
        });
    });

    describe('email', () => {
        it('should pass validation with valid email', async () => {
            dto.email = 'lunindakayao11@gmail.com';

            const errors = await validate(dto);
            const emailErrors = errors.filter((e) => e.property === 'email');

            expect(emailErrors.length).toBe(0);
        });

        it('should pass validation when email is undefined (optional)', async () => {
            dto.email = undefined;

            const errors = await validate(dto);
            const emailErrors = errors.filter((e) => e.property === 'email');

            expect(emailErrors.length).toBe(0);
        });

        it('should fail validation with invalid email format', async () => {
            dto.email = 'invalid-email';

            const errors = await validate(dto);
            const emailErrors = errors.filter((e) => e.property === 'email');

            expect(emailErrors.length).toBe(1);
            expect(emailErrors[0].constraints?.isEmail).toBe('Footer email must be a valid email');
        });

        it('should fail validation when email is not a string', async () => {
            dto.email = 12345 as any;

            const errors = await validate(dto);
            const emailErrors = errors.filter((e) => e.property === 'email');

            expect(emailErrors.length).toBeGreaterThan(0);
            expect(emailErrors[0].constraints?.isString).toBe('Footer email must be a string');
        });
    });

    describe('facebook', () => {
        it('should pass validation with valid Facebook HTTPS URL', async () => {
            dto.facebook = 'https://www.facebook.com/mypage';

            const errors = await validate(dto);
            const facebookErrors = errors.filter((e) => e.property === 'facebook');

            expect(facebookErrors.length).toBe(0);
        });

        it('should pass validation when facebook is undefined (optional)', async () => {
            dto.facebook = undefined;

            const errors = await validate(dto);
            const facebookErrors = errors.filter((e) => e.property === 'facebook');

            expect(facebookErrors.length).toBe(0);
        });

        it('should fail validation with HTTP URL (not HTTPS)', async () => {
            dto.facebook = 'http://www.facebook.com/mypage';

            const errors = await validate(dto);
            const facebookErrors = errors.filter((e) => e.property === 'facebook');

            expect(facebookErrors.length).toBeGreaterThan(0);
            expect(facebookErrors[0].constraints?.isValidUrl).toBe(
                'facebook must be a valid HTTPS URL containing "facebook"',
            );
        });

        it('should fail validation with URL not containing "facebook"', async () => {
            dto.facebook = 'https://www.instagram.com/mypage';

            const errors = await validate(dto);
            const facebookErrors = errors.filter((e) => e.property === 'facebook');

            expect(facebookErrors.length).toBeGreaterThan(0);
            expect(facebookErrors[0].constraints?.isValidUrl).toBe(
                'facebook must be a valid HTTPS URL containing "facebook"',
            );
        });

        it('should fail validation with invalid URL format', async () => {
            dto.facebook = 'not-a-valid-url';

            const errors = await validate(dto);
            const facebookErrors = errors.filter((e) => e.property === 'facebook');

            expect(facebookErrors.length).toBeGreaterThan(0);
        });

        it('should fail validation when facebook is too short', async () => {
            dto.facebook = 'h';

            const errors = await validate(dto);
            const facebookErrors = errors.filter((e) => e.property === 'facebook');

            expect(facebookErrors.length).toBeGreaterThan(0);
        });
    });

    describe('instagram', () => {
        it('should pass validation with valid Instagram HTTPS URL', async () => {
            dto.instagram = 'https://www.instagram.com/username';

            const errors = await validate(dto);
            const instagramErrors = errors.filter((e) => e.property === 'instagram');

            expect(instagramErrors.length).toBe(0);
        });

        it('should pass validation when instagram is undefined (optional)', async () => {
            dto.instagram = undefined;

            const errors = await validate(dto);
            const instagramErrors = errors.filter((e) => e.property === 'instagram');

            expect(instagramErrors.length).toBe(0);
        });

        it('should fail validation with HTTP URL', async () => {
            dto.instagram = 'http://www.instagram.com/username';

            const errors = await validate(dto);
            const instagramErrors = errors.filter((e) => e.property === 'instagram');

            expect(instagramErrors.length).toBeGreaterThan(0);
            expect(instagramErrors[0].constraints?.isValidUrl).toBe(
                'instagram must be a valid HTTPS URL containing "instagram"',
            );
        });

        it('should fail validation with URL not containing "instagram"', async () => {
            dto.instagram = 'https://www.facebook.com/page';

            const errors = await validate(dto);
            const instagramErrors = errors.filter((e) => e.property === 'instagram');

            expect(instagramErrors.length).toBeGreaterThan(0);
            expect(instagramErrors[0].constraints?.isValidUrl).toBe(
                'instagram must be a valid HTTPS URL containing "instagram"',
            );
        });
    });

    describe('linkedIn', () => {
        it('should pass validation with valid LinkedIn HTTPS URL', async () => {
            dto.linkedIn = 'https://www.linkedin.com/in/profile';

            const errors = await validate(dto);
            const linkedInErrors = errors.filter((e) => e.property === 'linkedIn');

            expect(linkedInErrors.length).toBe(0);
        });

        it('should pass validation when linkedIn is undefined (optional)', async () => {
            dto.linkedIn = undefined;

            const errors = await validate(dto);
            const linkedInErrors = errors.filter((e) => e.property === 'linkedIn');

            expect(linkedInErrors.length).toBe(0);
        });

        it('should fail validation with HTTP URL', async () => {
            dto.linkedIn = 'http://www.linkedin.com/in/profile';

            const errors = await validate(dto);
            const linkedInErrors = errors.filter((e) => e.property === 'linkedIn');

            expect(linkedInErrors.length).toBeGreaterThan(0);
            expect(linkedInErrors[0].constraints?.isValidUrl).toBe(
                'linkedIn must be a valid HTTPS URL containing "linkedin"',
            );
        });

        it('should fail validation with URL not containing "linkedin"', async () => {
            dto.linkedIn = 'https://www.twitter.com/profile';

            const errors = await validate(dto);
            const linkedInErrors = errors.filter((e) => e.property === 'linkedIn');

            expect(linkedInErrors.length).toBeGreaterThan(0);
            expect(linkedInErrors[0].constraints?.isValidUrl).toBe(
                'linkedIn must be a valid HTTPS URL containing "linkedin"',
            );
        });
    });

    describe('twitter', () => {
        it('should pass validation with valid X (Twitter) HTTPS URL', async () => {
            dto.twitter = 'https://x.com/username';

            const errors = await validate(dto);
            const twitterErrors = errors.filter((e) => e.property === 'twitter');

            expect(twitterErrors.length).toBe(0);
        });

        it('should pass validation when twitter is undefined (optional)', async () => {
            dto.twitter = undefined;

            const errors = await validate(dto);
            const twitterErrors = errors.filter((e) => e.property === 'twitter');

            expect(twitterErrors.length).toBe(0);
        });

        it('should fail validation with HTTP URL', async () => {
            dto.twitter = 'http://x.com/username';

            const errors = await validate(dto);
            const twitterErrors = errors.filter((e) => e.property === 'twitter');

            expect(twitterErrors.length).toBeGreaterThan(0);
            expect(twitterErrors[0].constraints?.isValidUrl).toBe(
                'twitter must be a valid HTTPS URL containing "x"',
            );
        });

        it('should fail validation with URL not containing "x"', async () => {
            dto.twitter = 'https://www.facebook.com/page';

            const errors = await validate(dto);
            const twitterErrors = errors.filter((e) => e.property === 'twitter');

            expect(twitterErrors.length).toBeGreaterThan(0);
            expect(twitterErrors[0].constraints?.isValidUrl).toBe(
                'twitter must be a valid HTTPS URL containing "x"',
            );
        });

        it('should pass validation with twitter.com URL containing "x" in path', async () => {
            dto.twitter = 'https://twitter.com/x/username';

            const errors = await validate(dto);
            const twitterErrors = errors.filter((e) => e.property === 'twitter');

            expect(twitterErrors.length).toBe(0);
        });
    });

    describe('discord', () => {
        it('should pass validation with valid Discord HTTPS URL', async () => {
            dto.discord = 'https://discord.com/invite/abc123';

            const errors = await validate(dto);
            const discordErrors = errors.filter((e) => e.property === 'discord');

            expect(discordErrors.length).toBe(0);
        });

        it('should pass validation when discord is undefined (optional)', async () => {
            dto.discord = undefined;

            const errors = await validate(dto);
            const discordErrors = errors.filter((e) => e.property === 'discord');

            expect(discordErrors.length).toBe(0);
        });

        it('should fail validation with HTTP URL', async () => {
            dto.discord = 'http://discord.com/invite/abc123';

            const errors = await validate(dto);
            const discordErrors = errors.filter((e) => e.property === 'discord');

            expect(discordErrors.length).toBeGreaterThan(0);
            expect(discordErrors[0].constraints?.isValidUrl).toBe(
                'discord must be a valid HTTPS URL containing "discord"',
            );
        });

        it('should fail validation with URL not containing "discord"', async () => {
            dto.discord = 'https://www.slack.com/invite';

            const errors = await validate(dto);
            const discordErrors = errors.filter((e) => e.property === 'discord');

            expect(discordErrors.length).toBeGreaterThan(0);
            expect(discordErrors[0].constraints?.isValidUrl).toBe(
                'discord must be a valid HTTPS URL containing "discord"',
            );
        });
    });

    describe('all fields together', () => {
        it('should pass validation with all valid fields', async () => {
            dto.phoneNumber = '+22951227041';
            dto.email = 'lunindakayao11@gmail.com';
            dto.facebook = 'https://www.facebook.com/mypage';
            dto.instagram = 'https://www.instagram.com/username';
            dto.linkedIn = 'https://www.linkedin.com/in/profile';
            dto.twitter = 'https://x.com/username';
            dto.discord = 'https://discord.com/invite/abc123';

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should pass validation with all fields undefined (all optional)', async () => {
            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should fail validation with multiple invalid fields', async () => {
            dto.phoneNumber = 'x';
            dto.email = 'invalid-email';
            dto.facebook = 'http://facebook.com';
            dto.instagram = 'https://twitter.com';

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);

            const phoneErrors = errors.filter((e) => e.property === 'phoneNumber');
            const emailErrors = errors.filter((e) => e.property === 'email');
            const facebookErrors = errors.filter((e) => e.property === 'facebook');
            const instagramErrors = errors.filter((e) => e.property === 'instagram');

            expect(phoneErrors.length).toBeGreaterThan(0);
            expect(emailErrors.length).toBeGreaterThan(0);
            expect(facebookErrors.length).toBeGreaterThan(0);
            expect(instagramErrors.length).toBeGreaterThan(0);
        });

        it('should validate case-insensitivity for URL keywords', async () => {
            dto.facebook = 'https://www.FACEBOOK.com/page';
            dto.instagram = 'https://www.InStAgRaM.com/user';

            const errors = await validate(dto);
            const facebookErrors = errors.filter((e) => e.property === 'facebook');
            const instagramErrors = errors.filter((e) => e.property === 'instagram');

            expect(facebookErrors.length).toBe(0);
            expect(instagramErrors.length).toBe(0);
        });
    });

    describe('edge cases', () => {
        it('should handle empty strings for optional fields', async () => {
            dto.phoneNumber = '';
            dto.email = '';
            dto.facebook = '';

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
        });

        it('should handle URLs with query parameters and fragments', async () => {
            dto.facebook = 'https://www.facebook.com/page?id=123#section';
            dto.instagram = 'https://www.instagram.com/user?utm_source=link';

            const errors = await validate(dto);
            const facebookErrors = errors.filter((e) => e.property === 'facebook');
            const instagramErrors = errors.filter((e) => e.property === 'instagram');

            expect(facebookErrors.length).toBe(0);
            expect(instagramErrors.length).toBe(0);
        });
    });
});
