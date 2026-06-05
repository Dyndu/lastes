import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { RAnalysisService } from './r-analysis.service';

export interface DealGradeInput {
    purchasePrice: number;
    loanAmount: number;
    loanInterest: number;
    loanLength: number;
    pi: number;
    pmi: number;
    grossMonthlyRent: number;
    vacancyRate: number;
    propertyTaxes: number;
    insurance: number;
    utilities: number;
    managementPct: number;
    maintenancePct: number;
    sellerConcessions: number;
    rentCredits: number;
    acquisitionCost: number;
    estimatedCashToClose: number;

    zipCapAvg: number;
    minCashflowTarget: number;
    debtRiskFlag: number;
    capitalExtracted: number;
}

@Injectable()
export class DealGradeCalculatorService {
    constructor(
        @Inject(forwardRef(() => RAnalysisService))
        private readonly service: RAnalysisService,
    ) {}

    scoreCurve(x: number, points: [number, number][]): number {
        const n = points.length;
        if (n === 0) return 0;
        if (x <= points[0][0]) return points[0][1];
        if (x >= points[n - 1][0]) return points[n - 1][1];
        for (let i = 0; i < n - 1; i++) {
            const [x1, s1] = points[i];
            const [x2, s2] = points[i + 1];
            if (x >= x1 && x <= x2)
                return this.service.otherUtils.lerp(s1, s2, (x - x1) / (x2 - x1));
        }
        return 0;
    }

    ratingLabel(score: number): { rating: string; riskBand: string } {
        if (score >= 85) return { rating: 'Strong Buy', riskBand: 'low' };
        if (score >= 70) return { rating: 'Buy', riskBand: 'moderate' };
        if (score >= 55) return { rating: 'Neutral', riskBand: 'moderate' };
        if (score >= 40) return { rating: 'Caution', riskBand: 'high' };
        return { rating: 'Avoid', riskBand: 'high' };
    }

    scoreClass(s: number): 'good' | 'mid' | 'bad' {
        if (s >= 80) return 'good';
        if (s >= 60) return 'mid';
        return 'bad';
    }

    computeMaxSustainableVacancy(
        grossAnnual: number,
        fixedOpexAnnual: number,
        annualDebtService: number,
        variableRatio: number,
    ): number {
        if (grossAnnual <= 0) return 0;
        const vr = this.service.otherUtils.clamp(variableRatio, 0, 0.9);
        const den = 1 - vr;
        if (den <= 0.0001) return 0;
        const needed = (fixedOpexAnnual + annualDebtService) / den;
        const maxVacancy = 1 - needed / grossAnnual;
        return this.service.otherUtils.clamp(maxVacancy, 0, 1);
    }

    computeMetrics(input: DealGradeInput) {
        const {
            purchasePrice,
            pi,
            pmi,
            grossMonthlyRent,
            vacancyRate,
            propertyTaxes,
            insurance,
            utilities,
            managementPct,
            maintenancePct,
            estimatedCashToClose,
            zipCapAvg,
            capitalExtracted,
        } = input;

        const totalMonthlyPayment = pi + pmi;
        const effectiveRent = grossMonthlyRent * (1 - vacancyRate);

        const mgmtMonthly = effectiveRent * managementPct;
        const maintMonthly = effectiveRent * maintenancePct;

        const monthlyOpexNoDebt =
            propertyTaxes + insurance + utilities + mgmtMonthly + maintMonthly;
        const totalExpensesMonthly = monthlyOpexNoDebt + totalMonthlyPayment;

        const monthlyCashflow = effectiveRent - totalExpensesMonthly;

        const grossAnnual = grossMonthlyRent * 12;
        const effectiveGrossAnnual = effectiveRent * 12;
        const opexAnnualNoDebt = monthlyOpexNoDebt * 12;
        const debtAnnual = totalMonthlyPayment * 12;

        const noiAnnual = effectiveGrossAnnual - opexAnnualNoDebt;
        const cashflowAnnual = monthlyCashflow * 12;

        const capRate = purchasePrice > 0 ? noiAnnual / purchasePrice : 0;
        const cocReturn = estimatedCashToClose > 0 ? cashflowAnnual / estimatedCashToClose : 0;
        const grm = grossAnnual > 0 ? purchasePrice / grossAnnual : 999;
        const paybackYears = cashflowAnnual > 0 ? estimatedCashToClose / cashflowAnnual : 99;
        const dscr = debtAnnual > 0 ? noiAnnual / debtAnnual : 99;
        const breakEven = grossAnnual > 0 ? (opexAnnualNoDebt + debtAnnual) / grossAnnual : 1;
        const capPremium = capRate - zipCapAvg;

        const dscrLoanMin = 1.25;
        const dscrQualifies = debtAnnual <= 0 ? true : dscr >= dscrLoanMin;
        const dscrBand = this.dscrBandCode(dscr);

        const fixedOpexAnnual = (propertyTaxes + insurance + utilities) * 12;
        const variableRatio = managementPct + maintenancePct;
        const maxSustainableVacancy = this.computeMaxSustainableVacancy(
            grossAnnual,
            fixedOpexAnnual,
            debtAnnual,
            variableRatio,
        );

        const capitalRecoveryMultiple =
            estimatedCashToClose > 0 ? capitalExtracted / estimatedCashToClose : 0;
        const givebackMonths =
            monthlyCashflow < 0 && capitalExtracted > 0
                ? capitalExtracted / Math.abs(monthlyCashflow)
                : 0;
        const givebackYears = givebackMonths / 12;

        const debtGapMoDscr125 =
            debtAnnual > 0 && dscr < dscrLoanMin
                ? Math.max(0, (debtAnnual - noiAnnual / dscrLoanMin) / 12)
                : 0;

        const expenseRatio = grossAnnual > 0 ? opexAnnualNoDebt / grossAnnual : 1;

        return {
            monthlyCashflow,
            cashflowAnnual,
            noiAnnual,
            grossAnnual,
            effectiveGrossAnnual,
            opexAnnualNoDebt,
            debtAnnual,
            capRate,
            cocReturn,
            grm,
            paybackYears,
            dscr,
            breakEven,
            capPremium,
            dscrQualifies,
            dscrBand,
            dscrLoanMin,
            debtGapMoDscr125,
            expenseRatio,
            maxSustainableVacancy,
            capitalRecoveryMultiple,
            givebackMonths,
            givebackYears,
            mgmtMonthly,
            maintMonthly,
            totalMonthlyPayment,
        };
    }

