import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { RCalculatorService } from './r-calculator.service';
import { RoomCategoryEntity } from '../../b-analysis/entities';

@Injectable()
export class TransformRCalculatorService {
    /**
     * Transform rehab calculator entities to ui view
     */

    constructor(
        @Inject(forwardRef(() => RCalculatorService))
        readonly rCalculatorService: RCalculatorService,
    ) {}

    /**
     * Returns the list of relations required for retrieving analysis entities.
     * Defines the association paths to include module, creator, and rehab calculator data.
     */
    analysisEntities = () => [
        'module',
        'createdBy',
        'rehabCalculator',
        'rehabCalculator.analysisBuilder',
    ];

    /**
     * Returns the list of relations required for retrieving rehab calculator builder entities.
     * Defines the nested association paths to include rooms and their associated sections.
     */
    rCalculatorABuilderEntities = () => ['rooms', 'rooms.sections'];

    /**
     * Returns the list of relations required for retrieving rehab calculator builder rooms.
     * Defines the association path to include rooms data only.
     */
    rCBuilderRooms = () => ['rooms'];

    /**
     * Returns the list of relations required for retrieving room entities.
     * Defines the association path to include related sections data.
     */
    roomEntities = () => ['sections'];

    /**
     * Returns the list of relations required for retrieving section expense entities.
     * Defines the association path to include related expenses data.
     */
    sectionExpenses = () => ['expenses'];

    /**
     * Returns the list of relations required for retrieving room total calculation entities.
     * Defines the nested association paths to include sections and their related expenses data.
     */
    roomTotalEntities = () => ['sections', 'sections.expenses'];

    /**
     * Returns the list of relations required for retrieving rehab calculator summary data.
     * Defines the nested association paths to include module, rehab calculator,
     * analysis builder, rooms, sections, and their related expenses.
     */
    rCalculatorSummaryEntities = () => ['rooms', 'rooms.sections', 'rooms.sections.expenses'];

    /**
     * Transforms a B analysis entity into a rental calculation breakdown DTO.
     * Extracts the analysis identifier and maps room-based category data using a dedicated transformation service.
     * Merges the transformed category results into a single structured object.
     */
    transformRCBAnalysis = (items: RoomCategoryEntity[], id: string) => ({
        idAnalysis: id,
        ...this.rCalculatorService.bAnalysisService.transformBAEntitiesService.transformRCategories(
            items,
        ),
    });
}
