import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WholesaleService } from './wholesale.service';
import { ABuilderEntity } from '../../a-builder/entities';

@Injectable()
export class TransformWholesaleEntityService {
    /**
     * Service responsible for transforming wholesale entity to ui view
     */

    constructor(
        @Inject(forwardRef(() => WholesaleService))
        private readonly wholesaleService: WholesaleService,
    ) {}

    /**
     * Defines the entity relations required for wholesale builder retrieval.
     * Returns a fixed list of relational keys used to load module, creator, and wholesale associations.
     */
    wholesaleBuilderCheckEntities = () => ['module', 'createdBy', 'wholesale'];

    /**
     * Defines the complete set of entity relations required for wholesale builder retrieval.
     * Combines base analysis builder relations with holding duration relations, including itemized details,
     * to ensure full loading of wholesale analysis data.
     */
    wholesaleBuilderEntities = () => [
        ...this.wholesaleService.rAnalyzerService.transformRaService.rAnalyzerBuilderEntities(),
        ...this.wholesaleService.rAnalyzerService.analysisService.transformAEntityService.builderHDurationEntities(),
    ];

    /**
     * Transforms a wholesale analysis builder entity into a structured response object.
     * Maps each related analysis section (property details, acquisition details, repairs, fixed expenses, and holding duration),
     * applying dedicated transformation services when data is present, and returns a normalized wholesale builder payload.
     */
    transformWholesaleABuilder = (id: string, aBuilder: ABuilderEntity) => ({
        idAnalysis: id,
        propertyDetails: aBuilder?.propertyDetails
            ? this.wholesaleService.rAnalyzerService.aBuilderService.transformABuilderService.transformPDetails(
                  aBuilder.propertyDetails,
              )
            : null,
        acquisitionDetails: aBuilder?.acquisitionDetails
            ? this.wholesaleService.rAnalyzerService.aBuilderService.transformABuilderService.transformADetails(
                  aBuilder.acquisitionDetails,
              )
            : null,
        repairs: aBuilder?.repairs
            ? this.wholesaleService.rAnalyzerService.aBuilderService.transformABuilderService.transformRepairs(
                  aBuilder.repairs,
              )
            : null,
        fExpenses: aBuilder?.fExpenses
            ? this.wholesaleService.rAnalyzerService.aBuilderService.transformABuilderService.transformFExpenses(
                  aBuilder.fExpenses,
              )
            : null,
        hDuration: aBuilder?.hDuration
            ? this.wholesaleService.rAnalyzerService.aBuilderService.transformABuilderService.transformHDuration(
                  aBuilder.hDuration,
              )
            : null,
    });
}
