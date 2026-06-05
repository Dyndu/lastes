import * as indexExports from './index';
import { PropertiesService, PrePropertiesService, TransformPropertyEntityService } from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['PropertiesService', PropertiesService],
        ['PrePropertiesService', PrePropertiesService],
        ['TransformPropertyEntityService', TransformPropertyEntityService],
    ] as const;

    it.each(expectedExports)(
        'should re-export properties services %s correctly',
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