    dscrBandCode(dscr: number): number {
        if (dscr < 1) return 0;
        if (dscr < 1.25) return 1;
        if (dscr < 2) return 2;
        if (dscr < 3) return 3;
        if (dscr < 4) return 4;
        return 5;
    }

    computeScores(metrics: ReturnType<typeof this.computeMetrics>, debtAnnual: number) {
        const {
            capPremium,
            cocReturn,
            paybackYears,
            grm,
            dscr,
            breakEven,
            maxSustainableVacancy,
            cashflowAnnual,
        } = metrics;

        let capScore = this.scoreCurve(capPremium, [
            [-0.03, 10],
            [-0.02, 25],
            [-0.01, 45],
            [0, 70],
            [0.01, 85],
            [0.02, 95],
            [0.03, 100],
        ]);
        let cocScore = this.scoreCurve(cocReturn, [
            [-0.05, 0],
            [0, 10],
            [0.05, 45],
            [0.08, 65],
            [0.1, 78],
            [0.12, 88],
            [0.15, 96],
            [0.18, 100],
        ]);
        let paybackScore = this.scoreCurve(paybackYears, [
            [5, 92],
            [6, 88],
            [8, 82],
            [10, 72],
            [12, 60],
            [15, 35],
            [20, 10],
        ]);
        const grmScore = this.scoreCurve(grm, [
            [7, 95],
            [8, 90],
            [10, 85],
            [12, 70],
            [14, 55],
            [16, 40],
            [18, 25],
            [22, 10],
        ]);
        let dscrScore = this.scoreCurve(dscr, [
            [0.9, 5],
            [1, 15],
            [1.1, 45],
            [1.2, 70],
            [1.3, 86],
            [1.4, 96],
            [1.6, 100],
        ]);
        const beScore = this.scoreCurve(breakEven, [
            [0.7, 92],
            [0.75, 88],
            [0.85, 80],
            [0.9, 65],
            [0.95, 45],
            [1, 25],
            [1.05, 10],
        ]);
        const vacMarginScore = this.scoreCurve(maxSustainableVacancy, [
            [0, 0],
            [0.05, 20],
            [0.1, 45],
            [0.15, 65],
            [0.2, 78],
            [0.25, 90],
            [0.3, 96],
            [0.35, 100],
        ]);

        if (cashflowAnnual <= 0) {
            paybackScore = 0;
            cocScore = Math.min(cocScore, 15);
        }
        if (debtAnnual <= 0) dscrScore = 100;

        return { capScore, cocScore, paybackScore, grmScore, dscrScore, beScore, vacMarginScore };
    }

