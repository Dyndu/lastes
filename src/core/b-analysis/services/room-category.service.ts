import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BAnalysisService } from './b-analysis.service';
import { BAnalysisEntity, RoomCategoryEntity } from '../entities';
import { BAnalysisTypeEnum } from '../../../common/enum';

@Injectable()
export class RoomCategoryService {
    /**
     * Service responsible for handling room category operations
     */

    constructor(
        @Inject(forwardRef(() => BAnalysisService))
        readonly bAnalysisService: BAnalysisService,
    ) {}

    /**
     * Constructs and returns a new RoomCategoryEntity from the provided required fields.
     * Assigns the label, type, and optional business analysis entities to a new RoomCategoryEntity instance.
     */
    buildRCategory(required: {
        label: string;
        type: BAnalysisTypeEnum;
        bAnalysis?: BAnalysisEntity;
    }): RoomCategoryEntity {
        const result = new RoomCategoryEntity();
        Object.assign(result, required);
        return result;
    }

    /**
     * Retrieves a RoomCategoryEntity based on the provided criteria and optional relations.
     * Formats and logs the criteria, checks for the existence of an active room category,
     * and throws a not-found error if no matching category is found.
     */
    async retrieveRoomCategoryByCriteria(
        criteria: Record<string, any>,
        relations?: string[],
    ): Promise<RoomCategoryEntity> {
        const entries = this.bAnalysisService.otherUtils.formatCriteria(criteria);
        this.bAnalysisService.logger.info(`Find room category by ${entries}`);

        const isDataExist = await this.bAnalysisService.roomCategoryRepo.findActiveOne(
            this.bAnalysisService.roomCategoryRepo,
            criteria,
            relations,
        );

        if (!isDataExist)
            this.bAnalysisService.errorHandler.notFound(
                `Room category not found with ${entries}`,
                `Room category not found`,
            );

        return isDataExist;
    }

    /**
     * Creates or retrieves a room category for a given B analysis and type.
     * Checks existing rooms of the specified type and creates a new one when none exist or when forced by the creation flag.
     * Initializes default room sections for newly created categories and returns the resulting room entity.
     */
    async createRoomCategory(
        bAnalysis: BAnalysisEntity,
        type: BAnalysisTypeEnum,
        create: boolean = false,
    ) {
        const roomsOfType = bAnalysis.rooms?.filter((r) => r.type === type) ?? [];

        if (roomsOfType.length === 0 || create) {
            const label = `Room ${(roomsOfType?.length ?? 0) + 1}`;
            const room = await this.bAnalysisService.roomCategoryRepo.create(
                this.buildRCategory({ label, type, bAnalysis }),
            );
            await this.bAnalysisService.roomSectionService.createRoomDefaultSections(room);
            return room;
        }

        return bAnalysis.rooms[0];
    }
}
