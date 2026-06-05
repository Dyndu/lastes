export interface CFinancingRefiSectionResultInterface {
    principalPaidDown: number | null;
    newLoanAmount: number | null;
    refiInterestRate: number | null;
    refiLoanLengthYears: number | null;
    refiClosingCosts: number | null;
    newMortgagePaymentPI: number | null;
    totalCashReceivedPostRefi: number | null;
    totalCashInvested: number;
    depreciableAmount: number;
    annualTaxDeduction: number;
    estTaxCashSavings: number;
    annualizedCashOnCashReturn: number;
    paybackPeriodCashOnly: number;
    afterTaxPaybackPeriod: number;
}
