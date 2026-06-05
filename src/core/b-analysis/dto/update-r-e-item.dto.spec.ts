import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CalculationMethodEnum } from '../../../common/enum';
import { UpdateREItemDto } from './update-r-e-item.dto';

const makeDto = (overrides: Partial<UpdateREItemDto> = {}): UpdateREItemDto =>
    plainToInstance(UpdateREItemDto, {
        label: 'Roof Maintenance',
        cMethod: CalculationMethodEnum.LABOR_MATERIAL,
        laborValue: 100,
        materialValue: 50,
        ...overrides,
    });

const getErrors = async (dto: UpdateREItemDto) => {
    const errors = await validate(dto);
    return errors.reduce(
        (acc, e) => {
            acc[e.property] = Object.values(e.constraints ?? {});
            return acc;
        },
        {} as Record<string, string[]>,
    );
};

describe('UpdateREItemDto', () => {
    describe('valid payload', () => {
        it('should pass with all valid fields and no id', async () => {
            const errors = await validate(makeDto());
            expect(errors).toHaveLength(0);
        });

        it('should pass with a valid UUID id', async () => {
            const errors = await validate(makeDto({ id: '2908dec0-a048-4a29-9810-e730e48a057b' }));
            expect(errors).toHaveLength(0);
        });

        it('should pass with id omitted entirely', async () => {
            const errors = await validate(makeDto({ id: undefined }));
            expect(errors).toHaveLength(0);
        });
    });

    describe('id', () => {
        it('should fail when id is not a valid UUID', async () => {
            const errors = await getErrors(makeDto({ id: 'not-a-uuid' }));
            expect(errors.id).toBeDefined();
        });

        it('should fail when id is a plain string shorter than 2 chars', async () => {
            const errors = await getErrors(makeDto({ id: 'A' }));
            expect(errors.id).toBeDefined();
        });

        it('should fail when id is a number', async () => {
            const errors = await getErrors(makeDto({ id: 123 as any }));
            expect(errors.id).toBeDefined();
        });

        it('should fail when id is a UUID v1 (not v4)', async () => {
            const errors = await getErrors(makeDto({ id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' }));
            expect(errors.id).toBeDefined();
        });
    });

    describe('label', () => {
        it('should fail when label is missing', async () => {
            const errors = await getErrors(makeDto({ label: undefined }));
            expect(errors.label).toBeDefined();
        });

        it('should fail when label is empty string', async () => {
            const errors = await getErrors(makeDto({ label: '' }));
            expect(errors.label).toBeDefined();
        });

        it('should fail when label is shorter than 2 characters', async () => {
            const errors = await getErrors(makeDto({ label: 'A' }));
            expect(errors.label).toBeDefined();
        });

        it('should fail when label is not a string', async () => {
            const errors = await getErrors(makeDto({ label: 123 as any }));
            expect(errors.label).toBeDefined();
        });

        it('should pass when label is exactly 2 characters', async () => {
            const errors = await validate(makeDto({ label: 'AB' }));
            expect(errors).toHaveLength(0);
        });
    });

    describe('cMethod', () => {
        it('should fail when cMethod is missing', async () => {
            const errors = await getErrors(makeDto({ cMethod: undefined }));
            expect(errors.cMethod).toBeDefined();
        });

        it('should fail when cMethod is an invalid enum value', async () => {
            const errors = await getErrors(makeDto({ cMethod: 'invalid' as any }));
            expect(errors.cMethod).toBeDefined();
        });

        it('should pass with each valid CalculationMethodEnum value', async () => {
            for (const value of Object.values(CalculationMethodEnum)) {
                const errors = await validate(makeDto({ cMethod: value }));
                expect(errors).toHaveLength(0);
            }
        });
    });

    describe('laborValue', () => {
        it('should fail when laborValue is missing', async () => {
            const errors = await getErrors(makeDto({ laborValue: undefined }));
            expect(errors.laborValue).toBeDefined();
        });

        it('should fail when laborValue is negative', async () => {
            const errors = await getErrors(makeDto({ laborValue: -1 }));
            expect(errors.laborValue).toBeDefined();
        });

        it('should fail when laborValue is NaN', async () => {
            const errors = await getErrors(makeDto({ laborValue: NaN }));
            expect(errors.laborValue).toBeDefined();
        });

        it('should fail when laborValue has more than 2 decimal places', async () => {
            const errors = await getErrors(makeDto({ laborValue: 99.999 }));
            expect(errors.laborValue).toBeDefined();
        });

        it('should pass when laborValue is 0', async () => {
            const errors = await validate(makeDto({ laborValue: 0 }));
            expect(errors).toHaveLength(0);
        });

        it('should pass when laborValue is a valid decimal', async () => {
            const errors = await validate(makeDto({ laborValue: 99.99 }));
            expect(errors).toHaveLength(0);
        });
    });

    describe('materialValue', () => {
        it('should fail when materialValue is missing', async () => {
            const errors = await getErrors(makeDto({ materialValue: undefined }));
            expect(errors.materialValue).toBeDefined();
        });

        it('should fail when materialValue is negative', async () => {
            const errors = await getErrors(makeDto({ materialValue: -1 }));
            expect(errors.materialValue).toBeDefined();
        });

        it('should fail when materialValue is NaN', async () => {
            const errors = await getErrors(makeDto({ materialValue: NaN }));
            expect(errors.materialValue).toBeDefined();
        });

        it('should fail when materialValue has more than 2 decimal places', async () => {
            const errors = await getErrors(makeDto({ materialValue: 49.999 }));
            expect(errors.materialValue).toBeDefined();
        });

        it('should pass when materialValue is 0', async () => {
            const errors = await validate(makeDto({ materialValue: 0 }));
            expect(errors).toHaveLength(0);
        });

        it('should pass when materialValue is a valid decimal', async () => {
            const errors = await validate(makeDto({ materialValue: 49.99 }));
            expect(errors).toHaveLength(0);
        });
    });

    describe('total', () => {
        it('should pass when total is omitted', async () => {
            const errors = await validate(makeDto({ total: undefined }));
            expect(errors).toHaveLength(0);
        });

        it('should pass when total is a valid positive number', async () => {
            const errors = await validate(makeDto({ total: 200 }));
            expect(errors).toHaveLength(0);
        });

        it('should pass when total is 0', async () => {
            const errors = await validate(makeDto({ total: 0 }));
            expect(errors).toHaveLength(0);
        });

        it('should pass when total is a positive decimal with up to 2 places', async () => {
            const errors = await validate(makeDto({ total: 99.99 }));
            expect(errors).toHaveLength(0);
        });

        it('should fail when total is negative', async () => {
            const errors = await getErrors(makeDto({ total: -1 }));
            expect(errors.total).toBeDefined();
        });

        it('should fail when total is NaN', async () => {
            const errors = await getErrors(makeDto({ total: NaN }));
            expect(errors.total).toBeDefined();
        });

        it('should fail when total is a string', async () => {
            const errors = await getErrors(makeDto({ total: 'abc' as any }));
            expect(errors.total).toBeDefined();
        });

        it('should fail when total has more than 2 decimal places', async () => {
            const errors = await getErrors(makeDto({ total: 99.999 }));
            expect(errors.total).toBeDefined();
        });
    });
});
