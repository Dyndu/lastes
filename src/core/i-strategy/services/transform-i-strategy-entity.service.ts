import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { IStrategyService } from './i-strategy.service';
import { ABuilderEntity } from '../../a-builder/entities';

@Injectable()
export class TransformIStrategyEntityService {
    /**
     * Service responsible for transforming investment strategy entity to ui view
     */

    constructor(
        @Inject(forwardRef(() => IStrategyService))
        readonly iStrategyService: IStrategyService,
    ) {}

    /**
     * Defines the entity relations required for investment strategy builder retrieval.
     * Returns a fixed list of relational keys used to load module, creator, and investment strategy associations.
     */
    iStrategyBuilderCheckEntities = () => ['module', 'createdBy', 'iStrategy'];

    /**
     * Defines the complete set of entity relations required for investment strategy builder retrieval.
     * Combines base analysis builder relations with refinance itemized relations to ensure full loading of investment strategy data.
     */
    iStrategyBuilderEntities = () => [
        ...this.iStrategyService.rAnalyzerService.transformRaService.rAnalyzerBuilderEntities(),
        ...this.iStrategyService.rAnalyzerService.analysisService.transformAEntityService.builderRDurationEntities(),
        ...this.iStrategyService.rAnalyzerService.analysisService.transformAEntityService.builderRefinanceEntities(),
    ];

    /**
     * Transforms an investment strategy analysis builder entity into a structured response object.
     * Maps the analysis ID and conditionally transforms each analysis section (property details, acquisition details, repairs, rehab duration, fixed expenses, and refinance),
     * applying dedicated transformation services when data is present, and returns a normalized investment strategy builder payload.
     */
    transformIStrategyABuilder = (id: string, aBuilder: ABuilderEntity) => ({
        idAnalysis: id,
        propertyDetails: aBuilder.propertyDetails
            ? this.iStrategyService.rAnalyzerService.aBuilderService.transformABuilderService.transformPDetails(
                  aBuilder.propertyDetails,
              )
            : null,
        acquisitionDetails: aBuilder.acquisitionDetails
            ? this.iStrategyService.rAnalyzerService.aBuilderService.transformABuilderService.transformADetails(
                  aBuilder.acquisitionDetails,
              )
            : null,
        repairs: aBuilder.repairs
            ? this.iStrategyService.rAnalyzerService.aBuilderService.transformABuilderService.transformRepairs(
                  aBuilder.repairs,
              )
            : null,
        rDuration: aBuilder.rDuration
            ? this.iStrategyService.rAnalyzerService.aBuilderService.transformABuilderService.transformRDuration(
                  aBuilder.rDuration,
              )
            : null,
        fExpenses: aBuilder.fExpenses
            ? this.iStrategyService.rAnalyzerService.aBuilderService.transformABuilderService.transformFExpenses(
                  aBuilder.fExpenses,
              )
            : null,
        refinance: aBuilder.refinance
            ? this.iStrategyService.rAnalyzerService.aBuilderService.transformABuilderService.transformRefi(
                  aBuilder.refinance,
              )
            : null,
    });
}
