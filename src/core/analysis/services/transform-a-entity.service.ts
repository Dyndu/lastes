import { Injectable } from '@nestjs/common';
import { AnalysisEntity } from '../entities';
import { ModuleLabelEnum } from '../../../common/enum';

@Injectable()
export class TransformAEntityService {
    /**
     * Service responsible for handling transform analysis entities to ui view
     */

    /**
     * Returns the list of relations to eagerly load when resolving an analysis,
     * excluding the `property` relation when a `propertyId` is already provided.
     */
    resolveAnalysisDuplicateEntities = (propertyId?: string) => [
        'module',
        'rentalAnalysis',
        ...(propertyId ? [] : ['property']),
    ];

    /**
     * Returns the list of property-details relations required by the module builder,
     * including nested unit relations.
     */
    builderPDetailsEntities = () => ['propertyDetails', 'propertyDetails.units'];

    /**
     * Returns the list of acquisition-details relations required by the module builder,
     * including nested itemized relations.
     */
    builderADetailsEntities = () => ['acquisitionDetails', 'acquisitionDetails.itemized'];

    /**
     * Returns the list of repair relations required by the module builder,
     * covering interior, exterior, and other repair sub-relations.
     */
    builderRepairsEntities = () => [
        'repairs',
        'repairs.iRepairs',
        'repairs.eRepairs',
        'repairs.oRepairs',
    ];

    /**
     * Returns the combined list of common relations shared across all module builder types:
     * property details, acquisition details, and repairs.
     */
    mBuilderCommonEntities = () => [
        ...this.builderPDetailsEntities(),
        ...this.builderADetailsEntities(),
        ...this.builderRepairsEntities(),
    ];

    /**
     * Returns the list of sale relations required by the Fix & Flip module builder,
     * including nested itemized entries.
     */
    builderSaleEntities = () => ['sale', 'sale.itemized'];

    /**
     * Returns the list of holding-cost relations required by the Fix & Flip module builder,
     * including nested itemized entries.
     */
    builderHCoastEntities = () => ['hCoast', 'hCoast.itemized'];

    /**
     * Returns the list of carrying-cost relations required by the BRRRR module builder,
     * covering interior, exterior, and other cost sub-relations.
     */
    builderCCoastEntities = () => [
        'cCoast',
        'cCoast.iRepairs',
        'cCoast.eRepairs',
        'cCoast.oRepairs',
    ];

    /**
     * Returns the list of rental-duration relations required by the Investment Strategy
     * module builder, including nested itemized entries.
     */
    builderRDurationEntities = () => ['rDuration', 'rDuration.itemized'];

    /**
     * Returns the list of holding-duration relations required by the Wholesale module builder,
     * including nested itemized entries.
     */
    builderHDurationEntities = () => ['hDuration', 'hDuration.itemized'];

    /**
     * Returns the list of refinance relations required by the BRRRR and Investment Strategy
     * module builders, including nested itemized entries.
     */
    builderRefinanceEntities = () => ['refinance', 'refinance.itemized'];

    /**
     * Returns the list of fixed-expense relations shared across multiple module builders
     * (Rental, Creative Financing, BRRRR, Wholesale, Investment Strategy).
     */
    builderFExpenseEntities = () => ['fExpenses'];

    builderBrRefinanceEntities = () => [
        'brRefi',
        'brRefi.iRepairs',
        'brRefi.eRepairs',
        'brRefi.oRepairs',
    ];

    /**
     * Resolves the full list of ORM relations to load for a given module builder label,
     * combining the common relations with those specific to the requested analyzer type.
     */
    resolveBuilderRelationsByLabel(label: ModuleLabelEnum): string[] {
        const common = this.mBuilderCommonEntities();

        const specific: Partial<Record<ModuleLabelEnum, string[]>> = {
            [ModuleLabelEnum.FIX_FLIP_ANALYZER]: [
                ...this.builderSaleEntities(),
                ...this.builderHCoastEntities(),
            ],
            [ModuleLabelEnum.RENTAL_ANALYZER]: [...this.builderFExpenseEntities()],
            [ModuleLabelEnum.CREATIVE_FINANCING_ANALYZER]: [...this.builderFExpenseEntities()],
            [ModuleLabelEnum.BRRRR_ANALYZER]: [
                ...this.builderFExpenseEntities(),
                ...this.builderCCoastEntities(),
                ...this.builderBrRefinanceEntities(),
            ],
            [ModuleLabelEnum.WHOLESALE_ANALYZER]: [
                ...this.builderFExpenseEntities(),
                ...this.builderHDurationEntities(),
            ],
            [ModuleLabelEnum.INVESTMENT_STRATEGY_ANALYZER]: [
                ...this.builderFExpenseEntities(),
                ...this.builderRDurationEntities(),
                ...this.builderRefinanceEntities(),
            ],
        };

        return [...common, ...(specific[label] ?? [])];
    }

    /**
     * Transforms an AnalysisEntity into a simplified object containing essential analysis details:
     * ID, description, property location (city, state, zip code, address), and timestamps.
     */
    transformA = (a: AnalysisEntity) => ({
        id: a.id,
        description: a.description,
        city: a.property.city,
        state: a.property.state,
        zipCode: a.property.zipCode,
        address: a.property.formattedAddress,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
    });

    /**
     * Transforms an array of AnalysisEntity objects into an array of simplified analysis objects
     * using the transformA method for each entity.
     */
    transformAs = (as: AnalysisEntity[]) => as.map((a) => this.transformA(a));
}