    computePillars(
        scores: ReturnType<typeof this.computeScores>,
        metrics: ReturnType<typeof this.computeMetrics>,
        input: DealGradeInput,
        estimatedCashToClose: number,
    ) {
        const { capScore, cocScore, paybackScore, grmScore, dscrScore, beScore, vacMarginScore } =
            scores;
        const { cashflowAnnual, debtAnnual, breakEven, dscr } = metrics;

        let returnPillar = capScore * 0.6 + cocScore * 0.4;
        let effPillar = paybackScore * 0.7 + grmScore * 0.3;
        let stabPillar = dscrScore * 0.5 + beScore * 0.3 + vacMarginScore * 0.2;

        if (input.debtRiskFlag >= 1 && debtAnnual > 0)
            stabPillar *= input.debtRiskFlag === 1 ? 0.88 : 0.82;

        const wReturn = 0.35;
        const wEff = 0.2;
        const wStab = 0.45;

        let overall = returnPillar * wReturn + effPillar * wEff + stabPillar * wStab;
        let overallCap = 100;
        const overrideNotes: string[] = [];

        if (dscr < 1 && debtAnnual > 0) {
            overallCap = Math.min(overallCap, 45);
            overrideNotes.push('Guardrail: DSCR below 1.00 caps overall score.');
        }
        if (breakEven > 1) {
            overallCap = Math.min(overallCap, 40);
            overrideNotes.push('Guardrail: Break-even above 100% caps overall score.');
        }
        if (cashflowAnnual < 0) {
            effPillar = Math.min(effPillar, 40);
            overall = returnPillar * wReturn + effPillar * wEff + stabPillar * wStab;
            overrideNotes.push('Guardrail: Negative cash flow caps Efficiency pillar.');
        }

        const cashPct = input.purchasePrice > 0 ? estimatedCashToClose / input.purchasePrice : 0;
        const capitalGuardrail =
            estimatedCashToClose <= 0 || cashPct < 0.05 || estimatedCashToClose < 5000;
        if (capitalGuardrail) {
            effPillar = capScore * 0.6 + grmScore * 0.4;
            returnPillar = capScore * 0.8 + grmScore * 0.2;
            overall = returnPillar * wReturn + effPillar * wEff + stabPillar * wStab;
            overallCap = Math.min(overallCap, 85);
            overrideNotes.push('Capital Structure Guardrail: Low cash-in detected.');
        }

        let holdIntegrityFlag = false;
        if (
            input.capitalExtracted > 0 &&
            (cashflowAnnual < 0 || (debtAnnual > 0 && dscr < 1.15) || breakEven > 0.95)
        ) {
            holdIntegrityFlag = true;
            overallCap = Math.min(overallCap, 70);
            overrideNotes.push(
                'Hold Integrity Guardrail: Capital was pulled out, but current hold quality is weak.',
            );
        }

        if (overall > overallCap) overall = overallCap;

        return {
            returnPillar: this.service.otherUtils.r2(returnPillar),
            effPillar: this.service.otherUtils.r2(effPillar),
            stabPillar: this.service.otherUtils.r2(stabPillar),
            overall: this.service.otherUtils.r2(overall),
            overallCap,
            overrideNotes,
            holdIntegrityFlag,
            wReturn,
            wEff,
            wStab,
        };
    }

    computeDrivers(scores: ReturnType<typeof this.computeScores>) {
        const metricScores = {
            'Cap Premium': scores.capScore,
            'Cash on Cash': scores.cocScore,
            Payback: scores.paybackScore,
            GRM: scores.grmScore,
            DSCR: scores.dscrScore,
            'Break-even': scores.beScore,
            'Vacancy Margin': scores.vacMarginScore,
        };

        const sorted = Object.entries(metricScores).sort((a, b) => a[1] - b[1]);
        const drags = sorted.slice(0, 2);
        const strengths = sorted.slice(-2).reverse();

        return { metricScores, drags, strengths };
    }

    computeKeyMetrics = (metrics: ReturnType<typeof this.computeMetrics>) => ({
        noi: this.service.otherUtils.r2(metrics.noiAnnual),
        cashRate: this.service.otherUtils.r2(metrics.cocReturn * 100),
        capRate: this.service.otherUtils.r2(metrics.capRate * 100),
        grossGain: this.service.otherUtils.r2(metrics.cashflowAnnual),
        dscr: this.service.otherUtils.r2(metrics.dscr),
        breakEvenRatio: this.service.otherUtils.r2(metrics.breakEven * 100),
    });

