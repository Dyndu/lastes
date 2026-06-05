import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { RAnalysisService } from './r-analysis.service';

export interface MetricValue {
    value: number | null;
    label: string;
}

export interface RentalMetricsResult {
    annualDebtService: number;
    coc: MetricValue;
    oer: MetricValue;
    debtYield: MetricValue;
    paybackPeriod: MetricValue;
    noi: MetricValue;
    ltvRatio: MetricValue;
    capRate: MetricValue;
    dscr: MetricValue;
    equityMultiplier: MetricValue;
    grm: MetricValue;
    cashFlow: MetricValue;
    ltcRatio: MetricValue;
    costPerUnit: MetricValue;
    incomeStatement: {
        goi: number;
        goiMonthly: number;
        noi: number;
        cashFlow: number;
    };
}

export interface RentalMetricsInput {
    purchasePrice: number;
    sellerConcessions: number;
    rentCredits: number;
    numberOfUnits: number;

    loanAmount: number;
    loanInterest: number;
    loanLength: number;

    projectedYearlyRent: number;
    occupancyRate: number;
    otherMonthlyIncome: number;

    fixedExpensesTotal: number;
    propertyTaxes: number;
    hazardInsurance: number;
    totalUtilities: number;
    maintenanceEscrow: number;
    managementFees: number;
    repairs: number;

    pi: number;
    pmi: number;

    estimatedCashToClose: number;
}

export type MetricThreshold = { max?: number; min?: number; label: string };

const METRIC_THRESHOLDS: Record<string, MetricThreshold[]> = {
    coc: [
        { min: 15, label: 'Strong return on invested capital' },
        { min: 8, label: 'Good return on invested capital' },
        { min: 5, label: 'Moderate return' },
        { label: 'Low return' },
    ],
    oer: [
        { max: 35, label: 'Excellent' },
        { max: 50, label: 'Good Ratio' },
        { max: 65, label: 'Moderate' },
        { label: 'Too High' },
    ],
    debtYield: [
        { min: 10, label: 'Strong' },
        { min: 7, label: 'Good Ratio' },
        { label: 'Too High' },
    ],
    paybackPeriod: [
        { max: 7, label: 'Excellent' },
        { max: 10, label: 'Good Ratio' },
        { max: 15, label: 'Moderate' },
        { label: 'Too Long' },
    ],
    noi: [{ min: 0.01, label: 'Good Ratio' }, { label: 'Negative NOI' }],
    ltvRatio: [
        { max: 70, label: 'Good Ratio' },
        { max: 80, label: 'Moderate' },
        { label: 'Too High' },
    ],
    capRate: [
        { min: 8, label: 'Excellent' },
        { min: 5, label: 'Good Ratio' },
        { label: 'Too Low' },
    ],
    dscr: [
        { min: 2, label: 'Good Ratio' },
        { min: 1.25, label: 'Acceptable' },
        { label: 'Too Low' },
    ],
    equityMultiplier: [
        { min: 3, label: 'Good Ratio' },
        { min: 2, label: 'Moderate' },
        { label: 'Too Low' },
    ],
    grm: [{ max: 10, label: 'Good Ratio' }, { max: 14, label: 'Moderate' }, { label: 'Too High' }],
    cashFlow: [
        { min: 5000, label: 'Excellent' },
        { min: 1000, label: 'Good Ratio' },
        { min: 0, label: 'Moderate' },
        { label: 'Negative' },
    ],
    ltcRatio: [
        { max: 70, label: 'Good Ratio' },
        { max: 80, label: 'Moderate' },
        { label: 'Too Low' },
    ],
};

@Injectable()
export class RentalMetricsCalculatorService {
    /**
     * Service responsible for rental analysis financial metrics calculations
     */

    constructor(
        @Inject(forwardRef(() => RAnalysisService))
        private readonly service: RAnalysisService,
    ) {}

    /** Computes annual debt service as monthly P/I multiplied by 12 */
    computeAnnualDebtService = (pi: number): number => pi * 12;

    /**
     * Computes gross operating income.
     * Formula: (projected yearly rent x occupancy rate) + (other monthly income x 12)
     */
    computeGOI = (
        projectedYearlyRent: number,
        occupancyRate: number,
        otherMonthlyIncome: number,
    ): number => projectedYearlyRent * (occupancyRate / 100) + otherMonthlyIncome * 12;

    /**
     * Computes net operating income.
     * Formula: total income - fixed expenses (does NOT include P/I)
     */
    computeNOI = (totalYearlyIncome: number, yearlyFixedExpenses: number): number =>
        totalYearlyIncome - yearlyFixedExpenses;

    /**
     * Computes cash on cash return.
     * Formula: (NOI - annual debt service - annual PMI) / total cash invested
     */
    computeCoC = (
        noi: number,
        annualDebtService: number,
        annualPmi: number,
        totalCashInvested: number,
    ): number =>
        totalCashInvested === 0 ? 0 : (noi - annualDebtService - annualPmi) / totalCashInvested;

    /**
     * Computes operating expense ratio.
     * Formula: (total operating expenses / gross income) x 100
     * Does NOT include debt service in operating expenses.
     */
    computeOER = (yearlyFixedExpenses: number, goi: number): number =>
        goi === 0 ? 0 : (yearlyFixedExpenses / goi) * 100;

    /**
     * Computes debt yield percentage.
     * Formula: (NOI / total loan amount) x 100
     */
    computeDebtYield = (noi: number, loanAmount: number): number =>
        loanAmount === 0 ? 0 : (noi / loanAmount) * 100;

    /**
     * Computes payback period.
     * Formula: total cash invested / yearly gross profit
     */
    computePaybackPeriod = (totalCashInvested: number, yearlyGrossProfit: number): number =>
        yearlyGrossProfit === 0 ? 0 : totalCashInvested / yearlyGrossProfit;

