import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { FExpenseDto } from './f-expense.dto';

function makeValid(overrides: Partial<FExpenseDto> = {}): FExpenseDto {
    return plainToInstance(FExpenseDto, {
        sewer: 100,
        water: 80,
        trash: 50,
        gas: 120,
        electric: 150,
        internet: 60,
        other: 30,
        hoaFees: 200,
        propertyTaxes: 500,
        hazardInsurance: 300,
        additionalFees: 75,
        cashReserves: 10,
        managementFees: 8,
        maintenanceEscrow: 5,
        ...overrides,
    });
}

const REQUIRED_FIELDS: (keyof FExpenseDto)[] = [
    'sewer',
    'water',
    'trash',
    'gas',
    'electric',
    'internet',
    'other',
    'hoaFees',
    'propertyTaxes',
    'hazardInsurance',
    'additionalFees',
    'cashReserves',
    'managementFees',
    'maintenanceEscrow',
];

describe('FExpenseDto', () => {
    describe('valid object', () => {
        it('should pass validation with all required fields', async () => {
            const errors = await validate(makeValid());
            expect(errors).toHaveLength(0);
        });

        it('should pass with all fields set to 0', async () => {
            const errors = await validate(
                makeValid({
                    sewer: 0,
                    water: 0,
                    trash: 0,
                    gas: 0,
                    electric: 0,
                    internet: 0,
                    other: 0,
                    hoaFees: 0,
                    propertyTaxes: 0,
                    hazardInsurance: 0,
                    additionalFees: 0,
                    cashReserves: 0,
                    managementFees: 0,
                    maintenanceEscrow: 0,
                }),
            );
            expect(errors).toHaveLength(0);
        });

        it('should pass with decimal values for regular fields', async () => {
            const errors = await validate(makeValid({ sewer: 99.99, water: 80.5 }));
            expect(errors).toHaveLength(0);
        });

        it('should pass with boundary value cashReserves = 100', async () => {
            const errors = await validate(makeValid({ cashReserves: 100 }));
            expect(errors).toHaveLength(0);
        });

        it('should pass with boundary value managementFees = 100', async () => {
            const errors = await validate(makeValid({ managementFees: 100 }));
            expect(errors).toHaveLength(0);
        });

        it('should pass with boundary value maintenanceEscrow = 100', async () => {
            const errors = await validate(makeValid({ maintenanceEscrow: 100 }));
            expect(errors).toHaveLength(0);
        });
    });

    describe('required fields — missing', () => {
        REQUIRED_FIELDS.forEach((field) => {
            it(`should fail when ${field} is missing`, async () => {
                const errors = await validate(makeValid({ [field]: undefined } as any));
                expect(errors.some((e) => e.property === field)).toBe(true);
            });
        });
    });

    describe('required fields — invalid type (string)', () => {
        REQUIRED_FIELDS.forEach((field) => {
            it(`should fail when ${field} is a string`, async () => {
                const errors = await validate(makeValid({ [field]: 'abc' } as any));
                expect(errors.some((e) => e.property === field)).toBe(true);
            });
        });
    });

    describe('required fields — negative values', () => {
        REQUIRED_FIELDS.forEach((field) => {
            it(`should fail when ${field} is negative`, async () => {
                const errors = await validate(makeValid({ [field]: -1 } as any));
                expect(errors.some((e) => e.property === field)).toBe(true);
            });
        });
    });

    describe('percentage fields — max 100', () => {
        const percentageFields: (keyof FExpenseDto)[] = [
            'cashReserves',
            'managementFees',
            'maintenanceEscrow',
        ];

        percentageFields.forEach((field) => {
            it(`should fail when ${field} exceeds 100`, async () => {
                const errors = await validate(makeValid({ [field]: 101 } as any));
                expect(errors.some((e) => e.property === field)).toBe(true);
            });
        });
    });
});
