import { NotificationSubjectTypeEnum } from './notification-subject-type.enum';

describe('NotificationSubjectTypeEnum Enum', () => {
    const expectedEntries = Object.entries(NotificationSubjectTypeEnum) as [
        keyof typeof NotificationSubjectTypeEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(NotificationSubjectTypeEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(NotificationSubjectTypeEnum)).toEqual(
            expectedEntries.map(([key]) => key),
        );
    });

    it('should contain all expected values', () => {
        expect(Object.values(NotificationSubjectTypeEnum)).toEqual(
            expectedEntries.map(([, value]) => value),
        );
    });
});
