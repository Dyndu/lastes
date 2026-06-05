import { Injectable } from '@nestjs/common';

export interface WholesaleInput {
    investorPrice: number;
    targetProfit: number;
    holdingCostPerMonth: number;
    duration: number;
    transactionFee: number;
    otherFee: number;
    downPaymentPercent: number;
    loanInterest: number;
    loanLength: number;
    closingCostFees: number;
    sellerConcessions: number;
    credits: number;
    monthlyIncome: number;
    fixedExpensesTotal: number;
    estRepairs: number;
}

export interface WholesaleSummaryResult {
    dealSummary: {
        maxOffer: number;
        profit: number;
        investorROI: number;
        payback: number;
        price: number;
    };
    acquisitionCosts: {
        holdingCost: number;
        transactionFee: number;
        other: number;
        totalExpenses: number;
    };
    purchaseInformation: {
        purchasePrice: number;
        downPaymentAmount: number;
        loanAmount: number;
        interestRate: number;
        closingCosts: number;
        cashToClose: number;
    };
    performanceSummary: {
        monthlyIncome: number;
        noi: number;
        pi: number;
        monthlyExpenses: number;
        capRate: number;
        monthlyCashFlow: number;
    };
    projectCosts: {
        estRepairs: number;
        totalHoldingCost: number;
        closing: number;
        downPayment: number;
        credits: number;
        totalCashNeeded: number;
    };
}

@Injectable()
export class WholesaleCalculatorService {
    /**
     * Service responsible for handling wholesale summary calculations
     */

    /** Computes the total holding cost over the investment duration */
    computeHoldingCost = (holdingCostPerMonth: number, duration: number): number =>
        holdingCostPerMonth * duration;

    /** Computes the total acquisition cost by summing holding cost, transaction fee, and other fees */
    computeTotalAcquisitionCost = (
        holdingCost: number,
        transactionFee: number,
        otherFee: number,
    ): number => holdingCost + transactionFee + otherFee;

    /** Computes the maximum offer price: investor price minus target profit minus total acquisition cost */
    computeMaxOffer = (
        investorPrice: number,
        targetProfit: number,
        totalAcquisitionCost: number,
    ): number => investorPrice - targetProfit - totalAcquisitionCost;

    /** Computes the investor's return on investment as a percentage of total cash needed */
    computeInvestorROI = (monthlyCashFlow: number, totalCashNeeded: number): number =>
        totalCashNeeded === 0 ? 0 : (monthlyCashFlow / totalCashNeeded) * 100;

    /** Computes the payback period as the ratio of total cash needed to cash required to close */
    computePayback = (totalCashNeeded: number, totalCashToClose: number): number =>
        totalCashToClose === 0 ? 0 : totalCashNeeded / totalCashToClose;

    /** Computes the down payment amount from the investor price and the down payment percentage */
    computeDownPaymentAmount = (investorPrice: number, downPaymentPercent: number): number =>
        investorPrice * (downPaymentPercent / 100);

    /** Computes the loan amount as the investor price minus the down payment */
    computeLoanAmount = (investorPrice: number, downPaymentAmount: number): number =>
        investorPrice - downPaymentAmount;

    /** Computes the monthly principal and interest payment using the standard amortization formula */
    computePI = (loanAmount: number, annualRate: number, termMonths: number): number => {
        if (annualRate === 0) return loanAmount / termMonths;
        const r = annualRate / 100 / 12;
        return (loanAmount * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
    };

    /** Computes the total cash required to close: down payment + closing costs - seller concessions + credits */
    computeCashToClose = (
        downPaymentAmount: number,
        closingCostFees: number,
        sellerConcessions: number,
        credits: number,
    ): number => downPaymentAmount + closingCostFees - sellerConcessions + credits;

    /** Computes the net operating income as monthly income minus fixed expenses */
    computeNOI = (monthlyIncome: number, fixedExpensesTotal: number): number =>
        monthlyIncome - fixedExpensesTotal;

    /** Computes the capitalization rate as a percentage of NOI relative to investor price */
    computeCapRate = (noi: number, investorPrice: number): number =>
        investorPrice === 0 ? 0 : (noi / investorPrice) * 100;

    /** Computes the monthly cash flow as NOI minus the monthly P/I payment */
    computeMonthlyCashFlow = (noi: number, pi: number): number => noi - pi;

    /** Computes the total credits by summing seller concessions and rent credits */
    computeCredits = (sellerConcessions: number, rentCredits: number): number =>
        sellerConcessions + rentCredits;

    /** Computes the total cash needed for the project: repairs + holding cost + closing + down payment - credits */
    computeTotalCashNeeded = (
        estRepairs: number,
        totalHoldingCost: number,
        closingCostFees: number,
        downPaymentAmount: number,
        credits: number,
    ): number => estRepairs + totalHoldingCost + closingCostFees + downPaymentAmount - credits;

    /** Orchestrates all wholesale calculations and returns the full structured summary */
    computeWholesaleSummary = (input: WholesaleInput, rentCredits = 0): WholesaleSummaryResult => {
        const holdingCost = this.computeHoldingCost(input.holdingCostPerMonth, input.duration);
        const totalAcquisitionCost = this.computeTotalAcquisitionCost(
            holdingCost,
            input.transactionFee,
            input.otherFee,
        );

        const downPaymentAmount = this.computeDownPaymentAmount(
            input.investorPrice,
            input.downPaymentPercent,
        );
        const loanAmount = this.computeLoanAmount(input.investorPrice, downPaymentAmount);
        const pi = this.computePI(loanAmount, input.loanInterest, input.loanLength);
        const cashToClose = this.computeCashToClose(
            downPaymentAmount,
            input.closingCostFees,
            input.sellerConcessions,
            input.credits,
        );

        const noi = this.computeNOI(input.monthlyIncome, input.fixedExpensesTotal);
        const capRate = this.computeCapRate(noi, input.investorPrice);
        const monthlyCashFlow = this.computeMonthlyCashFlow(noi, pi);

        const credits = this.computeCredits(input.sellerConcessions, rentCredits);
        const totalCashNeeded = this.computeTotalCashNeeded(
            input.estRepairs,
            holdingCost,
            input.closingCostFees,
            downPaymentAmount,
            credits,
        );

        const maxOffer = this.computeMaxOffer(
            input.investorPrice,
            input.targetProfit,
            totalAcquisitionCost,
        );
        const investorROI = this.computeInvestorROI(monthlyCashFlow, totalCashNeeded);
        const payback = this.computePayback(totalCashNeeded, cashToClose);

        return {
            dealSummary: {
                maxOffer,
                profit: input.targetProfit,
                investorROI,
                payback,
                price: input.investorPrice,
            },
            acquisitionCosts: {
                holdingCost,
                transactionFee: input.transactionFee,
                other: input.otherFee,
                totalExpenses: totalAcquisitionCost,
            },
            purchaseInformation: {
                purchasePrice: input.investorPrice,
                downPaymentAmount,
                loanAmount,
                interestRate: input.loanInterest,
                closingCosts: input.closingCostFees,
                cashToClose,
            },
            performanceSummary: {
                monthlyIncome: input.monthlyIncome,
                noi,
                pi,
                monthlyExpenses: input.fixedExpensesTotal,
                capRate,
                monthlyCashFlow,
            },
            projectCosts: {
                estRepairs: input.estRepairs,
                totalHoldingCost: holdingCost,
                closing: input.closingCostFees,
                downPayment: downPaymentAmount,
                credits,
                totalCashNeeded,
            },
        };
    };
}
