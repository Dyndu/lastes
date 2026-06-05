import { GuideReactionEnum } from './guide-reaction.enum';

describe('GuideReactionEnum Enum', () => {
    const expectedEntries = Object.entries(GuideReactionEnum) as [
        keyof typeof GuideReactionEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(GuideReactionEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(GuideReactionEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(GuideReactionEnum)).toEqual(expectedEntries.map(([, value]) => value));
    });
});
