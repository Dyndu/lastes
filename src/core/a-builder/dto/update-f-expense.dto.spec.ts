import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateFExpenseDto } from './update-f-expense.dto';

const ALL_FIELDS: (keyof UpdateFExpenseDto)[] = [
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

function makeValid(overrides: Partial<UpdateFExpenseDto> = {}): UpdateFExpenseDto {
    return plainToInstance(UpdateFExpenseDto, {
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

describe('UpdateFExpenseDto', () => {
    describe('PartialType — all fields are optional', () => {
        it('should pass with an empty object (all fields optional)', async () => {
            const dto = plainToInstance(UpdateFExpenseDto, {});
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        ALL_FIELDS.forEach((field) => {
            it(`should pass when only ${field} is provided`, async () => {
                const dto = plainToInstance(UpdateFExpenseDto, { [field]: 50 });
                const errors = await validate(dto);
                expect(errors).toHaveLength(0);
            });

            it(`should pass when ${field} is omitted`, async () => {
                const partial: Partial<UpdateFExpenseDto> = { ...makeValid() };
                delete partial[field];
                const dto = plainToInstance(UpdateFExpenseDto, partial);
                const errors = await validate(dto);
                expect(errors).toHaveLength(0);
            });
        });
    });

    describe('valid full object', () => {
        it('should pass with all fields provided', async () => {
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

        it('should pass with boundary values cashReserves = 100', async () => {
            const errors = await validate(makeValid({ cashReserves: 100 }));
            expect(errors).toHaveLength(0);
        });

        it('should pass with boundary values managementFees = 100', async () => {
            const errors = await validate(makeValid({ managementFees: 100 }));
            expect(errors).toHaveLength(0);
        });

        it('should pass with boundary values maintenanceEscrow = 100', async () => {
            const errors = await validate(makeValid({ maintenanceEscrow: 100 }));
            expect(errors).toHaveLength(0);
        });
    });

    describe('inherited validations — invalid type', () => {
        ALL_FIELDS.forEach((field) => {
            it(`should fail when ${field} is provided as a string`, async () => {
                const dto = plainToInstance(UpdateFExpenseDto, { [field]: 'abc' });
                const errors = await validate(dto);
                expect(errors.some((e) => e.property === field)).toBe(true);
            });
        });
    });

    describe('inherited validations — negative values', () => {
        ALL_FIELDS.forEach((field) => {
            it(`should fail when ${field} is provided as a negative number`, async () => {
                const dto = plainToInstance(UpdateFExpenseDto, { [field]: -1 });
                const errors = await validate(dto);
                expect(errors.some((e) => e.property === field)).toBe(true);
            });
        });
    });

    describe('inherited validations — percentage max', () => {
        const percentageFields: (keyof UpdateFExpenseDto)[] = [
            'cashReserves',
            'managementFees',
            'maintenanceEscrow',
        ];

        percentageFields.forEach((field) => {
            it(`should fail when ${field} exceeds 100`, async () => {
                const dto = plainToInstance(UpdateFExpenseDto, { [field]: 101 });
                const errors = await validate(dto);
                expect(errors.some((e) => e.property === field)).toBe(true);
            });
        });
    });
});
