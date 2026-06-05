import { RedocOptions } from 'nestjs-redoc';

export const CreateRedocConfig = (): RedocOptions => {
    return {
        title: 'Rent Roi API',
        logo: {
            url: 'https://s3.us-west-004.backblazeb2.com/backblazetestbucket/c269bbd2-2ecc-40c9-8a11-f61f27cd9680-RENTROI_Emaillogo.png',
            backgroundColor: '#F0F0F0',
            altText: 'logo',
        },
        sortPropsAlphabetically: true,
        hideDownloadButton: false,
        hideHostname: false,
    };
};
