import { Test, TestingModule } from '@nestjs/testing';
import { TransformPropertyEntityService } from './transform-property-entity.service';
import { PropertyEntity } from '../entities/property.entity';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const makeProperty = (overrides: Partial<PropertyEntity> = {}): PropertyEntity =>
    ({
        id: 'prop-1',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
        formattedAddress: '123 Main St, Springfield, IL 62701',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-06-01'),
        ...overrides,
    }) as PropertyEntity;

describe('TransformPropertyEntityService', () => {
    let service: TransformPropertyEntityService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [TransformPropertyEntityService],
        }).compile();

        service = module.get<TransformPropertyEntityService>(TransformPropertyEntityService);
    });

    afterEach(() => jest.clearAllMocks());

    describe('createPropertyEntity', () => {
        it('should return an array containing "createdBy"', () => {
            expect(service.createPropertyEntity()).toEqual(['createdBy']);
        });

        it('should return an array of length 1', () => {
            expect(service.createPropertyEntity()).toHaveLength(1);
        });

        it('should return a new array on each call', () => {
            expect(service.createPropertyEntity()).not.toBe(service.createPropertyEntity());
        });
    });

    describe('transformProperty', () => {
        it('should return an object with all expected keys', () => {
            expect(Object.keys(service.transformProperty(makeProperty()))).toEqual([
                'id',
                'city',
                'state',
                'zipCode',
                'address',
                'createdAt',
                'lastUsed',
            ]);
        });

        it('should map all fields correctly from the entities', () => {
            const p = makeProperty();
            expect(service.transformProperty(p)).toEqual({
                id: 'prop-1',
                city: 'Springfield',
                state: 'IL',
                zipCode: '62701',
                address: '123 Main St, Springfield, IL 62701',
                createdAt: p.createdAt,
                lastUsed: p.updatedAt,
            });
        });

        it('should map id', () => {
            expect(service.transformProperty(makeProperty({ id: 'prop-99' })).id).toBe('prop-99');
        });

        it('should map city', () => {
            expect(service.transformProperty(makeProperty({ city: 'Chicago' })).city).toBe(
                'Chicago',
            );
        });

        it('should map state', () => {
            expect(service.transformProperty(makeProperty({ state: 'NY' })).state).toBe('NY');
        });

        it('should map zipCode', () => {
            expect(service.transformProperty(makeProperty({ zipCode: '10001' })).zipCode).toBe(
                '10001',
            );
        });

        it('should map formattedAddress to address', () => {
            expect(
                service.transformProperty(makeProperty({ formattedAddress: '999 Broadway, NY' }))
                    .address,
            ).toBe('999 Broadway, NY');
        });

        it('should map createdAt', () => {
            const createdAt = new Date('2023-03-15');
            expect(service.transformProperty(makeProperty({ createdAt })).createdAt).toBe(
                createdAt,
            );
        });

        it('should map updatedAt to lastUsed', () => {
            const updatedAt = new Date('2025-11-20');
            expect(service.transformProperty(makeProperty({ updatedAt })).lastUsed).toBe(updatedAt);
        });

        it('should not expose updatedAt directly (only as lastUsed)', () => {
            const result = service.transformProperty(makeProperty());
            expect(result).not.toHaveProperty('updatedAt');
        });

        it('should not include extra properties beyond the defined output shape', () => {
            const result = service.transformProperty(makeProperty());
            expect(result).not.toHaveProperty('formattedAddress');
            expect(result).not.toHaveProperty('createdBy');
        });
    });

    describe('transformProperties', () => {
        it('should return an empty array when given an empty array', () => {
            expect(service.transformProperties([])).toEqual([]);
        });

        it('should return an array of the same length as the input', () => {
            expect(
                service.transformProperties([makeProperty(), makeProperty({ id: 'prop-2' })]),
            ).toHaveLength(2);
        });

        it('should transform every entities in the array', () => {
            const props = [
                makeProperty({ id: 'prop-1' }),
                makeProperty({ id: 'prop-2' }),
                makeProperty({ id: 'prop-3' }),
            ];
            const results = service.transformProperties(props);

            expect(results[0].id).toBe('prop-1');
            expect(results[1].id).toBe('prop-2');
            expect(results[2].id).toBe('prop-3');
        });

        it('should delegate each item transformation to transformProperty', () => {
            const props = [makeProperty(), makeProperty({ id: 'prop-2' })];
            const spy = jest.spyOn(service, 'transformProperty');

            service.transformProperties(props);

            expect(spy).toHaveBeenCalledTimes(2);
            expect(spy).toHaveBeenNthCalledWith(1, props[0]);
            expect(spy).toHaveBeenNthCalledWith(2, props[1]);
        });

        it('should preserve the order of the input array in the output', () => {
            const dates = [new Date('2024-01-01'), new Date('2024-06-01'), new Date('2025-01-01')];
            const results = service.transformProperties(
                dates.map((createdAt) => makeProperty({ createdAt })),
            );

            results.forEach((r, i) => expect(r.createdAt).toBe(dates[i]));
        });
    });
});
