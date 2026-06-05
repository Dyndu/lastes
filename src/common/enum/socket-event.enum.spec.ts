import { SocketEventEnum } from './socket-event.enum';

describe('SocketEventEnum Enum', () => {
    const expectedEntries = Object.entries(SocketEventEnum) as [
        keyof typeof SocketEventEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(SocketEventEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(SocketEventEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(SocketEventEnum)).toEqual(expectedEntries.map(([, value]) => value));
    });
});
