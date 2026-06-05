import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BrAnalyzerService } from './br-analyzer.service';
import { ABuilderEntity } from '../../a-builder/entities';

@Injectable()
export class TransformBrAnalyzerService {
    constructor(
        @Inject(forwardRef(() => BrAnalyzerService))
        private readonly brAnalyzerService: BrAnalyzerService,
    ) {}

    /**
     * Returns the list of related entities required for builder analysis checks.
     * Defines the entity relations to be loaded, including module, creator, and analyzer context.
     */
    brAnalyzerBuilderCheckEntities = () => ['module', 'createdBy', 'brAnalyzer'];

    /**
     * Returns an array of relation paths for BrRefi entity loading.
     * Includes the base brRefi relation and its eRepairs, irepairs, and oRepairs sub-relations.
     */
    brRefiEntities = () => ['brRefi', 'brRefi.eRepairs', 'brRefi.iRepairs', 'brRefi.oRepairs'];

    /**
     * Aggregates and returns all builder-related entities for the BR analyzer.
     * Combines entities from RA builder transformation, IStrategy refinance transformation,
     * and additional cost-related entities into a single collection.
     */
    brAnalyzerBuilderEntities = () => [
        ...this.brAnalyzerService.rAnalyzerService.transformRaService.rAnalyzerBuilderEntities(),
        ...this.brRefiEntities(),
        ...this.brAnalyzerService.rAnalyzerService.analysisService.transformAEntityService.builderCCoastEntities(),
    ];

    /**
     * Transforms a BR analyzer analysis builder entity into a structured response object.
     * Maps the analysis ID and conditionally transforms each analysis section (property details, acquisition details, repairs, construction cost, fixed expenses, and refinance),
     * applying dedicated transformation services when data is present, and returns a normalized BR analyzer builder payload.
     */
    transformBrAnalyzerServiceABuilder = (id: string, aBuilder: ABuilderEntity) => ({
        idAnalysis: id,
        propertyDetails: aBuilder.propertyDetails
            ? this.brAnalyzerService.rAnalyzerService.aBuilderService.transformABuilderService.transformPDetails(
                  aBuilder.propertyDetails,
              )
            : null,
        acquisitionDetails: aBuilder.acquisitionDetails
            ? this.brAnalyzerService.rAnalyzerService.aBuilderService.transformABuilderService.transformADetails(
                  aBuilder.acquisitionDetails,
              )
            : null,
        repairs: aBuilder.repairs
            ? this.brAnalyzerService.rAnalyzerService.aBuilderService.transformABuilderService.transformRepairs(
                  aBuilder.repairs,
              )
            : null,
        cCoast: aBuilder.cCoast
            ? this.brAnalyzerService.rAnalyzerService.aBuilderService.transformABuilderService.transformCCoast(
                  aBuilder.cCoast,
              )
            : null,
        fExpenses: aBuilder.fExpenses
            ? this.brAnalyzerService.rAnalyzerService.aBuilderService.transformABuilderService.transformFExpenses(
                  aBuilder.fExpenses,
              )
            : null,
        refinance: aBuilder.brRefi
            ? this.brAnalyzerService.rAnalyzerService.aBuilderService.transformABuilderService.transformBrRefi(
                  aBuilder.brRefi,
              )
            : null,
    });
}
