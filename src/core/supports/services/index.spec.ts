import * as indexExports from './index';
import {
    SupportsService,
    SConService,
    SMessagesService,
    SAdminConService,
    TransformSEntitiesService,
} from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['SupportsService', SupportsService],
        ['SConService', SConService],
        ['SMessagesService', SMessagesService],
        ['SAdminConService', SAdminConService],
        ['TransformSEntitiesService', TransformSEntitiesService],
    ] as const;

    it.each(expectedExports)(
        'should re-export support services %s correctly',
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
