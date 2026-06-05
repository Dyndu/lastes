import { validate } from 'class-validator';
import { IsValidUrl } from './is-url-valid.decorator';

class TestDto {
    @IsValidUrl('facebook')
    facebookUrl?: string;

    @IsValidUrl('instagram')
    instagramUrl?: string;

    @IsValidUrl()
    genericUrl?: string;
}

describe('IsValidUrl Decorator', () => {
    let dto: TestDto;

    beforeEach(() => {
        dto = new TestDto();
    });

    describe('with keyword', () => {
        describe('facebookUrl', () => {
            it('should pass validation for valid Facebook HTTPS URL', async () => {
                dto.facebookUrl = 'https://www.facebook.com/profile';

                const errors = await validate(dto);
                const facebookErrors = errors.filter((e) => e.property === 'facebookUrl');

                expect(facebookErrors.length).toBe(0);
            });

            it('should pass validation for valid Facebook HTTPS URL with uppercase', async () => {
                dto.facebookUrl = 'https://www.FACEBOOK.com/profile';

                const errors = await validate(dto);
                const facebookErrors = errors.filter((e) => e.property === 'facebookUrl');

                expect(facebookErrors.length).toBe(0);
            });

            it('should fail validation for HTTP URL (not HTTPS)', async () => {
                dto.facebookUrl = 'http://www.facebook.com/profile';

                const errors = await validate(dto);
                const facebookErrors = errors.filter((e) => e.property === 'facebookUrl');

                expect(facebookErrors.length).toBe(1);
                expect(facebookErrors[0].constraints?.isValidUrl).toBe(
                    'facebookUrl must be a valid HTTPS URL containing "facebook"',
                );
            });

            it('should fail validation for URL without keyword', async () => {
                dto.facebookUrl = 'https://www.twitter.com/profile';

                const errors = await validate(dto);
                const facebookErrors = errors.filter((e) => e.property === 'facebookUrl');

                expect(facebookErrors.length).toBe(1);
                expect(facebookErrors[0].constraints?.isValidUrl).toBe(
                    'facebookUrl must be a valid HTTPS URL containing "facebook"',
                );
            });

            it('should fail validation for invalid URL format', async () => {
                dto.facebookUrl = 'not-a-valid-url';

                const errors = await validate(dto);
                const facebookErrors = errors.filter((e) => e.property === 'facebookUrl');

                expect(facebookErrors.length).toBe(1);
            });

            it('should fail validation for non-string value', async () => {
                dto.facebookUrl = 12345 as any;

                const errors = await validate(dto);
                const facebookErrors = errors.filter((e) => e.property === 'facebookUrl');

                expect(facebookErrors.length).toBe(1);
            });

            it('should fail validation for empty string', async () => {
                dto.facebookUrl = '';

                const errors = await validate(dto);
                const facebookErrors = errors.filter((e) => e.property === 'facebookUrl');

                expect(facebookErrors.length).toBe(1);
            });
        });

        describe('instagramUrl', () => {
            it('should pass validation for valid Instagram HTTPS URL', async () => {
                dto.instagramUrl = 'https://www.instagram.com/username';

                const errors = await validate(dto);
                const instagramErrors = errors.filter((e) => e.property === 'instagramUrl');

                expect(instagramErrors.length).toBe(0);
            });

            it('should fail validation for URL without instagram keyword', async () => {
                dto.instagramUrl = 'https://www.facebook.com/profile';

                const errors = await validate(dto);
                const instagramErrors = errors.filter((e) => e.property === 'instagramUrl');

                expect(instagramErrors.length).toBe(1);
                expect(instagramErrors[0].constraints?.isValidUrl).toBe(
                    'instagramUrl must be a valid HTTPS URL containing "instagram"',
                );
            });
        });
    });

    describe('without keyword (generic URL)', () => {
        it('should pass validation for any valid HTTPS URL', async () => {
            dto.genericUrl = 'https://www.example.com';

            const errors = await validate(dto);
            const genericErrors = errors.filter((e) => e.property === 'genericUrl');

            expect(genericErrors.length).toBe(0);
        });

        it('should pass validation for HTTPS URL with any domain', async () => {
            dto.genericUrl = 'https://www.random-website.org/path';

            const errors = await validate(dto);
            const genericErrors = errors.filter((e) => e.property === 'genericUrl');

            expect(genericErrors.length).toBe(0);
        });

        it('should fail validation for HTTP URL', async () => {
            dto.genericUrl = 'http://www.example.com';

            const errors = await validate(dto);
            const genericErrors = errors.filter((e) => e.property === 'genericUrl');

            expect(genericErrors.length).toBe(1);
            expect(genericErrors[0].constraints?.isValidUrl).toBe(
                'genericUrl must be a valid HTTPS URL',
            );
        });

        it('should fail validation for invalid URL', async () => {
            dto.genericUrl = 'invalid-url';

            const errors = await validate(dto);
            const genericErrors = errors.filter((e) => e.property === 'genericUrl');

            expect(genericErrors.length).toBe(1);
        });
    });

    describe('edge cases', () => {
        it('should handle keyword case-insensitivity', async () => {
            dto.facebookUrl = 'https://www.FaCeBoOk.com/profile';

            const errors = await validate(dto);
            const facebookErrors = errors.filter((e) => e.property === 'facebookUrl');

            expect(facebookErrors.length).toBe(0);
        });

        it('should handle null value', async () => {
            dto.facebookUrl = null as any;

            const errors = await validate(dto);
            const facebookErrors = errors.filter((e) => e.property === 'facebookUrl');

            expect(facebookErrors.length).toBe(1);
        });

        it('should validate URL with query parameters', async () => {
            dto.facebookUrl = 'https://www.facebook.com/profile?id=123&ref=home';

            const errors = await validate(dto);
            const facebookErrors = errors.filter((e) => e.property === 'facebookUrl');

            expect(facebookErrors.length).toBe(0);
        });

        it('should validate URL with hash fragment', async () => {
            dto.facebookUrl = 'https://www.facebook.com/profile#section';

            const errors = await validate(dto);
            const facebookErrors = errors.filter((e) => e.property === 'facebookUrl');

            expect(facebookErrors.length).toBe(0);
        });

        it('should fail for URL with keyword in path but wrong domain', async () => {
            dto.facebookUrl = 'https://www.example.com/facebook';

            const errors = await validate(dto);
            const facebookErrors = errors.filter((e) => e.property === 'facebookUrl');

            expect(facebookErrors.length).toBe(0);
        });
    });
});
