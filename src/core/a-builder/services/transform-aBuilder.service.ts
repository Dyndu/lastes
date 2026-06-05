import { Injectable } from '@nestjs/common';
import {
    ADetailsEntity,
    AdItemizedEntity,
    BaseRefiEntity,
    BrRefinanceEntity,
    CCoastEntity,
    FExpensesEntity,
    HCoastEntity,
    HCoastItemizedEntity,
    HDurationEntity,
    PDetailsEntity,
    RDurationEntity,
    RefinanceEntity,
    RefinanceItemEntity,
    RepairsEntity,
    SaleEntity,
    UnitEntity,
} from '../entities';

@Injectable()
export class TransformABuilderService {
    /**
     * Service responsible for transforming analysis builder entities and related to ui view
     */

    /**
     * Transforms a UnitEntity into a simplified object containing the id, sqFootage, bedRooms,
     * bathRooms, and monthlyRent fields.
     */
    transformUnit = (u: UnitEntity) => ({
        id: u.id,
        sqFootage: u.sqFootage,
        bedRooms: u.bedRooms,
        bathRooms: u.bathRooms,
        monthlyRent: u.monthlyRent,
    });

    /**
     * Transforms an array of UnitEntity objects into an array of simplified unit objects using the transformUnit method.
     */
    transformUnits = (us: UnitEntity[]) => us.map((u) => this.transformUnit(u));

    /**
     * Transforms a PDetailsEntity into a structured object containing the id, status, monthlyIncome,
     * totalIncome, and an array of transformed units (if units exist).
     */
    transformPDetails = (p: PDetailsEntity) => ({
        id: p.id,
        status: p.status,
        monthlyIncome: p.monthlyIncome,
        totalIncome: p.totalIncome,
        totalGrossIncome: p.totalGrossIncome,
        units: p.units?.length > 0 ? this.transformUnits(p.units) : [],
    });

    /**
     * Transforms an AdItemizedEntity into a structured object containing the id, originationFee,
     * hazardInsurance, floodInsurance, propertyTaxes, and annualAssessment fields.
     */
    transformADItem = (i: AdItemizedEntity) => ({
        id: i.id,
        originationFee: i.originationFee,
        hazardInsurance: i.hazardInsurance,
        floodInsurance: i.floodInsurance,
        propertyTaxes: i.propertyTaxes,
        annualAssessment: i.annualAssessment,
    });

    /**
     * Transforms an ADetailsEntity into a structured object containing the id, method, purchasePrice,
     * sellerConcessions, credits, acquisitionCoast, down payment, loanInterest, loanLength, loanType,
     * and a transformed itemized object (if present).
     */
    transformADetails = (a: ADetailsEntity) => ({
        id: a.id,
        method: a.method,
        purchasePrice: a.purchasePrice,
        sellerConcessions: a.sellerConcessions,
        credits: a.credits,
        acquisitionCoast: a.acquisitionCoast,
        downPayment: a.downPayment,
        loanInterest: a.loanInterest,
        loanLength: a.loanLength,
        loanType: a.loanType,
        points: a.points,
        closingCostFees: a.closingCostFees,
        holdingPeriod: a.holdingPeriod,
        othersFees: a.othersFees,
        monthlyIncome: a.monthlyIncome,
        earnestMoneyDeposit: a.earnestMoneyDeposit,
        itemized: a.itemized ? this.transformADItem(a.itemized) : null,
    });

    /**
     * Transforms a generic item object into a structured object containing the id, roof, landscaping,
     * concierge, garage, and bathrooms fields.
     */
    transformRItem = (item: any) => ({
        id: item.id,
        roof: item.roof,
        landscaping: item.landscaping,
        concierge: item.concierge,
        garage: item.garage,
        bathrooms: item.bathrooms,
    });

    /**
     * Transforms a RepairsEntity into a structured object containing the id and transformed interior (iRepairs),
     * outdoor (oRepairs), and exterior (eRepairs) repair items (if present).
     */
    transformRepairs = (r: RepairsEntity) => ({
        id: r.id,
        total: r.total,
        afterRepairsValue: r.afterRepairsValue,
        iRepairs: r.iRepairs ? this.transformRItem(r.iRepairs) : null,
        oRepairs: r.oRepairs ? this.transformRItem(r.oRepairs) : null,
        eRepairs: r.eRepairs ? this.transformRItem(r.eRepairs) : null,
    });

    /**
     * Transforms an FExpensesEntity into a structured object containing the id and all associated expense fields:
     * sewer, water, trash, gas, electric, internet, other, hoaFees, propertyTaxes, hazardInsurance,
     * additionalFees, cashReserves, managementFees, and maintenanceEscrow.
     */
    transformFExpenses = (r: FExpensesEntity) => ({
        id: r.id,
        sewer: r.sewer,
        water: r.water,
        trash: r.trash,
        gas: r.gas,
        electric: r.electric,
        internet: r.internet,
        other: r.other,
        hoaFees: r.hoaFees,
        propertyTaxes: r.propertyTaxes,
        hazardInsurance: r.hazardInsurance,
        additionalFees: r.additionalFees,
        cashReserves: r.cashReserves,
        managementFees: r.managementFees,
        maintenanceEscrow: r.maintenanceEscrow,
    });

