import { Test, TestingModule } from '@nestjs/testing';
import { TransformABuilderService } from './transform-aBuilder.service';
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

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('TransformABuilderService', () => {
    let service: TransformABuilderService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [TransformABuilderService],
        }).compile();

        service = module.get<TransformABuilderService>(TransformABuilderService);
    });

    const makeUnit = (overrides: Partial<UnitEntity> = {}): UnitEntity =>
        Object.assign(new UnitEntity(), {
            id: 'unit-001',
            sqFootage: 900,
            bedRooms: 2,
            bathRooms: 1,
            monthlyRent: 1200,
            ...overrides,
        });

    const makePDetails = (overrides: Partial<PDetailsEntity> = {}): PDetailsEntity =>
        Object.assign(new PDetailsEntity(), {
            id: 'pd-001',
            status: 'SINGLE_FAMILY',
            monthlyIncome: 500,
            totalIncome: 3000,
            units: [],
            ...overrides,
        });

    const makeAdItem = (overrides: Partial<AdItemizedEntity> = {}): AdItemizedEntity =>
        Object.assign(new AdItemizedEntity(), {
            id: 'adi-001',
            originationFee: 1000,
            hazardInsurance: 200,
            floodInsurance: 150,
            propertyTaxes: 300,
            annualAssessment: 100,
            ...overrides,
        });

    const makeADetails = (overrides: Partial<ADetailsEntity> = {}): ADetailsEntity =>
        Object.assign(new ADetailsEntity(), {
            id: 'ad-001',
            method: 'CASH',
            purchasePrice: 200000,
            sellerConcessions: 500,
            credits: 1000,
            acquisitionCoast: 201500,
            downPayment: 40000,
            loanInterest: 3.5,
            loanLength: 360,
            loanType: 'FIXED',
            itemized: null,
            ...overrides,
        });

    const makeRepairItem = (overrides: Record<string, any> = {}) => ({
        id: 'ri-001',
        roof: 5000,
        landscaping: 1000,
        concierge: 200,
        garage: 3000,
        bathrooms: 1500,
        ...overrides,
    });

    const makeRepairs = (overrides: Partial<RepairsEntity> = {}): RepairsEntity =>
        Object.assign(new RepairsEntity(), {
            id: 'rep-001',
            total: 10000,
            iRepairs: null,
            oRepairs: null,
            eRepairs: null,
            ...overrides,
        });

    const makeFExpenses = (overrides: Partial<FExpensesEntity> = {}): FExpensesEntity =>
        Object.assign(new FExpensesEntity(), {
            id: 'fe-001',
            sewer: 50,
            water: 60,
            trash: 30,
            gas: 80,
            electric: 120,
            internet: 40,
            other: 20,
            hoaFees: 200,
            propertyTaxes: 300,
            hazardInsurance: 150,
            additionalFees: 10,
            cashReserves: 500,
            managementFees: 250,
            maintenanceEscrow: 100,
            ...overrides,
        });

    describe('transformUnit', () => {
        it('should transform a UnitEntity into the expected shape', () => {
            const unit = makeUnit();

            const result = service.transformUnit(unit);

            expect(result).toEqual({
                id: 'unit-001',
                sqFootage: 900,
                bedRooms: 2,
                bathRooms: 1,
                monthlyRent: 1200,
            });
        });
    });

    describe('transformUnits', () => {
        it('should return an empty array when given an empty array', () => {
            expect(service.transformUnits([])).toEqual([]);
        });

        it('should transform multiple UnitEntity objects', () => {
            const units = [
                makeUnit({ id: 'u-1', monthlyRent: 1000 }),
                makeUnit({ id: 'u-2', monthlyRent: 1500 }),
            ];

            const result = service.transformUnits(units);

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('u-1');
            expect(result[1].id).toBe('u-2');
        });
    });

    describe('transformPDetails', () => {
        it('should return an empty units array when units is empty', () => {
            const pDetails = makePDetails({ units: [] });

            const result = service.transformPDetails(pDetails);

            expect(result.units).toEqual([]);
        });

        it('should return transformed units when units are present', () => {
            const units = [makeUnit({ id: 'u-1' }), makeUnit({ id: 'u-2' })];
            const pDetails = makePDetails({ units });

            const result = service.transformPDetails(pDetails);

            expect(result.units).toHaveLength(2);
            expect(result.units[0].id).toBe('u-1');
        });

        it('should return empty units array when units is undefined/null', () => {
            const pDetails = makePDetails({ units: undefined });

            const result = service.transformPDetails(pDetails);

            expect(result.units).toEqual([]);
        });

        it('should map all scalar fields correctly', () => {
            const pDetails = makePDetails();

            const result = service.transformPDetails(pDetails);

            expect(result).toMatchObject({
                id: 'pd-001',
                status: 'SINGLE_FAMILY',
                monthlyIncome: 500,
                totalIncome: 3000,
            });
        });
    });

    describe('transformADItem', () => {
        it('should transform an AdItemizedEntity into the expected shape', () => {
            const item = makeAdItem();

            const result = service.transformADItem(item);

            expect(result).toEqual({
                id: 'adi-001',
                originationFee: 1000,
                hazardInsurance: 200,
                floodInsurance: 150,
                propertyTaxes: 300,
                annualAssessment: 100,
            });
        });
    });

    describe('transformADetails', () => {
        it('should return null for itemized when itemized is null', () => {
            const aDetails = makeADetails({ itemized: null! }) as any;

            const result = service.transformADetails(aDetails);

            expect(result.itemized).toBeNull();
        });

        it('should return transformed itemized when itemized is present', () => {
            const itemized = makeAdItem();
            const aDetails = makeADetails({ itemized });

            const result = service.transformADetails(aDetails);

            expect(result.itemized).not.toBeNull();
            expect(result.itemized?.id).toBe('adi-001');
        });

        it('should map all scalar fields correctly', () => {
            const aDetails = makeADetails();

            const result = service.transformADetails(aDetails);

            expect(result).toMatchObject({
                id: 'ad-001',
                method: 'CASH',
                purchasePrice: 200000,
                sellerConcessions: 500,
                credits: 1000,
                acquisitionCoast: 201500,
                downPayment: 40000,
                loanInterest: 3.5,
                loanLength: 360,
                loanType: 'FIXED',
            });
        });
    });

    describe('transformRItem', () => {
        it('should transform a repair item into the expected shape', () => {
            const item = makeRepairItem();

            const result = service.transformRItem(item);

            expect(result).toEqual({
                id: 'ri-001',
                roof: 5000,
                landscaping: 1000,
                concierge: 200,
                garage: 3000,
                bathrooms: 1500,
            });
        });
    });

    describe('transformRepairs', () => {
        it('should return null for all repair items when all are null', () => {
            const repairs = makeRepairs();

            const result = service.transformRepairs(repairs);

            expect(result).toEqual({
                id: 'rep-001',
                total: 10000,
                iRepairs: null,
                oRepairs: null,
                eRepairs: null,
            });
        });

        it('should transform iRepairs when present', () => {
            const repairs = makeRepairs({ iRepairs: makeRepairItem({ id: 'ir-1' }) as any });

            const result = service.transformRepairs(repairs);

            expect(result.iRepairs).not.toBeNull();
            expect(result.iRepairs?.id).toBe('ir-1');
        });

        it('should transform oRepairs when present', () => {
            const repairs = makeRepairs({ oRepairs: makeRepairItem({ id: 'or-1' }) as any });

            const result = service.transformRepairs(repairs);

            expect(result.oRepairs?.id).toBe('or-1');
        });

        it('should transform eRepairs when present', () => {
            const repairs = makeRepairs({ eRepairs: makeRepairItem({ id: 'er-1' }) as any });

            const result = service.transformRepairs(repairs);

            expect(result.eRepairs?.id).toBe('er-1');
        });

        it('should transform all three repair items when all are present', () => {
            const repairs = makeRepairs({
                iRepairs: makeRepairItem({ id: 'ir-1' }) as any,
                oRepairs: makeRepairItem({ id: 'or-1' }) as any,
                eRepairs: makeRepairItem({ id: 'er-1' }) as any,
            });

            const result = service.transformRepairs(repairs);

            expect(result.iRepairs?.id).toBe('ir-1');
            expect(result.oRepairs?.id).toBe('or-1');
            expect(result.eRepairs?.id).toBe('er-1');
        });
    });

    describe('transformFExpenses', () => {
        it('should transform an FExpensesEntity into the expected shape with all fields', () => {
            const fExpenses = makeFExpenses();

            const result = service.transformFExpenses(fExpenses);

            expect(result).toEqual({
                id: 'fe-001',
                sewer: 50,
                water: 60,
                trash: 30,
                gas: 80,
                electric: 120,
                internet: 40,
                other: 20,
                hoaFees: 200,
                propertyTaxes: 300,
                hazardInsurance: 150,
                additionalFees: 10,
                cashReserves: 500,
                managementFees: 250,
                maintenanceEscrow: 100,
            });
        });
    });

    describe('transformSale', () => {
        const makeSale = (overrides: Partial<SaleEntity> = {}): SaleEntity =>
            Object.assign(new SaleEntity(), {
                id: 'sale-001',
                afterRepairValue: 200000,
                saleClosingCoast: 5000,
                targetProfit: 30000,
                itemized: null,
                ...overrides,
            });

        it('should return null for itemized when itemized is null', () => {
            const sale = makeSale({ itemized: null! });

            const result = service.transformSale(sale);

            expect(result).toEqual({
                id: 'sale-001',
                afterRepairValue: 200000,
                saleClosingCoast: 5000,
                targetProfit: 30000,
                itemized: null,
            });
        });

        it('should return transformed itemized when itemized is present', () => {
            const itemized = makeAdItem({ id: 'adi-sale-001' });
            const sale = makeSale({ itemized });

            const result = service.transformSale(sale);

            expect(result.itemized).not.toBeNull();
            expect(result.itemized?.id).toBe('adi-sale-001');
        });

        it('should map all scalar fields correctly', () => {
            const sale = makeSale({
                afterRepairValue: 300000,
                saleClosingCoast: 8000,
                targetProfit: 50000,
            });

            const result = service.transformSale(sale);

            expect(result).toMatchObject({
                id: 'sale-001',
                afterRepairValue: 300000,
                saleClosingCoast: 8000,
                targetProfit: 50000,
            });
        });
    });

    describe('transformHCItemized', () => {
        const makeHCItemized = (
            overrides: Partial<HCoastItemizedEntity> = {},
        ): HCoastItemizedEntity =>
            Object.assign(new HCoastItemizedEntity(), {
                id: 'hci-001',
                electricity: 100,
                gas: 60,
                water: 80,
                trash: 20,
                propertyTaxes: 500,
                other: 30,
                ...overrides,
            });

        it('should transform a HCoastItemizedEntity into the expected shape', () => {
            const result = service.transformHCItemized(makeHCItemized());

            expect(result).toEqual({
                id: 'hci-001',
                electricity: 100,
                gas: 60,
                water: 80,
                trash: 20,
                propertyTaxes: 500,
                other: 30,
            });
        });

        it('should map all fields independently', () => {
            const result = service.transformHCItemized(
                makeHCItemized({
                    electricity: 0,
                    gas: 0,
                    water: 0,
                    trash: 0,
                    propertyTaxes: 0,
                    other: 0,
                }),
            );

            expect(result.electricity).toBe(0);
            expect(result.gas).toBe(0);
            expect(result.water).toBe(0);
            expect(result.trash).toBe(0);
            expect(result.propertyTaxes).toBe(0);
            expect(result.other).toBe(0);
        });
    });

    describe('transformHCoast', () => {
        const makeHCItemized = (
            overrides: Partial<HCoastItemizedEntity> = {},
        ): HCoastItemizedEntity =>
            Object.assign(new HCoastItemizedEntity(), {
                id: 'hci-001',
                electricity: 100,
                gas: 60,
                water: 80,
                trash: 20,
                propertyTaxes: 500,
                other: 30,
                ...overrides,
            });

        const makeHCoast = (overrides: Partial<HCoastEntity> = {}): HCoastEntity =>
            Object.assign(new HCoastEntity(), {
                id: 'hc-001',
                holdingCoast: 790,
                pIValue: 1500,
                duration: 12,
                durationInMonth: 3,
                itemized: null,
                ...overrides,
            });

        it('should return null for itemized when itemized is null', () => {
            const result = service.transformHCoast(makeHCoast({ itemized: null! }));

            expect(result).toEqual({
                id: 'hc-001',
                holdingCoast: 790,
                pIValue: 1500,
                duration: 12,
                durationInMonth: 3,
                itemized: null,
            });
        });

        it('should return transformed itemized when itemized is present', () => {
            const itemized = makeHCItemized({ id: 'hci-002' });
            const result = service.transformHCoast(makeHCoast({ itemized }));

            expect(result.itemized).not.toBeNull();
            expect(result.itemized?.id).toBe('hci-002');
        });

        it('should map all scalar fields correctly', () => {
            const result = service.transformHCoast(
                makeHCoast({ holdingCoast: 999, pIValue: 2000, duration: 6, durationInMonth: 2 }),
            );

            expect(result.holdingCoast).toBe(999);
            expect(result.pIValue).toBe(2000);
            expect(result.duration).toBe(6);
            expect(result.durationInMonth).toBe(2);
        });
    });

    describe('transformHDuration', () => {
        const makeHDuration = (overrides: Partial<HDurationEntity> = {}): HDurationEntity =>
            Object.assign(new HDurationEntity(), {
                id: 'hd-001',
                duration: 6,
                transactionFee: 1500,
                otherFee: 300,
                targetProfit: 20000,
                holdingCoast: 4800,
                itemized: null,
                ...overrides,
            });

        it('should transform an HDurationEntity into the expected shape with null itemized', () => {
            const result = service.transformHDuration(makeHDuration());

            expect(result).toEqual({
                id: 'hd-001',
                duration: 6,
                transactionFee: 1500,
                otherFee: 300,
                targetProfit: 20000,
                holdingCost: 4800,
                item: null,
            });
        });

        it('should transform itemized when present', () => {
            const itemized = {
                id: 'ri-hd-001',
                roof: 100,
                landscaping: 200,
                concierge: 300,
                garage: 400,
                bathrooms: 500,
            };
            const result = service.transformHDuration(makeHDuration({ itemized: itemized as any }));

            expect(result.item).not.toBeNull();
            expect(result.item?.id).toBe('ri-hd-001');
        });

        it('should map all scalar fields correctly', () => {
            const result = service.transformHDuration(
                makeHDuration({
                    duration: 12,
                    transactionFee: 2000,
                    otherFee: 500,
                    targetProfit: 35000,
                    holdingCoast: 9600,
                }),
            );

            expect(result.duration).toBe(12);
            expect(result.transactionFee).toBe(2000);
            expect(result.otherFee).toBe(500);
            expect(result.targetProfit).toBe(35000);
            expect(result.holdingCost).toBe(9600);
        });
    });

    describe('transformRefiItem', () => {
        const makeRefiItem = (overrides: Partial<RefinanceItemEntity> = {}): RefinanceItemEntity =>
            Object.assign(new RefinanceItemEntity(), {
                id: 'ri-001',
                label: 'Appraisal Fee',
                value: 500,
                ...overrides,
            });

        it('should transform a RefinanceItemEntity into the expected shape', () => {
            const result = service.transformRefiItem(makeRefiItem());

            expect(result).toEqual({
                id: 'ri-001',
                label: 'Appraisal Fee',
                value: 500,
            });
        });

        it('should map all fields correctly with different values', () => {
            const result = service.transformRefiItem(
                makeRefiItem({ id: 'ri-002', label: 'Title Insurance', value: 1200 }),
            );

            expect(result.id).toBe('ri-002');
            expect(result.label).toBe('Title Insurance');
            expect(result.value).toBe(1200);
        });
    });

    describe('transformReItems', () => {
        const makeRefiItem = (overrides: Partial<RefinanceItemEntity> = {}): RefinanceItemEntity =>
            Object.assign(new RefinanceItemEntity(), {
                id: 'ri-001',
                label: 'Fee',
                value: 100,
                ...overrides,
            });

        it('should return an empty array when given an empty array', () => {
            expect(service.transformReItems([])).toEqual([]);
        });

        it('should transform multiple RefinanceItemEntity objects', () => {
            const items = [
                makeRefiItem({ id: 'ri-1', label: 'Fee A', value: 200 }),
                makeRefiItem({ id: 'ri-2', label: 'Fee B', value: 400 }),
            ];

            const result = service.transformReItems(items);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ id: 'ri-1', label: 'Fee A', value: 200 });
            expect(result[1]).toEqual({ id: 'ri-2', label: 'Fee B', value: 400 });
        });
    });

    describe('transformRefi', () => {
        const makeRefiItem = (overrides: Partial<RefinanceItemEntity> = {}): RefinanceItemEntity =>
            Object.assign(new RefinanceItemEntity(), {
                id: 'ri-001',
                label: 'Fee',
                value: 100,
                ...overrides,
            });

        const makeRefi = (overrides: Partial<RefinanceEntity> = {}): RefinanceEntity =>
            Object.assign(new RefinanceEntity(), {
                id: 'refi-001',
                afterRepairValue: 300000,
                refiLTV: 75,
                newLoanAmount: 225000,
                oldLoanAmount: 180000,
                pInterest: 1200,
                interestRate: 4.5,
                pmi: 100,
                hoa: 200,
                point: 1,
                closingCoast: 3000,
                itemized: null,
                ...overrides,
            });

        it('should return empty array for itemized when itemized is null', () => {
            const result = service.transformRefi(makeRefi());

            expect(result.itemized).toEqual([]);
        });

        it('should transform itemized items when present', () => {
            const items = [
                makeRefiItem({ id: 'ri-1', label: 'Appraisal', value: 500 }),
                makeRefiItem({ id: 'ri-2', label: 'Title', value: 800 }),
            ];
            const result = service.transformRefi(makeRefi({ itemized: items }));

            expect(result.itemized).toHaveLength(2);
            expect(result.itemized[0].id).toBe('ri-1');
            expect(result.itemized[1].id).toBe('ri-2');
        });

        it('should map all scalar fields correctly', () => {
            const result = service.transformRefi(makeRefi());

            expect(result).toMatchObject({
                id: 'refi-001',
                afterRepairsValue: 300000,
                refiLTV: 75,
                newLoanAmount: 225000,
                oldLoanAmount: 180000,
                pInterest: 1200,
                interestRate: 4.5,
                pmi: 100,
                hoa: 200,
                point: 1,
                closingCoast: 3000,
            });
        });
    });

    describe('transformRDuration', () => {
        const makeAdItemized = (overrides: Partial<AdItemizedEntity> = {}): AdItemizedEntity =>
            Object.assign(new AdItemizedEntity(), {
                id: 'adi-rd-001',
                originationFee: 500,
                hazardInsurance: 100,
                floodInsurance: 50,
                propertyTaxes: 200,
                annualAssessment: 75,
                ...overrides,
            });

        const makeRDuration = (overrides: Partial<RDurationEntity> = {}): RDurationEntity =>
            Object.assign(new RDurationEntity(), {
                id: 'rd-001',
                rehabDuration: 3,
                duration: 6,
                rContingency: 10,
                holdingCoast: 2400,
                itemized: null,
                ...overrides,
            });

        it('should transform an RDurationEntity into the expected shape with null itemized', () => {
            const result = service.transformRDuration(makeRDuration());

            expect(result).toEqual({
                id: 'rd-001',
                rehabDuration: 3,
                duration: 6,
                rContingency: 10,
                holdingCoast: 2400,
                itemized: null,
            });
        });

        it('should transform itemized when present', () => {
            const itemized = makeAdItemized({ id: 'adi-rd-002' });
            const result = service.transformRDuration(makeRDuration({ itemized }));

            expect(result.itemized).not.toBeNull();
            expect(result.itemized?.id).toBe('adi-rd-002');
        });

        it('should map all scalar fields correctly', () => {
            const result = service.transformRDuration(
                makeRDuration({
                    rehabDuration: 5,
                    duration: 9,
                    rContingency: 15,
                    holdingCoast: 3600,
                }),
            );

            expect(result.rehabDuration).toBe(5);
            expect(result.duration).toBe(9);
            expect(result.rContingency).toBe(15);
            expect(result.holdingCoast).toBe(3600);
        });
    });

    describe('transformRefiBase', () => {
        const makeBaseRefi = (
            overrides: Partial<BaseRefiEntity<any>> = {},
        ): BaseRefiEntity<any> => {
            return {
                id: 'base-refi-001',
                afterRepairValue: 300000,
                refiLTV: 75,
                newLoanAmount: 225000,
                oldLoanAmount: 180000,
                pInterest: 1200,
                interestRate: 4.5,
                pmi: 100,
                hoa: 200,
                point: 1,
                ...overrides,
            } as BaseRefiEntity<any>;
        };

        it('should transform a BaseRefiEntity into the expected shape', () => {
            const result = service.transformRefiBase(makeBaseRefi());

            expect(result).toEqual({
                id: 'base-refi-001',
                afterRepairsValue: 300000,
                refiLTV: 75,
                newLoanAmount: 225000,
                oldLoanAmount: 180000,
                pInterest: 1200,
                interestRate: 4.5,
                pmi: 100,
                hoa: 200,
                point: 1,
            });
        });

        it('should map all fields correctly with different values', () => {
            const result = service.transformRefiBase(
                makeBaseRefi({
                    id: 'base-refi-002',
                    afterRepairValue: 400000,
                    refiLTV: 80,
                    newLoanAmount: 320000,
                    oldLoanAmount: 250000,
                    pInterest: 1500,
                    interestRate: 5.0,
                    pmi: 150,
                    hoa: 250,
                    point: 2,
                }),
            );

            expect(result.id).toBe('base-refi-002');
            expect(result.afterRepairsValue).toBe(400000);
            expect(result.refiLTV).toBe(80);
            expect(result.newLoanAmount).toBe(320000);
            expect(result.oldLoanAmount).toBe(250000);
            expect(result.pInterest).toBe(1500);
            expect(result.interestRate).toBe(5.0);
            expect(result.pmi).toBe(150);
            expect(result.hoa).toBe(250);
            expect(result.point).toBe(2);
        });
    });

    describe('transformBrRefi', () => {
        const makeRepairItem = (overrides: Record<string, any> = {}) => ({
            id: 'ri-br-001',
            roof: 5000,
            landscaping: 1000,
            concierge: 200,
            garage: 3000,
            bathrooms: 1500,
            ...overrides,
        });

        const makeBrRefi = (overrides: Partial<BrRefinanceEntity> = {}): BrRefinanceEntity =>
            Object.assign(new BrRefinanceEntity(), {
                id: 'br-refi-001',
                afterRepairValue: 300000,
                refiLTV: 75,
                newLoanAmount: 225000,
                oldLoanAmount: 180000,
                pInterest: 1200,
                interestRate: 4.5,
                pmi: 100,
                hoa: 200,
                point: 1,
                closingCoast: 3000,
                iRepairs: null,
                oRepairs: null,
                eRepairs: null,
                ...overrides,
            });

        it('should return null for all repair items when all are null', () => {
            const result = service.transformBrRefi(makeBrRefi());

            expect(result).toMatchObject({
                id: 'br-refi-001',
                afterRepairsValue: 300000,
                refiLTV: 75,
                newLoanAmount: 225000,
                oldLoanAmount: 180000,
                pInterest: 1200,
                interestRate: 4.5,
                pmi: 100,
                hoa: 200,
                point: 1,
                closingCoast: 3000,
                iRepairs: null,
                oRepairs: null,
                eRepairs: null,
            });
        });

        it('should transform iRepairs when present', () => {
            const brRefi = makeBrRefi({ iRepairs: makeRepairItem({ id: 'ir-br-1' }) as any });

            const result = service.transformBrRefi(brRefi);

            expect(result.iRepairs).not.toBeNull();
            expect(result.iRepairs?.id).toBe('ir-br-1');
        });

        it('should transform oRepairs when present', () => {
            const brRefi = makeBrRefi({ oRepairs: makeRepairItem({ id: 'or-br-1' }) as any });

            const result = service.transformBrRefi(brRefi);

            expect(result.oRepairs?.id).toBe('or-br-1');
        });

        it('should transform eRepairs when present', () => {
            const brRefi = makeBrRefi({ eRepairs: makeRepairItem({ id: 'er-br-1' }) as any });

            const result = service.transformBrRefi(brRefi);

            expect(result.eRepairs?.id).toBe('er-br-1');
        });

        it('should transform all three repair items when all are present', () => {
            const brRefi = makeBrRefi({
                iRepairs: makeRepairItem({ id: 'ir-br-1' }) as any,
                oRepairs: makeRepairItem({ id: 'or-br-1' }) as any,
                eRepairs: makeRepairItem({ id: 'er-br-1' }) as any,
            });

            const result = service.transformBrRefi(brRefi);

            expect(result.iRepairs?.id).toBe('ir-br-1');
            expect(result.oRepairs?.id).toBe('or-br-1');
            expect(result.eRepairs?.id).toBe('er-br-1');
        });

        it('should map all scalar fields correctly', () => {
            const result = service.transformBrRefi(
                makeBrRefi({
                    id: 'br-refi-002',
                    afterRepairValue: 400000,
                    refiLTV: 80,
                    newLoanAmount: 320000,
                    oldLoanAmount: 250000,
                    pInterest: 1500,
                    interestRate: 5.0,
                    pmi: 150,
                    hoa: 250,
                    point: 2,
                    closingCoast: 5000,
                }),
            );

            expect(result.id).toBe('br-refi-002');
            expect(result.afterRepairsValue).toBe(400000);
            expect(result.refiLTV).toBe(80);
            expect(result.newLoanAmount).toBe(320000);
            expect(result.oldLoanAmount).toBe(250000);
            expect(result.pInterest).toBe(1500);
            expect(result.interestRate).toBe(5.0);
            expect(result.pmi).toBe(150);
            expect(result.hoa).toBe(250);
            expect(result.point).toBe(2);
            expect(result.closingCoast).toBe(5000);
        });
    });

    describe('transformCCoast', () => {
        const makeRepairItem = (overrides: Record<string, any> = {}) => ({
            id: 'ri-cc-001',
            roof: 5000,
            landscaping: 1000,
            concierge: 200,
            garage: 3000,
            bathrooms: 1500,
            ...overrides,
        });

        const makeCCoast = (overrides: Partial<CCoastEntity> = {}): CCoastEntity =>
            Object.assign(new CCoastEntity(), {
                id: 'cc-001',
                rContingency: 10,
                duration: 6,
                holdingCoast: 2400,
                totalCCoast: 2640,
                iRepairs: null,
                oRepairs: null,
                eRepairs: null,
                ...overrides,
            });

        it('should return null for all repair items when all are null', () => {
            const result = service.transformCCoast(makeCCoast());

            expect(result).toEqual({
                id: 'cc-001',
                rContingency: 10,
                rContingencyTotal: 10,
                duration: 6,
                holdingCoast: 2400,
                totalCCoast: 2640,
                iRepairs: null,
                oRepairs: null,
                eRepairs: null,
            });
        });

        it('should transform iRepairs when present', () => {
            const cCoast = makeCCoast({ iRepairs: makeRepairItem({ id: 'ir-cc-1' }) as any });

            const result = service.transformCCoast(cCoast);

            expect(result.iRepairs).not.toBeNull();
            expect(result.iRepairs?.id).toBe('ir-cc-1');
        });

        it('should transform oRepairs when present', () => {
            const cCoast = makeCCoast({ oRepairs: makeRepairItem({ id: 'or-cc-1' }) as any });

            const result = service.transformCCoast(cCoast);

            expect(result.oRepairs?.id).toBe('or-cc-1');
        });

        it('should transform eRepairs when present', () => {
            const cCoast = makeCCoast({ eRepairs: makeRepairItem({ id: 'er-cc-1' }) as any });

            const result = service.transformCCoast(cCoast);

            expect(result.eRepairs?.id).toBe('er-cc-1');
        });

        it('should transform all three repair items when all are present', () => {
            const cCoast = makeCCoast({
                iRepairs: makeRepairItem({ id: 'ir-cc-1' }) as any,
                oRepairs: makeRepairItem({ id: 'or-cc-1' }) as any,
                eRepairs: makeRepairItem({ id: 'er-cc-1' }) as any,
            });

            const result = service.transformCCoast(cCoast);

            expect(result.iRepairs?.id).toBe('ir-cc-1');
            expect(result.oRepairs?.id).toBe('or-cc-1');
            expect(result.eRepairs?.id).toBe('er-cc-1');
        });

        it('should map all scalar fields correctly', () => {
            const result = service.transformCCoast(
                makeCCoast({
                    id: 'cc-002',
                    rContingency: 15,
                    duration: 12,
                    holdingCoast: 4800,
                    totalCCoast: 5520,
                }),
            );

            expect(result.id).toBe('cc-002');
            expect(result.rContingency).toBe(15);
            expect(result.rContingencyTotal).toBe(15);
            expect(result.duration).toBe(12);
            expect(result.holdingCoast).toBe(4800);
            expect(result.totalCCoast).toBe(5520);
        });

        it('should map rContingencyTotal to the same value as rContingency', () => {
            const result = service.transformCCoast(makeCCoast({ rContingency: 20 }));

            expect(result.rContingency).toBe(20);
            expect(result.rContingencyTotal).toBe(20);
        });
    });
});
