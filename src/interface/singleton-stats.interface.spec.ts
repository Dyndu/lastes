import { SingletonStatsInterface } from './singleton-stats.interface';

describe('SingletonStatsInterface', () => {
    describe('Structure validation', () => {
        it('should accept object with singleton and total properties', () => {
            const stats: SingletonStatsInterface = {
                singleton: 5,
                total: 10,
            };

            expect(stats.singleton).toBe(5);
            expect(stats.total).toBe(10);
        });

        it('should have exactly two required properties', () => {
            const stats: SingletonStatsInterface = {
                singleton: 3,
                total: 15,
            };

            const keys = Object.keys(stats);
            expect(keys).toHaveLength(2);
            expect(keys).toContain('singleton');
            expect(keys).toContain('total');
        });
    });

    describe('Type checking', () => {
        it('should enforce number type for singleton property', () => {
            const stats: SingletonStatsInterface = {
                singleton: 10,
                total: 20,
            };

            expect(typeof stats.singleton).toBe('number');
        });

        it('should enforce number type for total property', () => {
            const stats: SingletonStatsInterface = {
                singleton: 5,
                total: 15,
            };

            expect(typeof stats.total).toBe('number');
        });
    });

    describe('Real-world usage scenarios', () => {
        it('should work with zero values', () => {
            const stats: SingletonStatsInterface = {
                singleton: 0,
                total: 0,
            };

            expect(stats.singleton).toBe(0);
            expect(stats.total).toBe(0);
        });

        it('should work with negative values', () => {
            const stats: SingletonStatsInterface = {
                singleton: -5,
                total: 10,
            };

            expect(stats.singleton).toBe(-5);
            expect(stats.total).toBe(10);
        });

        it('should work with decimal values', () => {
            const stats: SingletonStatsInterface = {
                singleton: 2.5,
                total: 10.75,
            };

            expect(stats.singleton).toBe(2.5);
            expect(stats.total).toBe(10.75);
        });

        it('should work as function return type', () => {
            const createStats = (): SingletonStatsInterface => ({
                singleton: 3,
                total: 12,
            });

            const stats = createStats();
            expect(stats.singleton).toBe(3);
            expect(stats.total).toBe(12);
        });

        it('should work in array of stats', () => {
            const statsArray: SingletonStatsInterface[] = [
                { singleton: 1, total: 5 },
                { singleton: 2, total: 10 },
                { singleton: 3, total: 15 },
            ];

            expect(statsArray).toHaveLength(3);
            expect(statsArray[0].singleton).toBe(1);
            expect(statsArray[2].total).toBe(15);
        });

        it('should allow merging stats objects', () => {
            const stats1: SingletonStatsInterface = {
                singleton: 5,
                total: 10,
            };

            const stats2: SingletonStatsInterface = {
                singleton: 3,
                total: 7,
            };

            const merged = { ...stats1, ...stats2 };

            expect(merged.singleton).toBe(3);
            expect(merged.total).toBe(7);
        });

        it('should calculate percentage correctly', () => {
            const stats: SingletonStatsInterface = {
                singleton: 25,
                total: 100,
            };

            const percentage = (stats.singleton / stats.total) * 100;
            expect(percentage).toBe(25);
        });

        it('should work with destructuring', () => {
            const stats: SingletonStatsInterface = {
                singleton: 8,
                total: 20,
            };

            const { singleton, total } = stats;

            expect(singleton).toBe(8);
            expect(total).toBe(20);
        });
    });

    describe('Edge cases', () => {
        it('should handle very large numbers', () => {
            const stats: SingletonStatsInterface = {
                singleton: Number.MAX_SAFE_INTEGER,
                total: Number.MAX_SAFE_INTEGER - 1,
            };

            expect(stats.singleton).toBe(Number.MAX_SAFE_INTEGER);
            expect(stats.total).toBe(Number.MAX_SAFE_INTEGER - 1);
        });

        it('should handle Infinity', () => {
            const stats: SingletonStatsInterface = {
                singleton: Infinity,
                total: -Infinity,
            };

            expect(stats.singleton).toBe(Infinity);
            expect(stats.total).toBe(-Infinity);
        });

        it('should handle NaN', () => {
            const stats: SingletonStatsInterface = {
                singleton: NaN,
                total: 10,
            };

            expect(isNaN(stats.singleton)).toBe(true);
            expect(stats.total).toBe(10);
        });

        it('should handle division by zero scenario', () => {
            const stats: SingletonStatsInterface = {
                singleton: 5,
                total: 0,
            };

            const ratio = stats.singleton / stats.total;
            expect(ratio).toBe(Infinity);
        });
    });

    describe('Object operations', () => {
        it('should work with Object.keys()', () => {
            const stats: SingletonStatsInterface = {
                singleton: 1,
                total: 5,
            };

            const keys = Object.keys(stats);
            expect(keys).toEqual(['singleton', 'total']);
        });

        it('should work with Object.values()', () => {
            const stats: SingletonStatsInterface = {
                singleton: 1,
                total: 5,
            };

            const values = Object.values(stats);
            expect(values).toEqual([1, 5]);
        });

        it('should work with Object.entries()', () => {
            const stats: SingletonStatsInterface = {
                singleton: 1,
                total: 5,
            };

            const entries = Object.entries(stats);
            expect(entries).toEqual([
                ['singleton', 1],
                ['total', 5],
            ]);
        });

        it('should be serializable to JSON', () => {
            const stats: SingletonStatsInterface = {
                singleton: 7,
                total: 21,
            };

            const json = JSON.stringify(stats);
            const parsed = JSON.parse(json);

            expect(parsed.singleton).toBe(7);
            expect(parsed.total).toBe(21);
        });
    });

    describe('Comparison operations', () => {
        it('should compare singleton values', () => {
            const stats1: SingletonStatsInterface = { singleton: 5, total: 10 };
            const stats2: SingletonStatsInterface = { singleton: 8, total: 10 };

            expect(stats1.singleton).toBeLessThan(stats2.singleton);
        });

        it('should compare total values', () => {
            const stats1: SingletonStatsInterface = { singleton: 5, total: 15 };
            const stats2: SingletonStatsInterface = { singleton: 5, total: 10 };

            expect(stats1.total).toBeGreaterThan(stats2.total);
        });

        it('should check equality', () => {
            const stats1: SingletonStatsInterface = { singleton: 5, total: 10 };
            const stats2: SingletonStatsInterface = { singleton: 5, total: 10 };

            expect(stats1.singleton).toBe(stats2.singleton);
            expect(stats1.total).toBe(stats2.total);
        });
    });
});