    /**
     * Computes loan to value ratio.
     * Formula: (loan amount / property value) x 100
     */
    computeLTVRatio = (loanAmount: number, propertyValue: number): number =>
        propertyValue === 0 ? 0 : (loanAmount / propertyValue) * 100;

    /**
     * Computes capitalization rate.
     * Formula: (NOI / purchase price) x 100
     */
    computeCapRate = (noi: number, purchasePrice: number): number =>
        purchasePrice === 0 ? 0 : (noi / purchasePrice) * 100;

    /**
     * Computes debt service coverage ratio.
     * Formula: NOI / (annual debt service - annual PMI)
     */
    computeDSCR = (noi: number, annualDebtService: number, annualPmi: number): number => {
        const denominator = annualDebtService - annualPmi;
        return denominator === 0 ? 0 : noi / denominator;
    };

    /**
     * Computes gross rent multiplier.
     * Formula: purchase price / total yearly income
     */
    computeGRM = (purchasePrice: number, totalYearlyIncome: number): number =>
        totalYearlyIncome === 0 ? 0 : purchasePrice / totalYearlyIncome;

    /**
     * Computes annual cash flow.
     * Formula: NOI - annual debt service
     */
    computeCashFlow = (noi: number, annualDebtService: number): number => noi - annualDebtService;

    /**
     * Computes loan to cost ratio.
     * Formula: (loan amount / total repair costs) x 100
     * Returns null when there are no repair costs.
     */
    computeLTCRatio = (loanAmount: number, totalRepairCosts: number): number | null =>
        totalRepairCosts === 0 ? null : (loanAmount / totalRepairCosts) * 100;

    /**
     * Computes cost per unit.
     * Formula: (purchase price + seller concessions + rent credits + repairs) / number of units
     */
    computeCostPerUnit = (
        purchasePrice: number,
        sellerConcessions: number,
        rentCredits: number,
        repairs: number,
        numberOfUnits: number,
    ): number =>
        numberOfUnits === 0
            ? 0
            : (purchasePrice + sellerConcessions + rentCredits + repairs) / numberOfUnits;

    getMetricLabel(metric: string, value: number): string {
        const thresholds = METRIC_THRESHOLDS[metric];
        if (!thresholds) return '';

        return (
            thresholds.find(
                (t) =>
                    (t.min === undefined || value >= t.min) &&
                    (t.max === undefined || value <= t.max),
            )?.label ?? ''
        );
    }

    /** Orchestrates all rental financial metrics calculations and returns the full structured result */
    computeRentalMetrics = (input: RentalMetricsInput): RentalMetricsResult => {
        const r = this.service.otherUtils.r2.bind(this.service.otherUtils);

        const annualDebtService = this.computeAnnualDebtService(input.pi);
        const annualPmi = input.pmi * 12;
        const yearlyFixedExpenses = input.fixedExpensesTotal * 12;

        const goi = this.computeGOI(
            input.projectedYearlyRent,
            input.occupancyRate,
            input.otherMonthlyIncome,
        );
        const noi = this.computeNOI(goi, yearlyFixedExpenses);
        const coc = this.computeCoC(noi, annualDebtService, annualPmi, input.estimatedCashToClose);
        const oer = this.computeOER(yearlyFixedExpenses, goi);
        const debtYield = this.computeDebtYield(noi, input.loanAmount);
        const paybackPeriod = this.computePaybackPeriod(input.estimatedCashToClose, goi);
        const ltvRatio = this.computeLTVRatio(input.loanAmount, input.purchasePrice);
        const capRate = this.computeCapRate(noi, input.purchasePrice);
        const dscr = this.computeDSCR(noi, annualDebtService, annualPmi);
        const grm = this.computeGRM(input.purchasePrice, goi);
        const cashFlow = this.computeCashFlow(noi, annualDebtService);
        const ltcRatio = this.computeLTCRatio(input.loanAmount, input.repairs);
        const costPerUnit = this.computeCostPerUnit(
            input.purchasePrice,
            input.sellerConcessions,
            input.rentCredits,
            input.repairs,
            input.numberOfUnits,
        );
        const equityMultiplier =
            input.estimatedCashToClose === 0 ? 0 : input.purchasePrice / input.estimatedCashToClose;

        const label = (metric: string, value: number) => this.getMetricLabel(metric, value);

        return {
            annualDebtService: r(annualDebtService),
            coc: { value: r(coc * 100), label: label('coc', coc * 100) },
            oer: { value: r(oer), label: label('oer', oer) },
            debtYield: { value: r(debtYield), label: label('debtYield', debtYield) },
            paybackPeriod: {
                value: r(paybackPeriod),
                label: label('paybackPeriod', paybackPeriod),
            },
            noi: { value: r(noi), label: label('noi', noi) },
            ltvRatio: { value: r(ltvRatio), label: label('ltvRatio', ltvRatio) },
            capRate: { value: r(capRate), label: label('capRate', capRate) },
            dscr: { value: r(dscr), label: label('dscr', dscr) },
            equityMultiplier: {
                value: r(equityMultiplier),
                label: label('equityMultiplier', equityMultiplier),
            },
            grm: { value: r(grm), label: label('grm', grm) },
            cashFlow: { value: r(cashFlow), label: label('cashFlow', cashFlow) },
            ltcRatio: {
                value: ltcRatio === null ? null : r(ltcRatio),
                label: label('ltcRatio', ltcRatio ?? 0),
            },
            costPerUnit: { value: r(costPerUnit), label: '' },
            incomeStatement: {
                goi: r(goi),
                goiMonthly: r(goi / 12),
                noi: r(noi),
                cashFlow: r(cashFlow),
            },
        };
    };
}