    computeMaxOffer(metrics: ReturnType<typeof this.computeMetrics>, input: DealGradeInput) {
        const { noiAnnual, cashflowAnnual, grm, capRate } = metrics;
        const { zipCapAvg, purchasePrice } = input;

        const targetPriceZipCap = zipCapAvg > 0 ? noiAnnual / zipCapAvg : purchasePrice;
        const adjustedMaxOffer = targetPriceZipCap;
        const priceDelta = purchasePrice - targetPriceZipCap;

        return {
            currentData: {
                cocReturn: this.service.otherUtils.r2(metrics.cocReturn * 100),
                ltv: this.service.otherUtils.r2(
                    input.loanAmount > 0 ? (input.loanAmount / purchasePrice) * 100 : 0,
                ),
                yearlyCashFlow: this.service.otherUtils.r2(cashflowAnnual),
                capRate: this.service.otherUtils.r2(capRate * 100),
                grm: this.service.otherUtils.r2(grm),
                paybackPeriod: this.service.otherUtils.r2(metrics.paybackYears),
            },
            adjustedMaxOffer: {
                price: this.service.otherUtils.r2(adjustedMaxOffer),
                priceDelta: this.service.otherUtils.r2(priceDelta),
            },
        };
    }

    computeDealGrade(input: DealGradeInput) {
        const metrics = this.computeMetrics(input);
        const scores = this.computeScores(metrics, metrics.debtAnnual);
        const pillars = this.computePillars(scores, metrics, input, input.estimatedCashToClose);
        const drivers = this.computeDrivers(scores);
        const { rating, riskBand } = this.ratingLabel(pillars.overall);
        const keyMetrics = this.computeKeyMetrics(metrics);
        const maxOffer = this.computeMaxOffer(metrics, input);

        return {
            underwritingBonus: {
                overallScore: pillars.overall,
                overallCap: pillars.overallCap,
                rating,
                riskBand,
                monthlyCashFlow: this.service.otherUtils.r2(metrics.monthlyCashflow),
                weights: {
                    return: pillars.wReturn * 100,
                    efficiency: pillars.wEff * 100,
                    stability: pillars.wStab * 100,
                },
                overrideNotes: pillars.overrideNotes,
                holdIntegrityFlag: pillars.holdIntegrityFlag,
            },

            // Strengths and Weaknesses
            strengthsAndWeaknesses: {
                drags: drivers.drags.map(([k, v]) => ({
                    metric: k,
                    score: this.service.otherUtils.r2(v),
                    class: this.scoreClass(v),
                })),
                strengths: drivers.strengths.map(([k, v]) => ({
                    metric: k,
                    score: this.service.otherUtils.r2(v),
                    class: this.scoreClass(v),
                })),
            },

            // Key Underwriting Metrics
            keyMetrics,

            // 3 Pillars
            pillars: {
                return: {
                    score: pillars.returnPillar,
                    class: this.scoreClass(pillars.returnPillar),
                    metrics: [
                        {
                            label: 'Cap Premium vs ZIP',
                            value: this.service.otherUtils.r2(metrics.capPremium * 100),
                            score: this.service.otherUtils.r2(scores.capScore),
                            class: this.scoreClass(scores.capScore),
                        },
                        {
                            label: 'Cash on Cash',
                            value: this.service.otherUtils.r2(metrics.cocReturn * 100),
                            score: this.service.otherUtils.r2(scores.cocScore),
                            class: this.scoreClass(scores.cocScore),
                        },
                    ],
                },
                efficiency: {
                    score: pillars.effPillar,
                    class: this.scoreClass(pillars.effPillar),
                    metrics: [
                        {
                            label: 'Payback',
                            value: this.service.otherUtils.r2(metrics.paybackYears),
                            score: this.service.otherUtils.r2(scores.paybackScore),
                            class: this.scoreClass(scores.paybackScore),
                        },
                        {
                            label: 'GRM',
                            value: this.service.otherUtils.r2(metrics.grm),
                            score: this.service.otherUtils.r2(scores.grmScore),
                            class: this.scoreClass(scores.grmScore),
                        },
                    ],
                },
                stability: {
                    score: pillars.stabPillar,
                    class: this.scoreClass(pillars.stabPillar),
                    metrics: [
                        {
                            label: 'DSCR',
                            value: this.service.otherUtils.r2(metrics.dscr),
                            score: this.service.otherUtils.r2(scores.dscrScore),
                            class: this.scoreClass(scores.dscrScore),
                        },
                        {
                            label: 'Break-even',
                            value: this.service.otherUtils.r2(metrics.breakEven * 100),
                            score: this.service.otherUtils.r2(scores.beScore),
                            class: this.scoreClass(scores.beScore),
                        },
                        {
                            label: 'Vacancy Safety Margin',
                            value: this.service.otherUtils.r2(metrics.maxSustainableVacancy * 100),
                            score: this.service.otherUtils.r2(scores.vacMarginScore),
                            class: this.scoreClass(scores.vacMarginScore),
                        },
                    ],
                },
            },

            maxOfferCalculator: maxOffer,
        };
    }
}
