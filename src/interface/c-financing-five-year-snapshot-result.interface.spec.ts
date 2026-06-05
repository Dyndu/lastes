import { CFinancingFiveYearSnapshotResultInterface } from './c-financing-five-year-snapshot-result.interface';

describe('CFinancingFiveYearSnapshotResultInterface', () => {
    const validSnapshot: CFinancingFiveYearSnapshotResultInterface = {
        cumulativeNetCashFlow: 26151.6,
        totalPrincipalReduction: 14832.5,
        appreciationGain: 53191.3,
        estTaxBenefits: 10328.75,
        totalCumulativeWealth: 104503.15,
        annualizedROI: 0.2486,
        cumulativeWealthWithInitialInvestment: 169503.15,
    };

    it('should have a numeric cumulativeNetCashFlow', () => {
        expect(typeof validSnapshot.cumulativeNetCashFlow).toBe('number');
    });

    it('should have a numeric totalPrincipalReduction', () => {
        expect(typeof validSnapshot.totalPrincipalReduction).toBe('number');
    });

    it('should have a numeric appreciationGain', () => {
        expect(typeof validSnapshot.appreciationGain).toBe('number');
    });

    it('should have a numeric estTaxBenefits', () => {
        expect(typeof validSnapshot.estTaxBenefits).toBe('number');
    });

    it('should have a numeric totalCumulativeWealth', () => {
        expect(typeof validSnapshot.totalCumulativeWealth).toBe('number');
    });

    it('should have a numeric annualizedROI', () => {
        expect(typeof validSnapshot.annualizedROI).toBe('number');
    });

    it('should have a numeric cumulativeWealthWithInitialInvestment', () => {
        expect(typeof validSnapshot.cumulativeWealthWithInitialInvestment).toBe('number');
    });

    it('should accept negative cumulativeNetCashFlow (negative cash flow scenario)', () => {
        const negativeSnapshot: CFinancingFiveYearSnapshotResultInterface = {
            ...validSnapshot,
            cumulativeNetCashFlow: -5000,
        };
        expect(negativeSnapshot.cumulativeNetCashFlow).toBeLessThan(0);
    });

    it('should accept negative annualizedROI (loss scenario)', () => {
        const lossSnapshot: CFinancingFiveYearSnapshotResultInterface = {
            ...validSnapshot,
            annualizedROI: -0.05,
        };
        expect(lossSnapshot.annualizedROI).toBeLessThan(0);
    });

    it('should accept zero values across all fields', () => {
        const zeroSnapshot: CFinancingFiveYearSnapshotResultInterface = {
            cumulativeNetCashFlow: 0,
            totalPrincipalReduction: 0,
            appreciationGain: 0,
            estTaxBenefits: 0,
            totalCumulativeWealth: 0,
            annualizedROI: 0,
            cumulativeWealthWithInitialInvestment: 0,
        };
        Object.values(zeroSnapshot).forEach((val) => expect(val).toBe(0));
    });

    it('should contain all 7 required fields', () => {
        const keys = Object.keys(validSnapshot);
        expect(keys).toHaveLength(7);
        expect(keys).toEqual(
            expect.arrayContaining([
                'cumulativeNetCashFlow',
                'totalPrincipalReduction',
                'appreciationGain',
                'estTaxBenefits',
                'totalCumulativeWealth',
                'annualizedROI',
                'cumulativeWealthWithInitialInvestment',
            ]),
        );
    });
});
