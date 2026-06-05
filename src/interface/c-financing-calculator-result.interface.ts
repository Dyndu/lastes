import { CFinancingColumnResultInterface } from './c-financing-column-result.interface';

export interface CFinancingCalculatorResultInterface {
    globalParams: {
        annualAppreciationRate: number;
        depreciationPercentage: number;
        investorTaxBracket: number;
    };
    columns: CFinancingColumnResultInterface[];
}
