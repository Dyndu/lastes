import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { BAnalysisService } from './b-analysis.service';
import { RoomCategoryEntity, RoomExpenseItemEntity, RoomSectionEntity } from '../entities';
import { RoomDefaultSectionEnum } from '../../../common/enum';

@Injectable()
export class RoomSectionService {
    /**
     * Service responsible for handling room section operations
     */

    constructor(
        @Inject(forwardRef(() => BAnalysisService))
        readonly bAnalysisService: BAnalysisService,
    ) {}

    /**
     * Constructs and returns a new RoomSectionEntity from the provided required fields.
     * Assigns the label and optional room category to a new entities instance, then returns it.
     */
    buildRSection(required: {
        label: string;
        roomCategory?: RoomCategoryEntity;
    }): RoomSectionEntity {
        const result = new RoomSectionEntity();
        Object.assign(result, required);
        return result;
    }

    /**
     * Retrieves a RoomSectionEntity based on the provided criteria and optional relations.
     * Formats and logs the criteria, checks for the existence of an active room section,
     * and throws a not-found error if no matching section is found.
     */
    async retrieveRoomSectionByCriteria(
        criteria: Record<string, any>,
        relations?: string[],
    ): Promise<RoomSectionEntity> {
        const entries = this.bAnalysisService.otherUtils.formatCriteria(criteria);
        this.bAnalysisService.logger.info(`Find room section by ${entries}`);

        const isDataExist = await this.bAnalysisService.roomSectionRepo.findActiveOne(
            this.bAnalysisService.roomSectionRepo,
            criteria,
            relations,
        );

        if (!isDataExist)
            this.bAnalysisService.errorHandler.notFound(
                `Room section not found with ${entries}`,
                `Room section not found`,
            );

        return isDataExist;
    }

    /**
     * Ensures the uniqueness of a room section label before creation or update.
     * Validates that no active room section with the same label exists.
     * Throws a validation error if a duplicate label is found.
     */
    async ensureUniqueRSectionLabel(label: string) {
        const errors: Record<string, string> = {};
        await this.bAnalysisService.roomSectionRepo.assertUniqueActive(
            this.bAnalysisService.roomSectionRepo,
            errors,
            { label },
            'Room section',
        );

        if (Object.keys(errors).length > 0)
            throw this.bAnalysisService.errorHandler.validation(errors);
    }

    /**
     * Creates a new room section after validating the uniqueness of its label.
     * Ensures the label is unique, builds the RoomSectionEntity, and persists it via the repository.
     */
    async createRSection(
        roomCategory: RoomCategoryEntity,
        label: string,
    ): Promise<RoomSectionEntity> {
        await this.ensureUniqueRSectionLabel(label);

        return await this.bAnalysisService.roomSectionRepo.create(
            this.buildRSection({ roomCategory, label }),
        );
    }

    /**
     * Creates multiple room sections in bulk for a given room category.
     * Validates uniqueness of all labels upfront in a single query, then persists all entities at once.
     * Throws a validation error if any duplicate labels are found.
     */
    async createManyRSections(
        roomCategory: RoomCategoryEntity,
        labels: string[],
    ): Promise<RoomSectionEntity[]> {
        const existing = await this.bAnalysisService.roomSectionRepo.find({
            where: { label: In(labels), deleted: false },
        });

        if (existing.length > 0) {
            const errors: Record<string, string> = {};
            existing.forEach((section) => {
                errors[section.label] = `Room section '${section.label}' already exists`;
            });
            this.bAnalysisService.errorHandler.validation(errors);
        }

        return await this.bAnalysisService.roomSectionRepo.createMany(
            labels.map((label) => this.buildRSection({ roomCategory, label })),
        );
    }

    /**
     * Updates a RoomSectionEntity with the provided partial data.
     * Validates the presence of updates, trims the label field if provided, and persists the changes via the repository.
     * Returns a success message or the update result.
     */
    async updateRSection(
        result: RoomSectionEntity,
        itemized?: Partial<{
            label: string;
        }>,
    ) {
        if (!itemized || Object.keys(itemized).length === 0)
            return {
                message: 'No updates provided for room section',
            };

        const stringField = ['label'] as const;

        const updatePayload: Partial<RoomExpenseItemEntity> = {};

        stringField.forEach((field) => {
            if (itemized[field]?.trim()) updatePayload[field] = itemized[field].trim();
        });

        return await this.bAnalysisService.roomSectionRepo.update({ id: result.id }, updatePayload);
    }

    /**
     * Creates default room sections for a given room category.
     * Uses predefined labels from RoomDefaultSectionEnum and delegates the bulk creation to createManyRSections.
     */
    async createRoomDefaultSections(
        roomCategory: RoomCategoryEntity,
    ): Promise<RoomSectionEntity[]> {
        const labels = Object.values(RoomDefaultSectionEnum);
        return await this.createManyRSections(roomCategory, labels);
    }
}
