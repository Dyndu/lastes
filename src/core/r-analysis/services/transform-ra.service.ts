import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { RAnalysisService } from './r-analysis.service';
import { ABuilderEntity } from '../../a-builder/entities';

@Injectable()
export class TransformRaService {
    /**
     * Service responsible for transforming rental analyzer to ui view
     */

    constructor(
        @Inject(forwardRef(() => RAnalysisService))
        private readonly service: RAnalysisService,
    ) {}

    /**
     * Provides the list of relational paths required to load rental analyzer analysis check data.
     * Includes associations for the creator, module, and rental analysis.
     * Used to ensure necessary entities are fetched for analysis validation or checks.
     */
    rAnalyzerAnalysisCheck = () => [
        'createdBy',
        'module',
        'rentalAnalysis',
        'rentalAnalysis.params',
    ];

    /**
     * Returns the required relations for retrieving the monthly expense breakdown.
     * Defines the minimal dataset needed to compute or fetch expense-related details.
     */
    getMonthlyExpenseBreakdown = () => ['propertyDetails'];

    rAnalyzerBuilderEntities = () => [
        ...this.service.analysisService.transformAEntityService.mBuilderCommonEntities(),
        ...this.service.analysisService.transformAEntityService.builderFExpenseEntities(),
    ];

    rAnalyzerComparison = () => [
        'module',
        'property',
        'createdBy',
        'rentalAnalysis',
        'rentalAnalysis.params',
        'rentalAnalysis.analysisBuilder',
        'rentalAnalysis.analysisBuilder.propertyDetails',
        'rentalAnalysis.analysisBuilder.propertyDetails.units',
        'rentalAnalysis.analysisBuilder.acquisitionDetails',
        'rentalAnalysis.analysisBuilder.acquisitionDetails.itemized',
        'rentalAnalysis.analysisBuilder.fExpenses',
        'rentalAnalysis.analysisBuilder.repairs',
    ]

    /**
     * Transforms a rental analysis builder entity into a structured response object.
     * Maps and normalizes property details, acquisition details, repairs, and fixed expenses
     * using dedicated transformation services, with null fallback for missing sections.
     */
    transformRaABuilder = (id: string, aBuilder: ABuilderEntity) => ({
        idAnalysis: id,
        propertyDetails: aBuilder.propertyDetails
            ? this.service.aBuilderService.transformABuilderService.transformPDetails(
                  aBuilder.propertyDetails,
              )
            : null,
        acquisitionDetails: aBuilder.acquisitionDetails
            ? this.service.aBuilderService.transformABuilderService.transformADetails(
                  aBuilder.acquisitionDetails,
              )
            : null,
        repairs: aBuilder.repairs
            ? this.service.aBuilderService.transformABuilderService.transformRepairs(
                  aBuilder.repairs,
              )
            : null,
        fExpenses: aBuilder.fExpenses
            ? this.service.aBuilderService.transformABuilderService.transformFExpenses(
                  aBuilder.fExpenses,
              )
            : null,
    });
}
