import { CFinancingPurchaseSectionResultInterface } from './c-financing-purchase-section-result.interface';
import { CFinancingRefiSectionResultInterface } from './c-financing-refi-section-result.interface';
import { CFinancingLoanMetricsResultInterface } from './c-financing-loan-metrics-result.interface';
import { CFinancingFiveYearSnapshotResultInterface } from './c-financing-five-year-snapshot-result.interface';

export interface CFinancingColumnResultInterface {
    label: string;
    purchase: CFinancingPurchaseSectionResultInterface;
    refi: CFinancingRefiSectionResultInterface;
    loanMetrics: CFinancingLoanMetricsResultInterface;
    fiveYearSnapshot: CFinancingFiveYearSnapshotResultInterface;
}
