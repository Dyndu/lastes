import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { FFlipService } from './f-flip.service';
import { ABuilderEntity } from '../../a-builder/entities';

@Injectable()
export class TransformFFlipService {
    /**
     * Service responsible for transforming fix & flip entities to ui view
     */

    constructor(
        @Inject(forwardRef(() => FFlipService))
        private readonly service: FFlipService,
    ) {}

    /**
     * Provides the list of relational paths required to load analysis check data.
     * Includes associations for the creator, module, and flip analysis details.
     * Used to ensure necessary entities are fetched for analysis validation or checks.
     */
    analysisCheckEntities = () => ['createdBy', 'module', 'fFlip'];

    /**
     * Provides the list of relational paths required to load F flip analysis builder details.
     * Includes nested associations for property details, acquisition details, repairs and their subcategories, fixed expenses, holding cost, and sale data with their itemized breakdowns.
     * Used to ensure all necessary entities are fetched for F flip analysis builder processing.
     */
    fFlipABuilderRelations = () => [
        ...this.service.rAnalyzerService.analysisService.transformAEntityService.builderPDetailsEntities(),
        ...this.service.rAnalyzerService.analysisService.transformAEntityService.builderHCoastEntities(),
        ...this.service.rAnalyzerService.analysisService.transformAEntityService.builderSaleEntities(),
    ];

    /**
     * Transforms a full F flip analysis builder entity into a consolidated DTO.
     * Extracts the analysis identifier and maps all related builder sections including property details, acquisition details, repairs, fixed expenses, holding cost, and sale data.
     * Each section is conditionally transformed using dedicated transformation services when data is available; otherwise returns null for missing fields.
     */
    transformFFlipABuilder = (id: string, aBuilder: ABuilderEntity) => ({
        idAnalysis: id,
        propertyDetails: aBuilder.propertyDetails
            ? this.service.rAnalyzerService.aBuilderService.transformABuilderService.transformPDetails(
                  aBuilder.propertyDetails,
              )
            : null,
        acquisitionDetails: aBuilder.acquisitionDetails
            ? this.service.rAnalyzerService.aBuilderService.transformABuilderService.transformADetails(
                  aBuilder.acquisitionDetails,
              )
            : null,
        repairs: aBuilder.repairs
            ? this.service.rAnalyzerService.aBuilderService.transformABuilderService.transformRepairs(
                  aBuilder.repairs,
              )
            : null,
        hCoast: aBuilder.hCoast
            ? this.service.rAnalyzerService.aBuilderService.transformABuilderService.transformHCoast(
                  aBuilder.hCoast,
              )
            : null,
        sale: aBuilder.sale
            ? this.service.rAnalyzerService.aBuilderService.transformABuilderService.transformSale(
                  aBuilder.sale,
              )
            : null,
    });

    /**
     * Transforms a fix and flip builder entity into a complete summary breakdown response.
     * Extends the base builder transformation with financial metrics, cost breakdowns,
     * investment summary, project timeline, and projected profit scenarios.
     */
    transformFFlipSummaryBreakdown = (id: string, aBuilder: ABuilderEntity) => ({
        ...this.transformFFlipABuilder(id, aBuilder),
        maximumOffer: this.service.fFlipSummaryService.calculateMaxOffer(aBuilder),
        repairCoast: aBuilder.repairs?.total ?? 0,
        holdingCoast: this.service.fFlipSummaryService.calculateHoldingCost(aBuilder),
        purchaseCoast: this.service.fFlipSummaryService.calculateAcquisitionCost(aBuilder),
        saleCoast: this.service.fFlipSummaryService.calculateSaleCost(aBuilder),
        investSummary: this.service.fFlipSummaryService.getInvestmentSummary(aBuilder),
        pTimeline: this.service.fFlipSummaryService.getProjectTimeline(aBuilder),
        projectedProfits: this.service.fFlipSummaryService.getProjectProfits(aBuilder),
    });
}
