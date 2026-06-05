import * as indexExports from './index';
import { MediaEntity, FooterInfoEntity, SocialEntity } from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['MediaEntity', MediaEntity],
        ['FooterInfoEntity', FooterInfoEntity],
        ['SocialEntity', SocialEntity],
    ] as const;

    it.each(expectedExports)(
        'should re-export media entities %s correctly',
        (name, originalEnum) => {
            expect(indexExports[name]).toBe(originalEnum);
        },
    );

    it('should export all expected modules', () => {
        const exportNames = expectedExports.map(([name]) => name);
        exportNames.forEach((name) => {
            expect(indexExports).toHaveProperty(name);
        });
    });
});
