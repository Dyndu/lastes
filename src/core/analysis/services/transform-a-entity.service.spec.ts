import { Test, TestingModule } from '@nestjs/testing';
import { TransformAEntityService } from './transform-a-entity.service';
import { AnalysisEntity } from '../entities';
import { ModuleLabelEnum } from '../../../common/enum';

const makeAnalysis = (overrides: Partial<AnalysisEntity> = {}): AnalysisEntity =>
    ({
        id: 'analysis-1',
        description: 'Test analysis',
        property: {
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            formattedAddress: '123 Main St, New York, NY 10001',
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-06-01'),
        ...overrides,
    }) as unknown as AnalysisEntity;

describe('TransformAEntityService', () => {
    let service: TransformAEntityService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [TransformAEntityService],
        }).compile();

        service = module.get<TransformAEntityService>(TransformAEntityService);
    });

    afterEach(() => jest.clearAllMocks());

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('resolveAnalysisDuplicateEntities', () => {
        it('should include "property" when no propertyId is provided', () => {
            const result = service.resolveAnalysisDuplicateEntities();
            expect(result).toContain('property');
        });

        it('should include "module" when no propertyId is provided', () => {
            const result = service.resolveAnalysisDuplicateEntities();
            expect(result).toContain('module');
        });

        it('should return ["module", "property"] when no propertyId is provided', () => {
            expect(service.resolveAnalysisDuplicateEntities()).toEqual(['module', 'property']);
        });

        it('should exclude "property" when a propertyId is provided', () => {
            const result = service.resolveAnalysisDuplicateEntities('prop-123');
            expect(result).not.toContain('property');
        });

        it('should return only ["module"] when a propertyId is provided', () => {
            expect(service.resolveAnalysisDuplicateEntities('prop-123')).toEqual(['module']);
        });

        it('should still exclude "property" for any non-empty propertyId value', () => {
            expect(service.resolveAnalysisDuplicateEntities('x')).toEqual(['module']);
        });
    });

    describe('builderPDetailsEntities', () => {
        it('should return the property details relations', () => {
            expect(service.builderPDetailsEntities()).toEqual([
                'propertyDetails',
                'propertyDetails.units',
            ]);
        });
    });

    describe('builderADetailsEntities', () => {
        it('should return the acquisition details relations', () => {
            expect(service.builderADetailsEntities()).toEqual([
                'acquisitionDetails',
                'acquisitionDetails.itemized',
            ]);
        });
    });

    describe('builderRepairsEntities', () => {
        it('should return all repair sub-relations', () => {
            expect(service.builderRepairsEntities()).toEqual([
                'repairs',
                'repairs.iRepairs',
                'repairs.eRepairs',
                'repairs.oRepairs',
            ]);
        });
    });

    describe('mBuilderCommonEntities', () => {
        it('should contain all property details relations', () => {
            const result = service.mBuilderCommonEntities();
            expect(result).toEqual(expect.arrayContaining(service.builderPDetailsEntities()));
        });

        it('should contain all acquisition details relations', () => {
            const result = service.mBuilderCommonEntities();
            expect(result).toEqual(expect.arrayContaining(service.builderADetailsEntities()));
        });

        it('should contain all repair relations', () => {
            const result = service.mBuilderCommonEntities();
            expect(result).toEqual(expect.arrayContaining(service.builderRepairsEntities()));
        });

        it('should be the exact concatenation of pDetails + aDetails + repairs', () => {
            expect(service.mBuilderCommonEntities()).toEqual([
                ...service.builderPDetailsEntities(),
                ...service.builderADetailsEntities(),
                ...service.builderRepairsEntities(),
            ]);
        });
    });

    describe('builderSaleEntities', () => {
        it('should return sale and sale.itemized', () => {
            expect(service.builderSaleEntities()).toEqual(['sale', 'sale.itemized']);
        });
    });

    describe('builderHCoastEntities', () => {
        it('should return hCoast and hCoast.itemized', () => {
            expect(service.builderHCoastEntities()).toEqual(['hCoast', 'hCoast.itemized']);
        });
    });

    describe('builderCCoastEntities', () => {
        it('should return all carrying cost sub-relations', () => {
            expect(service.builderCCoastEntities()).toEqual([
                'cCoast',
                'cCoast.iRepairs',
                'cCoast.eRepairs',
                'cCoast.oRepairs',
            ]);
        });
    });

    describe('builderRDurationEntities', () => {
        it('should return rDuration and rDuration.itemized', () => {
            expect(service.builderRDurationEntities()).toEqual(['rDuration', 'rDuration.itemized']);
        });
    });

    describe('builderHDurationEntities', () => {
        it('should return hDuration and hDuration.itemized', () => {
            expect(service.builderHDurationEntities()).toEqual(['hDuration', 'hDuration.itemized']);
        });
    });

    describe('builderRefinanceEntities', () => {
        it('should return refinance and refinance.itemized', () => {
            expect(service.builderRefinanceEntities()).toEqual(['refinance', 'refinance.itemized']);
        });
    });

    describe('builderFExpenseEntities', () => {
        it('should return fExpenses', () => {
            expect(service.builderFExpenseEntities()).toEqual(['fExpenses']);
        });
    });

    describe('resolveBuilderRelationsByLabel', () => {
        const commonRelations = () => [
            'propertyDetails',
            'propertyDetails.units',
            'acquisitionDetails',
            'acquisitionDetails.itemized',
            'repairs',
            'repairs.iRepairs',
            'repairs.eRepairs',
            'repairs.oRepairs',
        ];

        it('should always include common relations regardless of label', () => {
            Object.values(ModuleLabelEnum).forEach((label) => {
                const result = service.resolveBuilderRelationsByLabel(label);
                expect(result).toEqual(expect.arrayContaining(commonRelations()));
            });
        });

        it('should include sale and hCoast relations for FIX_FLIP_ANALYZER', () => {
            const result = service.resolveBuilderRelationsByLabel(
                ModuleLabelEnum.FIX_FLIP_ANALYZER,
            );
            expect(result).toEqual(
                expect.arrayContaining(['sale', 'sale.itemized', 'hCoast', 'hCoast.itemized']),
            );
        });

        it('should not include fExpenses for FIX_FLIP_ANALYZER', () => {
            const result = service.resolveBuilderRelationsByLabel(
                ModuleLabelEnum.FIX_FLIP_ANALYZER,
            );
            expect(result).not.toContain('fExpenses');
        });

        it('should include only fExpenses as specific relation for RENTAL_ANALYZER', () => {
            const result = service.resolveBuilderRelationsByLabel(ModuleLabelEnum.RENTAL_ANALYZER);
            expect(result).toContain('fExpenses');
            expect(result).not.toContain('sale');
            expect(result).not.toContain('refinance');
        });

        it('should include only fExpenses as specific relation for CREATIVE_FINANCING_ANALYZER', () => {
            const result = service.resolveBuilderRelationsByLabel(
                ModuleLabelEnum.CREATIVE_FINANCING_ANALYZER,
            );
            expect(result).toContain('fExpenses');
            expect(result).not.toContain('sale');
            expect(result).not.toContain('refinance');
        });

        it('should include fExpenses, cCoast relations, and refinance for BRRRR_ANALYZER', () => {
            const result = service.resolveBuilderRelationsByLabel(ModuleLabelEnum.BRRRR_ANALYZER);
            expect(result).toEqual(
                expect.arrayContaining([
                    'fExpenses',
                    'cCoast',
                    'cCoast.iRepairs',
                    'cCoast.eRepairs',
                    'cCoast.oRepairs',
                    'refinance',
                    'refinance.itemized',
                ]),
            );
        });

        it('should not include sale or hDuration for BRRRR_ANALYZER', () => {
            const result = service.resolveBuilderRelationsByLabel(ModuleLabelEnum.BRRRR_ANALYZER);
            expect(result).not.toContain('sale');
            expect(result).not.toContain('hDuration');
        });

        it('should include fExpenses and hDuration relations for WHOLESALE_ANALYZER', () => {
            const result = service.resolveBuilderRelationsByLabel(
                ModuleLabelEnum.WHOLESALE_ANALYZER,
            );
            expect(result).toEqual(
                expect.arrayContaining(['fExpenses', 'hDuration', 'hDuration.itemized']),
            );
        });

        it('should not include refinance or rDuration for WHOLESALE_ANALYZER', () => {
            const result = service.resolveBuilderRelationsByLabel(
                ModuleLabelEnum.WHOLESALE_ANALYZER,
            );
            expect(result).not.toContain('refinance');
            expect(result).not.toContain('rDuration');
        });

        it('should include fExpenses, rDuration, and refinance for INVESTMENT_STRATEGY_ANALYZER', () => {
            const result = service.resolveBuilderRelationsByLabel(
                ModuleLabelEnum.INVESTMENT_STRATEGY_ANALYZER,
            );
            expect(result).toEqual(
                expect.arrayContaining([
                    'fExpenses',
                    'rDuration',
                    'rDuration.itemized',
                    'refinance',
                    'refinance.itemized',
                ]),
            );
        });

        it('should not include sale or hDuration for INVESTMENT_STRATEGY_ANALYZER', () => {
            const result = service.resolveBuilderRelationsByLabel(
                ModuleLabelEnum.INVESTMENT_STRATEGY_ANALYZER,
            );
            expect(result).not.toContain('sale');
            expect(result).not.toContain('hDuration');
        });

        it('should start with common relations before specific ones', () => {
            const result = service.resolveBuilderRelationsByLabel(
                ModuleLabelEnum.FIX_FLIP_ANALYZER,
            );
            const common = commonRelations();
            expect(result.slice(0, common.length)).toEqual(common);
        });
    });

    describe('transformA', () => {
        it('should transform an analysis entity into the correct simplified object', () => {
            const result = service.transformA(makeAnalysis());
            expect(result).toEqual({
                id: 'analysis-1',
                description: 'Test analysis',
                city: 'New York',
                state: 'NY',
                zipCode: '10001',
                address: '123 Main St, New York, NY 10001',
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-06-01'),
            });
        });

        it('should map id from entity', () => {
            expect(service.transformA(makeAnalysis({ id: 'xyz-999' })).id).toBe('xyz-999');
        });

        it('should map description from entity', () => {
            expect(
                service.transformA(makeAnalysis({ description: 'My analysis' })).description,
            ).toBe('My analysis');
        });

        it('should map city from property', () => {
            const result = service.transformA(
                makeAnalysis({
                    property: {
                        city: 'Chicago',
                        state: 'IL',
                        zipCode: '60601',
                        formattedAddress: 'addr',
                    } as any,
                }),
            );
            expect(result.city).toBe('Chicago');
        });

        it('should map state from property', () => {
            const result = service.transformA(
                makeAnalysis({
                    property: {
                        city: 'Chicago',
                        state: 'IL',
                        zipCode: '60601',
                        formattedAddress: 'addr',
                    } as any,
                }),
            );
            expect(result.state).toBe('IL');
        });

        it('should map zipCode from property', () => {
            const result = service.transformA(
                makeAnalysis({
                    property: {
                        city: 'X',
                        state: 'Y',
                        zipCode: '99999',
                        formattedAddress: 'addr',
                    } as any,
                }),
            );
            expect(result.zipCode).toBe('99999');
        });

        it('should map address from property.formattedAddress', () => {
            const result = service.transformA(
                makeAnalysis({
                    property: {
                        city: 'X',
                        state: 'Y',
                        zipCode: '0',
                        formattedAddress: '456 Sunset Blvd',
                    } as any,
                }),
            );
            expect(result.address).toBe('456 Sunset Blvd');
        });

        it('should map createdAt from entity', () => {
            const date = new Date('2023-03-15');
            expect(service.transformA(makeAnalysis({ createdAt: date })).createdAt).toBe(date);
        });

        it('should map updatedAt from entity', () => {
            const date = new Date('2025-12-01');
            expect(service.transformA(makeAnalysis({ updatedAt: date })).updatedAt).toBe(date);
        });

        it('should return only the expected keys (no extra fields)', () => {
            const result = service.transformA(makeAnalysis());
            expect(Object.keys(result).sort()).toEqual(
                [
                    'id',
                    'description',
                    'city',
                    'state',
                    'zipCode',
                    'address',
                    'createdAt',
                    'updatedAt',
                ].sort(),
            );
        });

        it('should correctly map a fully different entity', () => {
            const result = service.transformA(
                makeAnalysis({
                    id: 'analysis-2',
                    description: 'Another analysis',
                    property: {
                        city: 'Los Angeles',
                        state: 'CA',
                        zipCode: '90001',
                        formattedAddress: '456 Sunset Blvd, Los Angeles, CA 90001',
                    } as any,
                    createdAt: new Date('2022-05-10'),
                    updatedAt: new Date('2023-09-20'),
                }),
            );
            expect(result).toEqual({
                id: 'analysis-2',
                description: 'Another analysis',
                city: 'Los Angeles',
                state: 'CA',
                zipCode: '90001',
                address: '456 Sunset Blvd, Los Angeles, CA 90001',
                createdAt: new Date('2022-05-10'),
                updatedAt: new Date('2023-09-20'),
            });
        });
    });

    describe('transformAs', () => {
        it('should return an empty array when given an empty array', () => {
            expect(service.transformAs([])).toEqual([]);
        });

        it('should return a single-element array when given one entity', () => {
            const result = service.transformAs([makeAnalysis()]);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('analysis-1');
        });

        it('should transform an array of 2 entities correctly', () => {
            const analyses = [
                makeAnalysis({ id: 'analysis-1' }),
                makeAnalysis({
                    id: 'analysis-2',
                    description: 'Second analysis',
                    property: {
                        city: 'Chicago',
                        state: 'IL',
                        zipCode: '60601',
                        formattedAddress: '789 Lake Shore Dr, Chicago, IL 60601',
                    } as any,
                }),
            ];
            const result = service.transformAs(analyses);
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('analysis-1');
            expect(result[1].id).toBe('analysis-2');
            expect(result[1].city).toBe('Chicago');
            expect(result[1].address).toBe('789 Lake Shore Dr, Chicago, IL 60601');
        });

        it('should delegate each element to transformA', () => {
            const spy = jest.spyOn(service, 'transformA');
            const analyses = [
                makeAnalysis({ id: 'a-1' }),
                makeAnalysis({ id: 'a-2' }),
                makeAnalysis({ id: 'a-3' }),
            ];
            service.transformAs(analyses);
            expect(spy).toHaveBeenCalledTimes(3);
            expect(spy).toHaveBeenNthCalledWith(1, analyses[0]);
            expect(spy).toHaveBeenNthCalledWith(2, analyses[1]);
            expect(spy).toHaveBeenNthCalledWith(3, analyses[2]);
        });

        it('should return results in the same order as input', () => {
            const analyses = [
                makeAnalysis({ id: 'first' }),
                makeAnalysis({ id: 'second' }),
                makeAnalysis({ id: 'third' }),
            ];
            expect(service.transformAs(analyses).map((r) => r.id)).toEqual([
                'first',
                'second',
                'third',
            ]);
        });

        it('should produce objects with the same shape as transformA', () => {
            const analysis = makeAnalysis();
            const [fromArray] = service.transformAs([analysis]);
            const direct = service.transformA(analysis);
            expect(fromArray).toEqual(direct);
        });
    });
});