    /**
     * Transforms a holding duration entity into a structured response object.
     * Maps core duration and financial fields, renames holding cost for output consistency,
     * and conditionally transforms associated itemized data when present.
     */
    transformHDuration = (h: HDurationEntity) => ({
        id: h.id,
        duration: h.duration,
        transactionFee: h.transactionFee,
        otherFee: h.otherFee,
        targetProfit: h.targetProfit,
        holdingCost: h.holdingCoast,
        item: h.itemized ? this.transformRItem(h.itemized) : null,
    });

    /**
     * Transforms a sale entities into a structured object.
     * Extracts the sale's ID, after repair value, sale closing cost, target profit,
     * and transforms associated itemized data if present.
     */
    transformSale = (sa: SaleEntity) => ({
        id: sa.id,
        afterRepairValue: sa.afterRepairValue,
        saleClosingCoast: sa.saleClosingCoast,
        targetProfit: sa.targetProfit,
        itemized: sa.itemized ? this.transformADItem(sa.itemized) : null,
    });

    /**
     * Transforms a holding cost itemized entity into a simplified DTO.
     * Extracts the entity identifier and maps all utility, tax, and miscellaneous expense fields into a structured object.
     */
    transformHCItemized = (data: HCoastItemizedEntity) => ({
        id: data.id,
        electricity: data.electricity,
        gas: data.gas,
        water: data.water,
        trash: data.trash,
        propertyTaxes: data.propertyTaxes,
        other: data.other,
    });

    /**
     * Transforms a holding cost entity into a simplified DTO.
     * Extracts core holding cost fields including total cost, duration, and PI value.
     * Conditionally transforms and includes itemized holding cost details when available.
     */
    transformHCoast = (data: HCoastEntity) => ({
        id: data.id,
        holdingCoast: data.holdingCoast,
        pIValue: data.pIValue,
        duration: data.duration,
        durationInMonth: data.durationInMonth,
        itemized: data.itemized ? this.transformHCItemized(data.itemized) : null,
    });

    /**
     * Transforms a refinancing item entity into a structured response object.
     * Maps identifier, label, and value fields into a normalized output format.
     */
    transformRefiItem = (item: RefinanceItemEntity) => ({
        id: item.id,
        label: item.label,
        value: item.value,
    });

    /**
     * Transforms a collection of refinance item entities into structured response objects.
     * Iterates through items, applies individual transformation logic, and returns a normalized array.
     */
    transformReItems = (items: RefinanceItemEntity[]) =>
        items.map((item) => this.transformRefiItem(item));

    transformRefiBase = (item: BaseRefiEntity<any>) => ({
        id: item.id,
        afterRepairsValue: item.afterRepairValue,
        refiLTV: item.refiLTV,
        newLoanAmount: item.newLoanAmount,
        oldLoanAmount: item.oldLoanAmount,
        pInterest: item.pInterest,
        interestRate: item.interestRate,
        pmi: item.pmi,
        hoa: item.hoa,
        point: item.point,
    });

    /**
     * Transforms a refinancing entity into a structured response object.
     * Maps financial and loan-related fields, includes closing cost data,
     * and conditionally transforms associated itemized entries into a normalized array.
     */
    transformRefi = (item: RefinanceEntity) => ({
        ...this.transformRefiBase(item),
        closingCoast: item.closingCoast,
        itemized: item.itemized ? this.transformReItems(item.itemized) : [],
    });

    /**
     * Transforms a refinancing entity into a structured refinancing response object.
     * Maps base refinance fields, closing cost data, and associated repair items into a serialized result.
     */
    transformBrRefi = (item: BrRefinanceEntity) => ({
        ...this.transformRefiBase(item),
        closingCoast: item.closingCoast,
        iRepairs: item.iRepairs ? this.transformRItem(item.iRepairs) : null,
        oRepairs: item.oRepairs ? this.transformRItem(item.oRepairs) : null,
        eRepairs: item.eRepairs ? this.transformRItem(item.eRepairs) : null,
    });

    /**
     * Transforms a rehab duration entity into a structured response object.
     * Maps duration and financial fields, includes holding cost data,
     * and conditionally transforms associated itemized entries when present.
     */
    transformRDuration = (item: RDurationEntity) => ({
        id: item.id,
        rehabDuration: item.rehabDuration,
        duration: item.duration,
        rContingency: item.rContingency,
        rContingencyAmount: item.rContingencyAmount,
        holdingCoast: item.holdingCoast,
        totalRCoast: item.totalRCoast,
        itemized: item.itemized ? this.transformADItem(item.itemized) : null,
    });

    /**
     * Transforms a carrying cost entity into a structured carrying cost response object.
     * Maps contingency, duration, holding cost, total cost, and associated repair item data into a serialized result.
     */
    transformCCoast = (item: CCoastEntity) => ({
        id: item.id,
        rContingency: item.rContingency,
        rContingencyTotal: item.rContingency,
        duration: item.duration,
        holdingCoast: item.holdingCoast,
        totalCCoast: item.totalCCoast,
        iRepairs: item.iRepairs ? this.transformRItem(item.iRepairs) : null,
        oRepairs: item.oRepairs ? this.transformRItem(item.oRepairs) : null,
        eRepairs: item.eRepairs ? this.transformRItem(item.eRepairs) : null,
    });
}
