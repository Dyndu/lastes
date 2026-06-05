import { CreateRedocConfig } from './redoc.config';

describe('CreateRedocConfig', () => {
    it('should return the correct RedocOptions object', () => {
        const config = CreateRedocConfig();

        expect(config).toBeDefined();
        expect(config.title).toBe('Rent Roi API');

        expect(config.logo).toEqual({
            url: 'https://s3.us-west-004.backblazeb2.com/backblazetestbucket/c269bbd2-2ecc-40c9-8a11-f61f27cd9680-RENTROI_Emaillogo.png',
            backgroundColor: '#F0F0F0',
            altText: 'logo',
        });

        expect(config.sortPropsAlphabetically).toBe(true);
        expect(config.hideDownloadButton).toBe(false);
        expect(config.hideHostname).toBe(false);
    });
});
