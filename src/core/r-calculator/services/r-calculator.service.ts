import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { RCalculatorRepository } from '../r-calculator.repository';
import { ErrorHandlerService } from '../../../common/response';
import { OtherUtils } from '../../../utils/services/tools';
import { BAnalysisService } from '../../b-analysis/services';
import { CurrentUserInterface } from '../../../interface';
import { BAnalysisTypeEnum, ModuleLabelEnum } from '../../../common/enum';
import { RAnalysisService } from '../../r-analysis/services';
import { PreRCalculatorService } from './pre-r-calculator.service';
import { TransformRCalculatorService } from './transform-r-calculator.service';
import { ResolveREItemDto } from '../../b-analysis/dto';

@Injectable()
export class RCalculatorService {
    /**
     * Service responsible for handling rehab calculator operations
     */

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        @Inject(forwardRef(() => PreRCalculatorService))
        readonly preRCalculatorService: PreRCalculatorService,
        @Inject(forwardRef(() => TransformRCalculatorService))
        readonly transformRCalculatorService: TransformRCalculatorService,
        readonly rAnalysisService: RAnalysisService,
        readonly bAnalysisService: BAnalysisService,
        readonly rCalculatorRepo: RCalculatorRepository,
        readonly errorHandler: ErrorHandlerService,
        readonly otherUtils: OtherUtils,
    ) {}

    /**
     * Retrieves and computes the total for a room category by its ID.
     * Fetches the room category using the provided ID and specified criteria,
     * then calculates the room's total by delegating to the pre-calculator service.
     */
    async getRoomTotal(id: string): Promise<number> {
        this.logger.info(`Calculate the total expense of a room with id ${id}`);
        const isRoomExist =
            await this.bAnalysisService.roomCategoryService.retrieveRoomCategoryByCriteria(
                { id },
                this.transformRCalculatorService.roomTotalEntities(),
            );
        return this.preRCalculatorService.computeRoomTotal(isRoomExist);
    }

    /**
     * Calculates the total expense of a room section.
     * Retrieves the section with its related expenses and delegates computation
     * to the calculator service to derive the final aggregated total.
     */
    async getSectionTotal(id: string): Promise<number> {
        this.logger.info(`Calculate the total expense of a section with id ${id}`);

        const isSectionExist =
            await this.bAnalysisService.roomSectionService.retrieveRoomSectionByCriteria(
                { id },
                this.transformRCalculatorService.sectionExpenses(),
            );

        return this.preRCalculatorService.computeRSectionTotal(isSectionExist);
    }

    /**
     * Calculates the total expense of a room expense item row.
     * Retrieves the expense record and delegates computation to the calculator service.
     */
    async getExpenseRowTotal(id: string): Promise<number> {
        this.logger.info(`Calculate the total expense of a section record with id ${id}`);
        const isRecordExist =
            await this.bAnalysisService.roomExpenseItemService.retrieveRExpenseByCriteria({ id });
        return this.preRCalculatorService.computeREItemRowTotal(isRecordExist);
    }

    /**
     * Fetches a BAnalysisEntity by analysis ID and type, including optional relations.
     * Retrieves the analysis, then fetches the builder using the analysis's rehab calculator and specified type.
     */
    async fetchBuilderForRCalculator(user: CurrentUserInterface, id: string, relations: string[]) {
        const analysis = await this.rAnalysisService.getAnalysis(
            user,
            id,
            ModuleLabelEnum.REHAB_CALCULATOR,
            this.transformRCalculatorService.analysisEntities(),
        );

        return await this.preRCalculatorService.initializeRCalculatorForAnalysis(
            analysis,
            relations,
        );
    }

    /**
     * Resolves or initializes a BAnalysisEntity for a given analysis ID and type.
     * Retrieves the analysis, checks for an existing builder, and initializes a new one if none exists.
     * Returns the transformed builder and analysis details.
     */
    async resolveBuilderForAnalysis(
        user: CurrentUserInterface,
        id: string,
        type: BAnalysisTypeEnum,
    ) {
        this.logger.info(`Get rehab calculator analysis builder details from analysis id: ${id}`);
        const aBuilder = await this.fetchBuilderForRCalculator(
            user,
            id,
            this.transformRCalculatorService.rCalculatorABuilderEntities(),
        );

        const roomsOfType = aBuilder.rooms?.filter((r) => r.type === type) ?? [];
        if (roomsOfType.length > 0)
            return this.transformRCalculatorService.transformRCBAnalysis(roomsOfType, id);

        await this.bAnalysisService.roomCategoryService.createRoomCategory(aBuilder, type);
        const builder = await this.bAnalysisService.retrieveBAnalysisByCriteria(
            { id: aBuilder.id },
            this.transformRCalculatorService.rCalculatorABuilderEntities(),
        );
        return this.transformRCalculatorService.transformRCBAnalysis(
            builder.rooms.filter((r) => r.type === type),
            id,
        );
    }

    /**
     * Retrieves and transforms all rooms of a rehab calculator analysis builder, filtered by type.
     * Fetches the builder by analysis ID and type, then transforms the rooms into simplified DTO objects.
     */
    async getRoomsByType(user: CurrentUserInterface, id: string, type: BAnalysisTypeEnum) {
        this.logger.info(`Get all rooms of rehab calculator analysis builder of type ${type}`);
        const aBuilder = await this.fetchBuilderForRCalculator(
            user,
            id,
            this.transformRCalculatorService.rCBuilderRooms(),
        );

        return this.bAnalysisService.transformBAEntitiesService.transformRooms(
            aBuilder.rooms.filter((room) => room.type === type),
        );
    }

    /**
     * Retrieves and transforms all sections of a room by its ID.
     * Fetches the room category, then transforms its sections into simplified DTO objects.
     */
    async getRoomSections(id: string) {
        this.logger.info(`Retrieve sections of the room with ${id}`);
        const room = await this.bAnalysisService.roomCategoryService.retrieveRoomCategoryByCriteria(
            { id },
            this.transformRCalculatorService.roomEntities(),
        );
        return this.bAnalysisService.transformBAEntitiesService.transformRoomSections(
            room.sections,
        );
    }

    /**
     * Retrieves and transforms all expense records of a room section by its ID.
     * Fetches the section with its related expenses, then transforms the section into a detailed DTO object.
     */
    async getSectionRecords(id: string) {
        this.logger.info(`Get all records of the section with ${id}`);

        const section =
            await this.bAnalysisService.roomSectionService.retrieveRoomSectionByCriteria(
                { id },
                this.transformRCalculatorService.sectionExpenses(),
            );

        return this.bAnalysisService.transformBAEntitiesService.transformRSection(section);
    }

    /**
     * Adds a new room of the specified type to a rehab calculator analysis.
     * Fetches the builder by analysis ID and type, creates a new room category, and returns a success message.
     */
    async addRoomByType(user: CurrentUserInterface, id: string, type: BAnalysisTypeEnum) {
        this.logger.info(`Create a new room for the rehab calculator of type ${type}`);
        const aBuilder = await this.fetchBuilderForRCalculator(
            user,
            id,
            this.transformRCalculatorService.rCalculatorABuilderEntities(),
        );
        await this.bAnalysisService.roomCategoryService.createRoomCategory(aBuilder, type, true);

        return { message: 'New room created successfully.' };
    }

    /**
     * Adds new sections to an existing room by its ID.
     * Retrieves the room category, creates multiple sections using the provided labels,
     * and returns a success message.
     */
    async addSectionRoom(id: string, labels: string[]) {
        this.logger.info(`Add new sections to default one of `);
        const isRoomExist =
            await this.bAnalysisService.roomCategoryService.retrieveRoomCategoryByCriteria({ id });
        await this.bAnalysisService.roomSectionService.createManyRSections(isRoomExist, labels);
        return { message: 'New sections added to room successfully.' };
    }

    /**
     * Adds a new expense record to a room section by its ID.
     * Retrieves the section, resolves and persists the expense item using the provided data,
     * and returns a success message.
     */
    async addRecordToSection(id: string, data: ResolveREItemDto) {
        this.logger.info(`Add new record for section ${id}`);

        const section =
            await this.bAnalysisService.roomSectionService.retrieveRoomSectionByCriteria({ id });
        await this.bAnalysisService.roomExpenseItemService.resolveREItem(section, data);
        return { message: 'Record added to section successfully.' };
    }

    /**
     * Retrieves the rehab calculator analysis builder for a given analysis.
     * Fetches the analysis with required relations, then loads and returns the
     * associated builder with summary-related entities.
     */
    async listBuilder(user: CurrentUserInterface, id: string) {
        const analysis = await this.rAnalysisService.getAnalysis(
            user,
            id,
            ModuleLabelEnum.REHAB_CALCULATOR,
            this.transformRCalculatorService.analysisEntities(),
        );

        return await this.bAnalysisService.retrieveBAnalysisByCriteria(
            { id: analysis.rehabCalculator?.analysisBuilder?.id },
            this.transformRCalculatorService.rCalculatorSummaryEntities(),
        );
    }

    /**
     * Retrieves the rehab calculator summary for a given analysis.
     * Fetches the analysis with required relations, loads the associated builder
     * with summary entities, then computes and returns the aggregated summary data.
     */
    async getRCSummary(user: CurrentUserInterface, id: string) {
        this.logger.info(`Get all rehab calculator summary based on entries from user`);
        const aBuilder = await this.listBuilder(user, id);
        return this.preRCalculatorService.rCalculatorSummary(aBuilder);
    }

    /**
     * Retrieves the rehab calculator punch list for a given analysis.
     * Loads the analysis builder and delegates to the pre-calculator service
     * to generate and return the punch list based on existing entries.
     */
    async getRCPunchList(user: CurrentUserInterface, id: string) {
        this.logger.info(`Get rehab calculator punch list based on entries from user`);
        const aBuilder = await this.listBuilder(user, id);
        return this.preRCalculatorService.getPunchList(aBuilder);
    }
}
